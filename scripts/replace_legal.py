import re

with open('src/shared/components/views/LegalLayout.tsx', 'r') as file:
    content = file.read()

pattern = r'\{\/\*\s*Stock Ticker Bar.*?\<\/nav\>'
content = re.sub(pattern, '<PublicHeader />', content, flags=re.DOTALL)

with open('src/shared/components/views/LegalLayout.tsx', 'w') as file:
    file.write(content)

print("Updated LegalLayout")
