import sys

path = r"c:\Users\espace info\OneDrive\Desktop\pfe\kelibia_smart_city\frontend-react\src\pages\SignupPage.tsx"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We want to remove lines from the first occurrence of "/* ── Reset & base ── */"
# until the line before "export default function SignupPage()"
# But wait, I've already messed up the middle.

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "/* ── Reset & base ── */" in line and i < 900: # Old one
        start_idx = i
    if "export default function SignupPage()" in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    # Keep lines before start_idx and from end_idx onwards
    new_lines = lines[:start_idx] + lines[end_idx:]
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"Successfully removed lines from {start_idx+1} to {end_idx}")
else:
    print(f"Indices not found: start={start_idx}, end={end_idx}")
