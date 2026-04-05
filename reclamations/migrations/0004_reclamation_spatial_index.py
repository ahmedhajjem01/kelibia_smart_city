from django.db import migrations, connection


def create_spatial_index(apps, schema_editor):
    """Create PostGIS spatial index only if PostGIS extension is available."""
    try:
        with connection.cursor() as cursor:
            # Check if PostGIS is available
            cursor.execute("SELECT 1 FROM pg_extension WHERE extname = 'postgis'")
            if cursor.fetchone():
                cursor.execute(
                    "CREATE INDEX IF NOT EXISTS idx_reclamation_location "
                    "ON reclamations_reclamation "
                    "USING GIST (ST_MakePoint(longitude, latitude)::geography);"
                )
    except Exception:
        pass  # PostGIS not available — skip spatial index gracefully


def drop_spatial_index(apps, schema_editor):
    try:
        with connection.cursor() as cursor:
            cursor.execute("DROP INDEX IF EXISTS idx_reclamation_location;")
    except Exception:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('reclamations', '0003_reclamation_duplicate_of_and_more'),
    ]

    operations = [
        migrations.RunPython(create_spatial_index, drop_spatial_index),
    ]
