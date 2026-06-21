'use client';

import { useEffect } from 'react';

export default function BrandingProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyBranding = async () => {
      try {
        const storedTitle = localStorage.getItem('growffiy_brand_title');
        if (storedTitle) document.title = storedTitle;

        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.success && data.settings) {
          const logo = data.settings.app_logo || '';
          const name = data.settings.app_name || 'Growffiy';
          const title = data.settings.app_title || 'Growffiy — Algo Trading Terminal';
          const desc = data.settings.meta_description || '';
          const keywords = data.settings.meta_keywords || '';
          const gaId = data.settings.google_analytics_id || '';
          const footerText = data.settings.footer_text || '';

          localStorage.setItem('growffiy_brand_logo', logo);
          localStorage.setItem('growffiy_brand_name', name);
          localStorage.setItem('growffiy_brand_title', title);
          localStorage.setItem('growffiy_meta_description', desc);
          localStorage.setItem('growffiy_meta_keywords', keywords);
          localStorage.setItem('growffiy_footer_text', footerText);

          document.title = title;

          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) metaDesc.setAttribute('content', desc);

          const metaKw = document.querySelector('meta[name="keywords"]');
          if (metaKw) metaKw.setAttribute('content', keywords);

          let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
          if (logo) {
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = logo;
          }

          if (gaId && !document.getElementById('growffiy-ga')) {
            const script = document.createElement('script');
            script.id = 'growffiy-ga';
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
            document.head.appendChild(script);
            const inline = document.createElement('script');
            inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
            document.head.appendChild(inline);
          }

          window.dispatchEvent(new Event('branding-updated'));
        }
      } catch {}
    };

    applyBranding();

    const handleBrandingUpdate = () => applyBranding();
    window.addEventListener('branding-updated', handleBrandingUpdate);
    return () => window.removeEventListener('branding-updated', handleBrandingUpdate);
  }, []);

  return <>{children}</>;
}
