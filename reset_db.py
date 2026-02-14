import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def reset_database():
    try:
        conn = psycopg2.connect(dbname="postgres", user="postgres", password="admin", host="localhost")
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        cursor.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'kelibia_db' AND pid <> pg_backend_pid();")
        cursor.execute("DROP DATABASE IF EXISTS kelibia_db;")
        cursor.execute("CREATE DATABASE kelibia_db;")
        print("Database reset successfully!")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reset_database()
