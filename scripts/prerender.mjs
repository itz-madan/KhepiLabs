import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const site = 'https://khepilabs.com';
const dist = path.resolve('dist');
const baseHtml = await readFile(path.join(dist, 'index.html'), 'utf8');
const staticPages = [
  ['/', 'KhepiLabs — Discover Android Apps, Games & Digital Tools', 'Discover thoughtfully selected Android apps, games and digital tools with KhepiLabs. Explore useful finds, curated collections and app updates.', 'Discover Android Apps and Games', 'Explore thoughtfully selected Android apps, games and digital tools on KhepiLabs.'],
  ['/about', 'About KhepiLabs — Independent Android App Discovery', 'Learn about KhepiLabs, an independent platform for discovering Android apps, games and useful digital tools.', 'About KhepiLabs', 'KhepiLabs is an independent destination for discovering Android apps and games.'],
  ['/contact', 'Contact KhepiLabs — Support & App Listing Enquiries', 'Contact the KhepiLabs team for support, suggestions, listing corrections, publisher enquiries and copyright concerns.', 'Contact KhepiLabs', 'Email support@khepilabs.com for help, feedback and listing enquiries.'],
  ['/privacy-policy', 'Privacy Policy — KhepiLabs', 'Read the KhepiLabs privacy policy and learn how website preferences and information are handled.', 'Privacy Policy', 'Read how KhepiLabs handles website preferences and information.'],
  ['/terms-of-service', 'Terms of Service — KhepiLabs', 'Review the terms that apply when accessing and using the KhepiLabs website.', 'Terms of Service', 'Review the terms for using KhepiLabs.'],
  ['/disclaimer', 'Disclaimer — KhepiLabs', 'Important information about third-party apps, listings, downloads and external services on KhepiLabs.', 'Disclaimer', 'Review important information about third-party apps and downloads.'],
  ['/dmca-policy', 'DMCA & Copyright Policy — KhepiLabs', 'Learn how to submit a copyright or DMCA notice concerning content displayed on KhepiLabs.', 'DMCA and Copyright Policy', 'KhepiLabs respects intellectual property rights. Contact support@khepilabs.com with copyright concerns.']
];
const escape = s => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function htmlFor({url,title,description,h1,body,robots='index,follow,max-image-preview:large'}) {
  const canonical = site + url;
  const image = site + '/khepilabs.svg';
  let html = baseHtml.replace('<div id="root"></div>', `<div id="root"><main><h1>${escape(h1)}</h1><p>${escape(body)}</p><p><a href="/">KhepiLabs Home</a></p></main></div>`);
  html = html.replace(/<title>.*?<\\/title>/, `<title>${escape(title)}</title>`);
  html = html.replace('</head>', `<meta name="description" content="${escape(description)}"><meta name="robots" content="${robots}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="KhepiLabs"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}"><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:title,description,url:canonical,isPartOf:{'@type':'WebSite',name:'KhepiLabs',url:site+'/'}})}</script></head>`);
  return html;
}
const urls = [];
for (const [url,title,description,h1,body] of staticPages) {
  const target = url === '/' ? path.join(dist,'index.html') : path.join(dist,url.slice(1),'index.html');
  if (url !== '/') await mkdir(path.dirname(target),{recursive:true});
  await writeFile(target,htmlFor({url,title,description,h1,body}));
  urls.push(url);
}
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const listingUrls = [];
if (supabaseUrl && supabaseKey) {
  try {
    const endpoint = new URL('/rest/v1/apps?select=id,slug,data,status&status=eq.published&is_visible=eq.true&deleted_at=is.null&order=updated_at.desc', supabaseUrl);
    const response = await fetch(endpoint, {headers:{apikey:supabaseKey,Authorization:`Bearer ${supabaseKey}`}});
    if (!response.ok) throw new Error(`Supabase REST returned ${response.status}`);
    const rows = await response.json();
    for (const row of rows) {
      const data = row.data || {};
      const slug = row.slug || String(data.name || row.id).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      if (!slug) continue;
      const kind = data.kind === 'Game' ? 'games' : 'apps';
      const url = `/${kind}/${slug}`;
      const name = String(data.name || slug);
      const description = String(data.description || `Explore ${name} on KhepiLabs.`).slice(0,300);
      const target = path.join(dist,kind,slug,'index.html');
      await mkdir(path.dirname(target),{recursive:true});
      await writeFile(target,htmlFor({url,title:`${name} — Android ${kind === 'games' ? 'Game' : 'App'} | KhepiLabs`,description,h1:name,body:description}));
      listingUrls.push(url);
    }
  } catch (error) { console.error('SEO prerender could not fetch public listings:', error); }
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n${[...urls,...listingUrls].map(url=>`  <url><loc>${site}${url === '/' ? '/' : url}</loc></url>`).join('\\n')}\\n</urlset>\\n`;
await writeFile(path.join(dist,'sitemap.xml'),sitemap);
console.log(`SEO prerendered ${urls.length} static pages and ${listingUrls.length} published listings.`);
