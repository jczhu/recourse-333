"""
Scrapes the course evaluations page for a single course.
From USG Labs (NOT ReCourse's code).
"""
from bs4 import BeautifulSoup
import urllib
import base64
import json
import sys
import pprint
import html5lib

#: Base URL for course evaluations page
BASE_URL = 'https://reg-captiva.princeton.edu/chart/index.php'

def __get_eval_soup(term, course_id):
    """
    Returns a Beautiful Soup instnace for the given term and course id.
    Be warned that a page existing is not a guarantee that the course
    existed in that term.
    """
    url_opts = {
        'terminfo': term,
        'courseinfo': course_id
    }

    url_opts_enc = urllib.urlencode(url_opts)
    request_url = BASE_URL + '?' + url_opts_enc

    page = urllib.urlopen(request_url)
    return BeautifulSoup(page, 'html5lib')


def __get_eval_stats(soup):
    """
    Returns a mapping of category to average for the given
    course.
    """
    # The eval stats are included in the element with
    # selector `#chart > input` in its value attribute, and is
    # base64 encoded as a JSON file.
    eval_stats_str = soup.find(id='chart').input['value']
    eval_stats = json.loads(base64.b64decode(eval_stats_str))

    label_items = eval_stats['PlotArea']['XAxis']['Items']
    labels = [lbl['Text'] for lbl in label_items]

    value_items = eval_stats['PlotArea']['ListOfSeries'][0]['Items']
    values = [float(val['YValue']) for val in value_items]

    return dict(zip(labels, values))


def __get_eval_comments(soup):
    """
    Returns a list of comments on the course, as plain text.
    """
    # Comments table is the last table on the page.
    comments = soup('table')[-1].find_all('td')
    return [c.get_text().strip() for c in comments]


def course_eval(term, course_id):
    """
    Returns the course evaluation stats (as a dict) and comments
    (as an array of strings) for a given course and term.
    """
    soup = __get_eval_soup(term, course_id)
    if soup.find(id='chart') is None:
        return {},[]

    stats = __get_eval_stats(soup)
    comments = __get_eval_comments(soup)

    return stats, comments


if __name__ == '__main__':
    """
    Usage: python evals.py [term] [subject]
    Pretty prints the information and classes found with the
    given term and subject.
    """
    pp = pprint.PrettyPrinter(indent = 2)

    term = sys.argv[1]
    course_id = sys.argv[2]

    pp.pprint(course_eval(term, course_id))
