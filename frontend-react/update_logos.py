import os

files = [
    'src/pages/AgentDashboardPage.tsx',
    'src/pages/SignupPage.tsx',
    'src/pages/LoginPage.tsx',
    'src/components/TopNav.tsx',
    'src/components/HeroSection.tsx',
    'src/components/Sidebar.tsx',
    'src/i18n/LanguageProvider.tsx'
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False

    # For LanguageProvider footer
    if '© 2026 République Tunisienne — Portail National Tunisia Smart City | Tous droits réservés' in content:
        content = content.replace('© 2026 République Tunisienne — Portail National Tunisia Smart City | Tous droits réservés', '© 2026 Portail National | Tous droits réservés')
        changed = True
        
    if '© 2026 الجمهورية التونسية — البوابة الوطنية تونس مدينة ذكية | جميع الحقوق محفوظة' in content:
        content = content.replace('© 2026 الجمهورية التونسية — البوابة الوطنية تونس مدينة ذكية | جميع الحقوق محفوظة', '© 2026 البوابة الوطنية | جميع الحقوق محفوظة')
        changed = True

    # For logo replacements
    if '"/media/tunisia_logo.png"' in content or "'/media/tunisia_logo.png'" in content:
        if 'import tunisiaLogo from' not in content:
            # Find the best place to add it (after other imports)
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if line == '' or not line.startswith('import '):
                    lines.insert(i, "import tunisiaLogo from '../assets/tunisia_logo.png'")
                    break
            content = '\n'.join(lines)
            
        content = content.replace('"/media/tunisia_logo.png"', '{tunisiaLogo}')
        content = content.replace("'/media/tunisia_logo.png'", '{tunisiaLogo}')
        changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
