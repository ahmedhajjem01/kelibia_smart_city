import os

output_file = "all_models.txt"
root_dir = "."
target_files = ["models.py", "serializers.py", "views.py"]
exclude_dirs = ["node_modules", ".venv", "staticfiles", ".git", "__pycache__"]

with open(output_file, "w", encoding="utf-8") as out:
    for target in target_files:
        for root, dirs, files in os.walk(root_dir):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            if target in files:
                file_path = os.path.join(root, target)
                out.write(f"\n\n=== {file_path} ===\n\n")
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        out.write(f.read())
                except Exception as e:
                    out.write(f"ERROR READING FILE: {e}\n")

print(f"Extraction complete: {output_file}")
