import os
import re

files_to_update = [
    "src/app/page.tsx",
    "src/app/products/page.tsx",
    "src/app/scanner/page.tsx",
    "src/app/algo-trading/page.tsx",
    "src/app/pricing/page.tsx",
    "src/app/about/page.tsx",
    "src/shared/components/views/LegalLayout.tsx"
]

def get_relative_import(filepath):
    if "LegalLayout" in filepath:
        return "import PublicHeader from './PublicHeader';"
    if filepath == "src/app/page.tsx":
        return "import PublicHeader from '../shared/components/views/PublicHeader';"
    return "import PublicHeader from '../../shared/components/views/PublicHeader';"

for f in files_to_update:
    if not os.path.exists(f):
        print(f"File {f} not found!")
        continue
    
    with open(f, 'r') as file:
        content = file.read()
    
    if "PublicHeader" not in content:
        # insert after the first import
        content = re.sub(r'(import .*?;)', r'\1\n' + get_relative_import(f), content, count=1)

    # For page.tsx
    if f == "src/app/page.tsx":
        pattern = r'\{\/\* ════════════════════════════════════════\n\s*NAVBAR.*?LIVE STOCK TICKER STRIP.*?\<\/div\>\n\s*\<\/div\>'
        content = re.sub(pattern, '<PublicHeader />', content, flags=re.DOTALL)
    elif "LegalLayout" in f:
        # Legal layout has slightly different structure
        pattern = r'\{\/\*\s*Mobile Header Navbar\s*\*\/.*?\}\)\}\n\s*\<\/div\>\n\s*\<\/div\>'
        # Actually it's probably better to check LegalLayout directly.
        pass
    else:
        # For other pages
        pattern = r'\{\/\*\s*Stock Ticker Bar.*?\<\/nav\>'
        content = re.sub(pattern, '<PublicHeader />', content, flags=re.DOTALL)
        
    with open(f, 'w') as file:
        file.write(content)
    
    print(f"Updated {f}")
