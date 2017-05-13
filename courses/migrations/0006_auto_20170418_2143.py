# -*- coding: utf-8 -*-
# Generated by Django 1.10.6 on 2017-04-18 21:43
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0005_auto_20170413_1505'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='otherreq',
            field=models.TextField(default=''),
        ),
        migrations.AddField(
            model_name='course',
            name='presentation',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='course',
            name='quiz',
            field=models.BooleanField(default=True),
        ),
    ]
