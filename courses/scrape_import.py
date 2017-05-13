import datetime
import re
# heavily modified from same named script in ReCal's repository
# for instance, has a part to get max pages of reading/wk, as well as grading
# criteria (necessary for our project, but not ReCal)
class ScrapeCounter:

    def __init__(self):
        self.totalCoursesCount = 0
        self.createdCoursesCount = 0
        self.totalMeetingsCount = 0
        self.createdMeetingsCount = 0

    def __str__(self):
        return str(self.createdCoursesCount) + " new courses\n" + \
               str(self.totalCoursesCount) + " total courses\n" + \
               str(self.createdMeetingsCount) + " new meetings\n" + \
               str(self.totalMeetingsCount) + " total meetings"


def scrape_import_course(course, counter=ScrapeCounter()):
    from courses.models import Course, Meeting

    def import_meeting(meeting, course_object, letter):
        # creates Meeting object and a relationship with the calling Course obj
        start = None if meeting['starttime'] == 'TBA' else datetime.datetime.strptime(meeting['starttime'], "%I:%M %p").time()
        end = None if meeting['endtime'] == 'TBA' else datetime.datetime.strptime(meeting['endtime'], "%I:%M %p").time()
        meeting_object, created = Meeting.objects.get_or_create(
            course=course_object,
            start_time= start,
            end_time= end,
            days=meeting['days'],
            section=meeting['section'],
            is_primary=letter in meeting['section']
        )
        meeting_object.save()
        if created:
            counter.createdMeetingsCount += 1
        counter.totalMeetingsCount += 1
        return meeting_object

    # Grading filters
    participation = False
    papers = False
    takehome = False
    final = False
    midterm = False
    pset = False
    presentation = False
    quiz = False
    words = course['grading'].split()
    for word in words:
        w = word.lower()
        if "participat" in w:
            participation = True
        if "paper" in w:
            papers = True
        if "take" in w:
            takehome = True
        if "final" in w:
            final = True
        if "problem" in w:
            pset = True
        if "midterm" in w or "mid-term" in w or "mid" in w:
            midterm = True
        if "quiz" in w:
            quiz = True
        if "present" in w:
            presentation = True
    if "in lieu of f" in course['grading'].lower():
        final = False
    if "in lieu of m" in course['grading'].lower():
        midterm = False

    # max pages of reading filter
    NUMBER_REGEX = re.compile(r'\d+')
    num_pages = 9000
    words = course['assgts'].split()
    for index,word in enumerate(words):
        num_pages_curr = 0
        if word == "pages":
            num_pages_curr = words[index - 1]
            if len(num_pages_curr.split("-")) == 2:
                num_pages_curr = num_pages_curr.split("-")[1]
            else:
                num_pages_curr = NUMBER_REGEX.search(words[index - 1])
                if num_pages_curr is not None:
                    num_pages_curr = num_pages_curr.group()
                else:
                    num_pages_curr = 0
        if "pp." in word:
            num_pages_curr = word[:-3]
            if len(num_pages_curr.split("-")) == 2:
                num_pages_curr = num_pages_curr.split("-")[1]
            else:
                num_pages_curr = NUMBER_REGEX.search(words[index - 1])
                if num_pages_curr is not None:
                    num_pages_curr = num_pages_curr.group()
                else:
                    num_pages_curr = 0
        if num_pages_curr > num_pages:
            num_pages = num_pages_curr
    try:
        num_pages = int(num_pages)
    except:
    	num_pages = 9000
    	pass
    if num_pages < 20:
        num_pages = 9000

    # only check registrar_id to see if create or update, since other things
    # may change
    course_object, created = Course.objects.update_or_create(
        registrar_id=course['courseid'],

        defaults = {
            "description": course['descrip'],
            "professors": ', '.join([x['name'] for x in course['profs']]),
            "deptnum": '/'.join([x['dept'] + " " + x['number'] for x in course['listings']]),
            "rating": float(course['evals'][0].get('Overall Quality of the Course', 0)),
            "evals": course['evals'][1] or [],
            "assgts": course['assgts'] or "",

            "pages": num_pages,
            "participation": participation,
            "papers": papers,
            "takehome": takehome,
            "final": final,
            "pset": pset,
            "midterm": midterm,
            "presentation": presentation, #added
            "quiz": quiz, #added

            "grading": course['grading'] or "",
            "prereqs": course['prereqs'] or "",
            "otherinfo": course['otherinfo'] or "",
            "otherreq": course['otherreq'] or "", #ADDED
            "area": course['area'] or "",

            "pdfaudit": course['pdfaudit'] or "",
            "pdfable": not "npdf" in course['pdfaudit'] and not "No P/D/F" in course['pdfaudit'] and not "No Pass/D/Fail" in course['pdfaudit'],
            "auditable": not "na" in course['pdfaudit'] and not "No Audit" in course['pdfaudit'],
            "pdfonly": "P/D/F Only" in course['pdfaudit'],
            "title": course['title'],
        }

    )

    # Debugging output to check things scraped normally
    print course_object.deptnum + " " + course_object.title + " "+ \
        course_object.registrar_id

    # finding the primary meeting
    letter = 'C'
    for x in course['classes']:
        if x['section'][0] in 'LSU':
            letter = x['section'][0]
            break

    # delete any current meetings since may have change and reimport
    course_object.meetings.all().delete()
    [import_meeting(x, course_object, letter) for x in course['classes']]

    course_object.save()
    if created:
        counter.createdCoursesCount += 1
    counter.totalCoursesCount += 1


    return counter
