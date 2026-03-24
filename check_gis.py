import sqlite3
import os

def check_spatialite():
    print("Checking for SpatiaLite...")
    try:
        conn = sqlite3.connect(':memory:')
        conn.enable_load_extension(True)
        # Try common names
        extensions = ['mod_spatialite', 'spatialite', 'libspatialite']
        for ext in extensions:
            try:
                conn.load_extension(ext)
                print(f"Success loading: {ext}")
                return True
            except Exception as e:
                print(f"Failed to load {ext}: {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    check_spatialite()
