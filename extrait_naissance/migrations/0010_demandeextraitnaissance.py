from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('extrait_naissance', '0009_demandelegalisation'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DemandeExtraitNaissance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('prenom_fr', models.CharField(max_length=100, verbose_name='Prénom (FR)')),
                ('nom_fr', models.CharField(max_length=100, verbose_name='Nom (FR)')),
                ('prenom_ar', models.CharField(blank=True, max_length=100, verbose_name='Prénom (AR)')),
                ('nom_ar', models.CharField(blank=True, max_length=100, verbose_name='Nom (AR)')),
                ('cin_declarant', models.CharField(max_length=8, verbose_name='CIN du demandeur')),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'En attente / قيد الانتظار'),
                        ('processed', 'Traité / تمت المعالجة'),
                        ('rejected', 'Rejeté / مرفوض'),
                    ],
                    default='pending',
                    max_length=20,
                )),
                ('note_agent', models.TextField(blank=True, verbose_name="Note de l'agent")),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('citizen', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='demandes_extrait_naissance',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Demandeur',
                )),
            ],
            options={
                'verbose_name': "Demande d'extrait de naissance",
                'verbose_name_plural': "Demandes d'extrait de naissance",
                'ordering': ['-created_at'],
            },
        ),
    ]
