from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from survey.models import Survey, Question, Choice, Respondent, Response

class Command(BaseCommand):
    help = "Créer groupes par défaut (Admin, Agent, Lecteur) et assigner permissions de base."

    def handle(self, *args, **options):
        groups = ['Admin', 'Agent', 'Lecteur']
        for g in groups:
            grp, created = Group.objects.get_or_create(name=g)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Groupe créé : {g}"))
            else:
                self.stdout.write(self.style.NOTICE(f"Groupe existant : {g}"))

        # Exemple : donner add/change/delete sur Survey & Question à Admin et Agent
        ct_survey = ContentType.objects.get_for_model(Survey)
        ct_question = ContentType.objects.get_for_model(Question)

        perms = Permission.objects.filter(content_type__in=[ct_survey, ct_question])
        admin_grp = Group.objects.get(name='Admin')
        agent_grp = Group.objects.get(name='Agent')
        for p in perms:
            admin_grp.permissions.add(p)
            agent_grp.permissions.add(p)
        self.stdout.write(self.style.SUCCESS("Permissions principales attribuées à Admin et Agent."))
