# -*- coding: utf-8 -*-
# Generated by Django 1.10.6 on 2017-04-11 21:29
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0002_meeting_is_primary'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='course',
            options={'ordering': ['deptnum']},
        ),
        migrations.AddField(
            model_name='course',
            name='pages',
            field=models.IntegerField(default=9000),
        ),
    ]
