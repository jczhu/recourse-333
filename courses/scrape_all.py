'''
Adopted from the Recal repository (file of the same name).
Modified to only scrape for one semester (compared to multiple).
'''

from django.conf import settings
import django
from courses.scraper import scrape_all
from courses.scrape_import import scrape_import_course, ScrapeCounter


def get_all_courses():
    try:
        print "Scraping for this semester"
        courses = scrape_all()

        scrapeCounter = ScrapeCounter()
        [scrape_import_course(x, scrapeCounter) for x in courses]
        print str(scrapeCounter)
        print "----------------------------------"
    except Exception as e:
        print e

#settings.configure()
django.setup()
get_all_courses()
