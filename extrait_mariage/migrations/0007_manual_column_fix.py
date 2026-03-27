from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('extrait_mariage', '0006_alter_demandemariage_type_contrat'),
    ]
    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE extrait_mariage_extraitmariage ADD COLUMN IF NOT EXISTS type_acte VARCHAR(20) DEFAULT 'municipal';",
            reverse_sql="ALTER TABLE extrait_mariage_extraitmariage DROP COLUMN IF EXISTS type_acte;"
        ),
        migrations.RunSQL(
            sql="ALTER TABLE extrait_mariage_extraitmariage ADD COLUMN IF NOT EXISTS contrat_scan VARCHAR(100);",
            reverse_sql="ALTER TABLE extrait_mariage_extraitmariage DROP COLUMN IF EXISTS contrat_scan;"
        ),
    ]
