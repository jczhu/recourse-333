from __future__ import unicode_literals

from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.postgres.fields import ArrayField

# Course model below adopted from ReCal's model, with modifications to fields
# E.g. Instead of a Course_Listing model, we added department and number to
# the model (deptnum).
# We also have additional fields for things like max pages of reading/wk,
# pdf- and audit-ability, and grading categories.
class Course(models.Model):
    # identifying fields
    registrar_id = models.CharField(max_length=20, unique=True)
    title = models.TextField()
    deptnum = models.TextField()

    # general information easily gained from scraping
    rating = models.FloatField(default=0)
    evals = ArrayField(models.TextField())
    description = models.TextField()
    assgts = models.TextField()
    grading = models.TextField()
    prereqs = models.TextField()
    otherinfo = models.TextField()
    otherreq = models.TextField(default="")
    professors = models.TextField()
    area = models.CharField(max_length=3)

    # information about a course after some parsing
    pdfable = models.BooleanField(default = True)
    pdfonly = models.BooleanField(default=False)
    auditable = models.BooleanField(default=True)
    pdfaudit = models.TextField()
    pages = models.IntegerField(default=9000)

    # grading filters
    participation = models.BooleanField(default=True)
    papers = models.BooleanField(default=True)
    takehome = models.BooleanField(default=True)
    final = models.BooleanField(default=True)
    pset = models.BooleanField(default=True)
    midterm = models.BooleanField(default=True)
    presentation = models.BooleanField(default=True)
    quiz = models.BooleanField(default=True)

    def __unicode__(self):
        return self.deptnum + ": " + self.title

# Adopted from ReCal (merging their Meeting and Section mode), but using
# TimeFields for start and end times, as well as using a field for section
# (rather than a relationship with another model).
class Meeting(models.Model):
    course = models.ForeignKey(Course, related_name="meetings")
    start_time = models.TimeField(blank=True, null=True)
    end_time = models.TimeField(blank=True, null=True)
    days = models.CharField(max_length=10)
    section = models.CharField(max_length=4) # probably 3, but just in case
    is_primary = models.BooleanField(default=False) # whether meeting is primary

    def __unicode__(self):
        if self.start_time != None:
            times = self.start_time.strftime("%I:%M %p")+ ' - ' + self.end_time.strftime("%I:%M %p")
        else:
            times = "TBA"
        return  self.days + ": " + times

# Model that is auto created upon the saving of a User.
# Has one-to-one relationship with User and stores the User's favorites
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, unique = True)
    faves = models.TextField()

    def __unicode__(self):
        return "User: " + self.user.username + ", Favorites: " + self.faves

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance, faves="")

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
