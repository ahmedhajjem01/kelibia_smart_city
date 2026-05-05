from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('extrait_naissance', '0010_demandeextraitnaissance'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='demandeextraitnaissance',
            name='cin_declarant',
        ),
        migrations.AddField(
            model_name='demandeextraitnaissance',
            name='date_naissance',
            field=models.DateField(verbose_name='Date de naissance', default='2000-01-01'),
            preserve_default=False,
        ),
    ]
