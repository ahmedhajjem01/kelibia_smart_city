
import re

def check_jsx(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    stack = []
    
    # We only care about the main component render
    # Let's start from ag-main-wrapper (line 1021) approx
    start_line = 0
    for i, line in enumerate(lines):
        if 'ag-main-wrapper' in line:
            start_line = i
            break
            
    for i in range(start_line, len(lines)):
        line = lines[i].strip()
        
        # Count divs
        opens = re.findall(r'<div', line)
        closes = re.findall(r'</div', line)
        
        for _ in opens: stack.append(('div', i+1))
        for _ in closes:
            if not stack or stack[-1][0] != 'div':
                print(f"Unexpected </div> at line {i+1}")
            else:
                stack.pop()
                
        # Count Fragments
        f_opens = re.findall(r'<>', line)
        f_closes = re.findall(r'</>', line)
        for _ in f_opens: stack.append(('fragment', i+1))
        for _ in f_closes:
            if not stack or stack[-1][0] != 'fragment':
                print(f"Unexpected </> at line {i+1}")
            else:
                stack.pop()
                
    print("Stack at end:", stack)

check_jsx('src/pages/AgentDashboardPage.tsx')
