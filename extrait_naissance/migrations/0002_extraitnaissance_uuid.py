import uuid
from django.db import migrations, models

def gen_uuid(apps, schema_editor):
    MyModel = apps.get_model('extrait_naissance', 'ExtraitNaissance')
    for row in MyModel.objects.all():
        row.uuid = uuid.uuid4()
        row.save(update_fields=['uuid'])

class Migration(migrations.Migration):

    dependencies = [
        ('extrait_naissance', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='extraitnaissance',
            name='uuid',
            field=models.UUIDField(default=uuid.uuid4, editable=False, null=True),
        ),
        migrations.RunPython(gen_uuid, reverse_code=migrations.RunPython.noop),
        migrations.AlterField(
            model_name='extraitnaissance',
            name='uuid',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
