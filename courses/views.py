from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.views import generic
from django.contrib.auth.decorators import login_required

from django.db.models import Q
import re, datetime, itertools
import ujson, urllib
from models import Course
from functools import reduce
from random import randint
from django.views.decorators.http import require_http_methods
from serializers import CourseSerializer, MeetingSerializer, ProfileSerializer

@login_required
# Primary filter view
def course_filter(request):
    # prefetch "meetings" relationship to speed things up
    courses = Course.objects.prefetch_related('meetings').all()

    # Regexes for matching with more structured queries
    CLASS_DAY_REGEX = re.compile(r'^days(exact)?_((m)?(t)?(w)?(h)?(f)?)$', re.IGNORECASE)
    CLASS_TIME_REGEX = re.compile(r'^starttime_(\|A?\d\d?:\d{2}\s?(AM|PM))+$', re.IGNORECASE)
    DEPT_REGEX = re.compile(r'^depts_(\|[a-zA-Z]{3})+$', re.IGNORECASE)
    COURSE_NUM_REGEX = re.compile(r'^nums_(\|(\d|\?){3}(\w|\?)?)+$')
    RATING_REGEX = re.compile(r'^rating_\d\.\d$')

    # split queries
    prelim_queries = request.path[1:].split("/")
    # convert html encodings
    queries = [urllib.unquote(q) for q in prelim_queries]

    depts = [] # list of departments and
    nums = []  # list of course numbers
    isLucky = False # boolean indicating if the user wants a random course

    # start from 2 because first two are courses/filter
    for q in queries[2:]:
        qlower = q.lower()

        # first check for the I'm feeling lucky filter
        if qlower == "lucky":
            isLucky = True
            continue

        # include/exclude distribution areas
        if "includearea_" in q:
            # len is fast in python, so will often see it used to find index
            q_area = '^'+q[len("includearea_|"):]+'$'
            try:
                re.compile(q_area)
                courses = courses.filter(area__iregex=q_area)
            except re.error:
                courses = Course.objects.none()
                break

        elif "excludearea_" in q:
            q_area = '^'+q[len("excludearea_|"):]+'$'
            try:
                re.compile(q_area)
                courses = courses.exclude(area__iregex=q_area)
            except re.error:
                courses = Course.objects.none()
                break

        # days and days exact (matches exactly) filter
        elif CLASS_DAY_REGEX.match(q):
            q = q.replace('H', 'Th')
            if "exact" in q:
                courses = courses.filter(meetings__days__iexact=q[len("daysexact_"):], meetings__is_primary=True).distinct()
            else:
                # uses positive lookahead to make sure at least one of chars exist
                q_days = "^(?=\w)"+"("+"?".join(q[len("days_"):]) + "?" + ")" + "$"
                # special case for thursday...
                q_days = q_days.replace('T?h?', '(Th)?')
                try:
                    re.compile(q_days)
                    courses = courses.filter(meetings__days__iregex=q_days, meetings__is_primary=True).distinct()
                except re.error:
                    courses = Course.objects.none()
                    break

        # filter to match starting times, within an hour
        elif CLASS_TIME_REGEX.match(q):
            # to handle after 6 case
            q = q.replace("|A6:00 pm", "|6:00 pm|7:00 pm|8:00 pm|9:00 pm|10:00 pm")
            times = q[len("starttime_|"):].split("|")
            try:
                begins = [datetime.datetime.strptime(t, "%I:%M %p") for t in times]
            except:
                courses = Course.objects.none()
                break
            ends = [(t + datetime.timedelta(seconds=59*60)).time() for t in begins]
            begins = [t.time() for t in begins]
            time_blocks = zip(begins, ends)

            courses = courses.filter(reduce(lambda x, y: x | y, [Q(meetings__start_time__range=tb, meetings__is_primary=True) for tb in time_blocks])).distinct()

        # course conflict filter, in format conflict_|COS 126|COS 333, etc.
        elif "conflict_" in q:
            conflicts = q[len("conflict_|"):].split("|") # conflicting courses

            # first make fixed list of meetings (so everything in proper
            # order), no mixing of days and times
            meet = []
            for c in conflicts:
                try:
                    meet += list(Course.objects.get(deptnum__icontains=c)
                        .meetings.filter(is_primary=True))
                except:
                    pass # try to match other courses
            if meet == []: # no potential conflicts
                continue
            begins = [m.start_time for m in meet]
            ends = [m.end_time for m in meet]
            days = [('|'.join(m.days)).replace('T|h', 'Th') for m in meet]

            time_blocks = zip(zip(begins, ends), days) #[((11:00, 11:50), "MW")]

            # we construct the regex expressions so no need to check
            # (not query dependent)
            conf1 = courses.filter(reduce(lambda x, y: x | y,
                [Q(meetings__start_time__range=tb[0],
                meetings__days__iregex=tb[1], meetings__is_primary=True)
                for tb in time_blocks])).distinct().values_list('registrar_id',
                flat=True)

            conf2 = courses.filter(reduce(lambda x, y: x | y,
                [Q(meetings__end_time__range=tb[0],
                meetings__days__iregex=tb[1], meetings__is_primary=True)
                for tb in time_blocks])).distinct().values_list('registrar_id',
                flat=True)

            conf3 = courses.filter(reduce(lambda x, y: x | y,
                [Q(meetings__start_time__lte=tb[0][0],
                meetings__end_time__gte=tb[0][1], meetings__days__iregex=tb[1],
                meetings__is_primary=True)
                for tb in time_blocks])).distinct().values_list('registrar_id',
                flat=True)

            conflicting = list(conf1)+list(conf2)+list(conf3)
            courses = courses.exclude(registrar_id__in = conflicting)

        # Department and course number filters
        # Both have multiple possible inputs, all consolidated in one query
        elif DEPT_REGEX.match(q):
            depts = q[len("depts_|"):].split("|")
        elif COURSE_NUM_REGEX.match(q):
            q_num = q[len('nums_|'):]
            # replace question marks (our "regex" for match anything)
            if len(q_num) == 4 and q_num[-1] == "?":
                #last "digit" may be a letter, so use \w as regex instead
                q_num = q_num[:-1] + '\w'

            # replace the rest of the question marks with digit regexes
            q_num = q_num.replace('?', '\d') # restrict to numerical search
            nums = q_num.split("|")

        # pdf and audit filters
        elif q == 'pdfonly':
            courses = courses.filter(pdfonly=True)
        elif q == 'pdfable':
            courses = courses.filter(pdfable=True)
        elif q == 'no-prereq':
            courses = courses.filter(prereqs="")
        elif q == 'auditable':
            courses = courses.filter(auditable=True)

        # include/exclude grading
        elif 'includegrade_' in qlower:
            grade_include = qlower[len("includegrade_|"):]
            if 'finalexam' in grade_include:
                courses = courses.filter(final=True)
            elif 'participation' in grade_include:
                courses = courses.filter(participation=True)
            elif 'paper' in grade_include:
                courses = courses.filter(papers=True)
            elif 'take-homeexam' in grade_include:
                courses = courses.filter(takehome=True)
            elif 'midtermexam' in grade_include:
                courses = courses.filter(midterm=True)
            elif 'problemset' in grade_include:
                courses = courses.filter(pset=True)
            #added
            elif 'presentation' in grade_include:
                courses = courses.filter(presentation=True)
            elif 'quiz' in grade_include:
                courses = courses.filter(quiz=True)
        elif 'excludegrade_' in qlower:
            grade_exclude = qlower[len("excludegrade_|"):]
            if 'finalexam' in grade_exclude:
                courses = courses.filter(final=False)
            elif 'participation' in grade_exclude:
                courses = courses.filter(participation=False)
            elif 'paper' in grade_exclude:
                courses = courses.filter(papers=False)
            elif 'take-homeexam' in grade_exclude:
                courses = courses.filter(takehome=False)
            elif 'midtermexam' in grade_exclude:
                courses = courses.filter(midterm=False)
            elif 'problemset' in grade_exclude:
                courses = courses.filter(pset=False)
            #added
            elif 'presentation' in grade_exclude:
                courses = courses.filter(presentation=False)
            elif 'quiz' in grade_exclude:
                courses = courses.filter(quiz=False)

        # no grad/grad course filters, rely on the the course numbers being
        # in the 500s
        elif q == 'no_grad':
            courses = courses.exclude(deptnum__iregex=r'5\d\d')
        elif q == 'only_grad':
            courses = courses.filter(deptnum__iregex=r'5\d\d')

        # freeform input fields: title and keyword
        # title has a harsher matching (uses contains vs regex search)
        elif "title_" in q:
            q_title = q[len("title_"):]
            # return nothing if empty query (i.e. faulty query)
            if q_title == '':
                courses = Course.objects.none()
                break
            courses = courses.filter(title__icontains=q_title)
        elif "keyword_" in q:
            q_keyword = q[len("keyword_"):]
            try:
                re.compile(q_keyword)
                courses = courses.filter(description__iregex=q_keyword)
            except re.error:
                courses = Course.objects.none()
                break

        # professor filter, union search (returns courses that matches any one
        # of the queries)
        elif "profs_" in q:
            q_prof = q[len("profs_|"):].split("|")
            # remove empty strings
            q_prof = filter(None, q_prof)
            if q_prof == []: # can't reduce empty list
                courses = Course.objects.none()
                break
            courses = courses.filter(reduce(lambda x, y: x | y, [Q(professors__icontains=p) for p in q_prof]))

        # certificate filter, courses in DEPT NUM format like conflict filter
        elif "cert_" in q:
            q_cert = q[len("cert_|"):]
            try:
                re.compile(q_cert)
                courses = courses.filter(deptnum__iregex=q_cert)
            except re.error:
                courses = Course.objects.none()
                break

        # rating filter, searches for courses with higher rating than query
        elif RATING_REGEX.match(q):
            # return courses with higher rating
            q_rating = q[len("rating_"):]
            try:
                float(q_rating)
                courses = courses.filter(rating__gte=float(q_rating))
            except ValueError:
                courses = Course.objects.none()
                break

        # Max pages of reading per week filter, returns all with a smaller
        # amount of reading.
        # Since default is 9000 pages, courses with no mention of pages are
        # never returned
        elif "pages_" in q:
            q_pages = q[len("pages_"):]
            try:
                float(q_pages)
                courses = courses.filter(pages__lte=float(q_pages))
            except ValueError:
                courses = Course.objects.none()
                break

        elif "frosh" in q:
            courses = courses.exclude(otherinfo__iregex="Not Open to Freshmen")
            courses = courses.exclude(otherreq__iregex="Not Open to Freshmen")

        elif "trip" in q:
            courses = courses.filter(Q(description__iregex="(field trip)|(site visit)|(class visits)|(museum visits)|(excursion)") | Q(otherreq__icontains="travel"))

        else:
            courses = Course.objects.none()
            break # match nothing, return early

    # if had both depts and num fields, search by all possible pairs
    if depts != [] and nums != []:
        all_pairs = list(itertools.product(depts, nums))
        deptnums = [x + " " + y for x,y in all_pairs]
        to_search = '|'.join(deptnums)
        try:
            re.compile(to_search)
            courses =  courses.filter(deptnum__iregex=to_search)
        except re.error:
            courses = Course.objects.none()
    elif depts != []: # otherwise, just search by department
        to_search = '|'.join(depts)
        try:
            re.compile(to_search)
            courses =  courses.filter(deptnum__iregex=to_search)
        except re.error:
            courses = Course.objects.none()
    elif nums != []: # or just by number
        to_search = '|'.join(nums)
        try:
            re.compile(to_search)
            courses =  courses.filter(deptnum__iregex=to_search)
        except re.error:
            courses = Course.objects.none()

    # if the user is feeling lucky ^_^
    if isLucky:
        chosenOne = randint(0, courses.count()-1) #-1 because python is dumb
        courses = courses.all()[chosenOne]
        serial_list = [CourseSerializer(courses).data]
        return HttpResponse(ujson.dumps(serial_list, ensure_ascii=False), content_type='application/json')

    if courses == Course.objects.none(): # no match
        return HttpResponse([], content_type='application/json')

    serial_list = CourseSerializer(courses, many = True).data
    return HttpResponse(ujson.dumps(serial_list, ensure_ascii=False), content_type='application/json')

