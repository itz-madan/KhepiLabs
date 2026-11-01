const SITE = 'https://khepilabs.com';
type SeoEntry = { title: string; description: string; index?: boolean };
const pages: Record<string, SeoEntry> = {
  '/': { title: 'KhepiLabs — Discover Android Apps, Games & Digital Tools', description: 'Discover thoughtfully selected Android apps, games and digital tools with KhepiLabs. Explore useful finds, curated collections and app updates.' },
  '/about': { title: 'About KhepiLabs — Independent Android App Discovery', description: 'Learn about KhepiLabs, an independent platform for discovering Android apps, games and useful digital tools.' },
  '/contact': { title: 'Contact KhepiLabs — Support & App Listing Enquiries', description: 'Contact the KhepiLabs team for support, suggestions, listing corrections, publisher enquiries and copyright concerns.' },
  '/privacy-policy': { title: 'Privacy Policy — KhepiLabs', description: 'Read the KhepiLabs privacy policy and learn how website preferences and information are handled.' },
  '/terms-of-service': { title: 'Terms of Service — KhepiLabs', description: 'Review the terms that apply when accessing and using the KhepiLabs website.' },
  '/disclaimer': { title: 'Disclaimer — KhepiLabs', description: 'Important information about third-party apps, listings, downloads and external services on KhepiLabs.' },
  '/dmca-policy': { title: 'DMCA & Copyright Policy — KhepiLabs', description: 'Learn how to submit a copyright or DMCA notice concerning content displayed on KhepiLabs.' },
  '/apps': { title: 'Android Apps — KhepiLabs', description: 'Explore Android app listings on KhepiLabs.', index: false },
  '/games': { title: 'Android Games — KhepiLabs', description: 'Explore Android game listings on KhepiLabs.', index: false },
  '/categories': { title: 'Browse Categories — KhepiLabs', description: 'Browse app and game categories on KhepiLabs.', index: false },
  '/top-charts': { title: 'Top Charts — KhepiLabs', description: 'Explore popular apps and games on KhepiLabs.', index: false },
  '/collections': { title: 'Collections — KhepiLabs', description: 'Explore curated app and game collections on KhepiLabs.', index: false },
  '/updates': { title: 'Latest App Updates — KhepiLabs', description: 'See app and game update information on KhepiLabs.', index: false },
  '/admin': { title: 'Admin — KhepiLabs', description: 'KhepiLabs administration.', index: false }
};
function setMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, name); document.head.appendChild(element); }
  element.content = content;
}
function setLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) { element = document.createElement('link'); element.rel = rel; document.head.appendChild(element); }
  element.href = href;
}
export function applySeo(route: string, override?: {title:string;description:string;canonical:string;image?:string;index?:boolean}) {
  const entry = override || pages[route] || { title: 'Page Not Found — KhepiLabs', description: 'The requested page could not be found on KhepiLabs.', index: false };
  const canonical = override?.canonical || `${SITE}${pages[route] ? (route === '/' ? '/' : route) : '/'}`;
  const image = override?.image || `${SITE}/khepilabs.svg`;
  document.title = entry.title;
  setMeta('description', entry.description);
  setMeta('robots', entry.index === false ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  setMeta('og:type', 'website', 'property'); setMeta('og:site_name', 'KhepiLabs', 'property');
  setMeta('og:title', entry.title, 'property'); setMeta('og:description', entry.description, 'property');
  setMeta('og:url', canonical, 'property'); setMeta('og:image', image, 'property');
  setMeta('twitter:card', 'summary_large_image'); setMeta('twitter:title', entry.title);
  setMeta('twitter:description', entry.description); setMeta('twitter:image', image);
  setLink('canonical', canonical);
  let schema = document.getElementById('khepilabs-jsonld');
  if (!schema) { schema = document.createElement('script'); schema.id = 'khepilabs-jsonld'; schema.setAttribute('type', 'application/ld+json'); document.head.appendChild(schema); }
  schema.textContent = JSON.stringify({ '@context':'https://schema.org', '@graph': [
    { '@type':'Organization', '@id':`${SITE}/#organization`, name:'KhepiLabs', url:`${SITE}/`, email:'support@khepilabs.com', sameAs:['https://t.me/khepilabs_support'] },
    { '@type':'WebSite', '@id':`${SITE}/#website`, name:'KhepiLabs', url:`${SITE}/`, description:pages['/'].description, publisher:{'@id':`${SITE}/#organization`}, inLanguage:'en' }
  ]});
}
