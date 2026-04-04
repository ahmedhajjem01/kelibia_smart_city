from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('reclamations', '0003_reclamation_duplicate_of_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql="CREATE INDEX idx_reclamation_location ON reclamations_reclamation USING GIST (ST_MakePoint(longitude, latitude)::geography);",
            reverse_sql="DROP INDEX idx_reclamation_location;",
        )
    ]