@login_required
# Views to return all possible values to for autocomplete fields
def profs(request):
    profs = Course.objects.values_list('professors', flat=True)
    prof_list = []
    for p in profs:
        prof_list = list(set(prof_list + [x.strip() for x in p.split(",")]))
    return HttpResponse(ujson.dumps(sorted(prof_list), ensure_ascii=False), content_type='application/json')
@login_required
def titles(request):
    titles = Course.objects.values_list('title', flat=True)
    return HttpResponse(ujson.dumps(sorted(titles), ensure_ascii=False), content_type='application/json')
@login_required
def depts(request):
    depts = Course.objects.values_list('deptnum', flat=True)
    # have to do some regex stuff to get the departments from deptnum
    DEPT_REGEX = re.compile(r'(?P<dept>[A-Z]{3})')

    dept_list = []
    for d in depts:
        found = DEPT_REGEX.findall(d)
        dept_list = list(set(dept_list + found))
    return HttpResponse(ujson.dumps(sorted(dept_list), ensure_ascii=True), content_type='application/json')

# adds specified favorite of user that makes this request
@login_required
@require_http_methods(["POST"])
def add_fave(request, registrar_id):
    curr_profile = request.user.profile
    to_add = get_object_or_404(Course, registrar_id=registrar_id)
    new_faves = curr_profile.faves + "," + to_add.deptnum + "-" + registrar_id
    curr_profile.faves = new_faves
    curr_profile.save()

    # return updated profile (ONLY shows favorites, no other user info)
    new_profile = ProfileSerializer(curr_profile).data
    return HttpResponse(ujson.dumps(new_profile['faves']), content_type='application/json')

# deletes specified favorite of user that makes this request
@login_required
@require_http_methods(["DELETE"])
def del_fave(request, registrar_id):
    curr_profile = request.user.profile
    curr_faves = curr_profile.faves.split(',')
    curr_faves = [x for x in curr_faves if registrar_id not in x]
    curr_profile.faves = ','.join(curr_faves)
    curr_profile.save()

    # return updated profile (favorites)
    new_profile = ProfileSerializer(curr_profile).data
    return HttpResponse(ujson.dumps(new_profile['faves']), content_type='application/json')

# get favorites of user that makes this request
@login_required
@require_http_methods(["GET"])
def get_faves(request):
    curr_profile = request.user.profile
    serialized = ProfileSerializer(curr_profile).data
    return HttpResponse(ujson.dumps(serialized['faves']), content_type='application/json')
