from django.conf.urls import url

from . import views

app_name = 'courses'
urlpatterns = [
    url(ur'filter/', views.course_filter, name='course_filter'),
    url(r'profs/$', views.profs, name='course_profs'),
    url(r'titles/$', views.titles, name='course_titles'),
    url(r'depts/$', views.depts, name='course_depts'),
    url(r'^add_fave/(?P<registrar_id>\d{6})/$', views.add_fave, name='add_fave'),
    url(r'^del_fave/(?P<registrar_id>\d{6})/$', views.del_fave, name='del_fave'),
    url(r'^get_faves/$', views.get_faves, name='get_faves')
]
