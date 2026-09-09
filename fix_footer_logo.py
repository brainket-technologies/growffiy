import re

with open('src/shared/components/views/Footer.tsx', 'r') as f:
    content = f.read()

old_logo_jsx = """<div className="footer-brand-logo-icon">
                  {brandLogo ? <img src={brandLogo} alt={brandName} style={{ width: 18, height: 18, objectFit: 'contain' }} /> : <img src="/logo.png" alt={brandName} style={{ width: 18, height: 18, objectFit: 'contain' }} />}
                </div>
                <span className="footer-brand-name">{brandName.toUpperCase()}</span>"""

new_logo_jsx = """<div className="footer-brand-logo-icon" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {brandLogo ? (
                    <img src={brandLogo} alt={brandName} style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
                  ) : (
                    <>
                      <img src="/logo.png" alt={brandName} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                      <span className="footer-brand-name" style={{ fontSize: '18px', fontWeight: 'bold' }}>{brandName.toUpperCase()}</span>
                    </>
                  )}
                </div>"""

if old_logo_jsx in content:
    content = content.replace(old_logo_jsx, new_logo_jsx)
else:
    print("Could not find the exact JSX string to replace.")

with open('src/shared/components/views/Footer.tsx', 'w') as f:
    f.write(content)

print("Footer logo fixed!")
