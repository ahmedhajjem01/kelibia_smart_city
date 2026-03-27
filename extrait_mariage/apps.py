import os
from django.apps import AppConfig

class ExtraitMariageConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'extrait_mariage'
    verbose_name = 'Extrait de Mariage'

    def ready(self):
        # Self-healing: Ensure columns exist in production even if migrations are stuck
        import sys
        if 'runserver' in sys.argv or 'gunicorn' in sys.argv or 'uvicorn' in sys.argv or os.environ.get('VERCEL'):
            try:
                from django.db import connection
                with connection.cursor() as cursor:
                    # Check and Add type_acte
                    cursor.execute("""
                        DO $$ 
                        BEGIN 
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                          WHERE table_name='extrait_mariage_extraitmariage' AND column_name='type_acte') THEN
                                ALTER TABLE extrait_mariage_extraitmariage ADD COLUMN type_acte VARCHAR(20) DEFAULT 'municipal';
                            END IF;
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                          WHERE table_name='extrait_mariage_extraitmariage' AND column_name='contrat_scan') THEN
                                ALTER TABLE extrait_mariage_extraitmariage ADD COLUMN contrat_scan VARCHAR(100);
                            END IF;
                        END $$;
                    """)
            except Exception as e:
                print(f"Self-healing migration log: {e}")

