import psycopg2
from psycopg2 import sql

def check_postgres():
    print("Checking PostgreSQL...")
    try:
        # Try default connection
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="admin",
            host="127.0.0.1",
            port="5432"
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'kelibia_db'")
        exists = cur.fetchone()
        if not exists:
            print("Database 'kelibia_db' does not exist. Creating it...")
            cur.execute("CREATE DATABASE kelibia_db")
        else:
            print("Database 'kelibia_db' exists.")
            
        cur.close()
        conn.close()
        
        # Connect to the target database and check postgis
        conn = psycopg2.connect(
            dbname="kelibia_db",
            user="postgres",
            password="admin",
            host="127.0.0.1",
            port="5432"
        )
        cur = conn.cursor()
        try:
            cur.execute("CREATE EXTENSION IF NOT EXISTS postgis")
            print("PostGIS extension ensured.")
        except Exception as e:
            print(f"Failed to ensure PostGIS: {e}")
            
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    check_postgres()
