
import re

def check_jsx(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    stack = []
    
    # Pre-process lines to remove comments and strings if possible
    # (Simple version first)
    
    for i, line in enumerate(lines):
        line = line.strip()
        if line.startswith('//') or line.startswith('/*'): continue
        
        # Count divs
        # Be careful not to match <div if it's in a string like className="div"
        # But usually <div is safe.
        
        opens = re.findall(r'<div', line)
        closes = re.findall(r'</div', line)
        
        for _ in opens: stack.append(('div', i+1))
        for _ in closes:
            if not stack or stack[-1][0] != 'div':
                print(f"Unexpected </div> at line {i+1}")
            else:
                stack.pop()
                
        # Fragments
        f_opens = re.findall(r'<>', line)
        f_closes = re.findall(r'</>', line)
        for _ in f_opens: stack.append(('frag', i+1))
        for _ in f_closes:
            if not stack or stack[-1][0] != 'frag':
                print(f"Unexpected </> at line {i+1}")
            else:
                stack.pop()

        # Paren (Ternaries)
        p_opens = re.findall(r'\(', line)
        p_closes = re.findall(r'\)', line)
        # Filter out common non-jsx parens like function(arg)
        # But in JSX returns it's usually ( <div ... )
        # This is tough. Let's just use divs for now.

    print("Remaining in stack:", stack)

check_jsx('src/pages/AgentDashboardPage.tsx')
