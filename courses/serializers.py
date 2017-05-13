'''
Serializer file to convert Django objects to JSON. Uses serpy for super fast
serialization.
'''

import serpy
import datetime
from models import Course, Meeting

# serializer for time field, default display format is HH:MM
# used by MeetingSerializer
class MeetingTimeField(serpy.Field):
    def to_value(self, value):
        if value == None:
            return "TBA"
        return value.strftime("%I:%M %p")

# serializer for all the meetings, used by CourseSerializer
class MeetingSerializer(serpy.Serializer):
    start_time = MeetingTimeField()
    end_time = MeetingTimeField()
    days = serpy.StrField()
    section = serpy.StrField()
    is_primary = serpy.BoolField()

# serializer for courses
class CourseSerializer(serpy.Serializer):
    registrar_id = serpy.StrField()
    title = serpy.StrField()
    deptnum = serpy.StrField()

    rating = serpy.FloatField()
    # evals = serpy.Field() # removed to avoid serializing
    description = serpy.StrField()
    assgts = serpy.StrField()
    grading = serpy.StrField()
    prereqs = serpy.StrField()
    otherinfo = serpy.StrField()
    otherreq = serpy.StrField()
    professors = serpy.StrField()
    area = serpy.StrField()
    pages = serpy.IntField()

    pdfable = serpy.BoolField()
    pdfonly = serpy.BoolField()
    auditable = serpy.BoolField()
    pdfaudit = serpy.StrField()

    meetings = MeetingSerializer(many=True, attr="meetings.all", call=True)

# way to get faves into nice format for front-end
class FaveField(serpy.Field):
    def to_value(self, value):
       arr = value.split(',') # remove initial empty favorite
       return [{"listing": a.split('-')[0].strip(), "courseid": a.split('-')[1].strip()} for a in arr if a.strip() != '']

# serializer for profile, mostly just to get favorites
class ProfileSerializer(serpy.Serializer):
    # user = Serpy.Field() # don't need to serialize the user
    faves = FaveField()
