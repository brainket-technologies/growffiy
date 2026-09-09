import re

# 1. Add spacer to PublicHeader.tsx
with open('src/shared/components/views/PublicHeader.tsx', 'r') as f:
    content = f.read()

spacer = "\n      {/* Spacer to prevent content from hiding behind fixed header */}\n      <div style={{ height: '110px' }} aria-hidden=\"true\" />\n    </>"
content = content.replace("    </>", spacer)

with open('src/shared/components/views/PublicHeader.tsx', 'w') as f:
    f.write(content)

# 2. Fix globals.css for page.tsx .hero padding
with open('src/app/globals.css', 'r') as f:
    css_content = f.read()

# Change .hero { padding-top: 160px; } to padding-top: 50px;
css_content = css_content.replace("padding-top: 160px;", "padding-top: 50px;")
css_content = css_content.replace("padding-top: 64px;", "padding-top: 0px;")
css_content = css_content.replace("padding-top: 56px;", "padding-top: 0px;")

with open('src/app/globals.css', 'w') as f:
    f.write(css_content)

print("Fixed padding!")
