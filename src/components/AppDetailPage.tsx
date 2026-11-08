import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { applySeo } from '../lib/seo';

type Listing = { id: string; slug: string; status: string; data: Record<string, unknown> };
type DownloadOption = { id?: string; key?: string; label?: string; url?: string; version?: string; size?: string; enabled?: boolean; order?: number; primary?: boolean };
type DescriptionSection = { id?: string; title?: string; html?: string; enabled?: boolean };
const text = (value: unknown) => typeof value === 'string' ? value : '';
const list = (value: unknown) => Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
const safeHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,form,svg,math').forEach(n => n.remove());
  doc.body.querySelectorAll('*').forEach(el => [...el.attributes].forEach(attr => {
    const name = attr.name.toLowerCase(), value = attr.value.trim();
    if (name.startsWith('on') || name === 'srcdoc' || ((name === 'href' || name === 'src') && /^\s*(javascript:|data:text\/html)/i.test(value))) el.removeAttribute(attr.name);
    if (name === 'style' && /url\s*\(|expression\s*\(|position\s*:\s*fixed/i.test(value)) el.removeAttribute(attr.name);
  }));
  return doc.body.innerHTML;
};

export function AppDetailPage({ slug }: { slug: string }) {
  const [item, setItem] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeScreenshot, setActiveScreenshot] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('apps').select('id,slug,status,data').eq('slug', slug).eq('status', 'published').eq('is_visible', true).is('deleted_at', null).maybeSingle();
      if (!active) return;
      if (error) console.error('Could not load listing', error);
      setItem(data as Listing | null); setLoading(false);
    };
    void load(); return () => { active = false; };
  }, [slug]);
  const d = item?.data || {};
  const screenshots = list(d.screenshots);
  useEffect(() => {
    if (activeScreenshot === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveScreenshot(null);
      if (event.key === 'ArrowRight') setActiveScreenshot(index => index === null ? null : (index + 1) % screenshots.length);
      if (event.key === 'ArrowLeft') setActiveScreenshot(index => index === null ? null : (index - 1 + screenshots.length) % screenshots.length);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previousOverflow; };
  }, [activeScreenshot, screenshots.length]);
  useEffect(() => {
    if (!item) return;
    const data = item.data || {}, name = text(data.name) || slug, description = text(data.description) || `Explore ${name} on KhepiLabs.`;
    const kind = text(data.kind) === 'Game' ? 'Game' : 'App';
    applySeo(`/listing/${slug}`, { title: `${name} — Download Android ${kind} | KhepiLabs`, description, canonical: `https://khepilabs.com/${kind === 'Game' ? 'games' : 'apps'}/${slug}`, image: text(data.icon).startsWith('https://') ? text(data.icon) : undefined, index: true });
    const schema = document.getElementById('khepilabs-jsonld');
    if (schema) schema.textContent = JSON.stringify({ '@context':'https://schema.org', '@type':'SoftwareApplication', name, description, applicationCategory:text(data.category)||(kind==='Game'?'GameApplication':'UtilitiesApplication'), operatingSystem:'Android', url:`https://khepilabs.com/${kind==='Game'?'games':'apps'}/${slug}`, image:text(data.icon).startsWith('https://')?text(data.icon):undefined, publisher:{'@type':'Organization',name:text(data.developer)||'KhepiLabs'}, softwareVersion:text(data.version)||undefined, downloadUrl: (Array.isArray(data.downloads) ? (data.downloads as DownloadOption[]).find(x=>x.enabled!==false&&x.primary&&/^https:\/\//.test(x.url||''))?.url : '') || text(data.play) || text(data.apk) || undefined });
  }, [item, slug]);
  if (loading) return <main className="kl-public-main"><p>Loading listing…</p></main>;
  if (!item) return <main className="kl-public-main"><h1>Listing not found</h1><p>This app or game may have been unpublished or removed.</p><a href="/">Back to KhepiLabs</a></main>;
  const name = text(d.name) || slug, description = text(d.description), kind = text(d.kind) === 'Game' ? 'Game' : 'App';
  const downloads = (Array.isArray(d.downloads) ? d.downloads as DownloadOption[] : []).filter(o=>o.enabled!==false&&/^https:\/\//i.test(o.url||'')).sort((a,b)=>(a.order||0)-(b.order||0));
  const primary = downloads.find(o=>o.primary) || downloads[0];
  const descriptionSections = (Array.isArray(d.descriptionSections) ? d.descriptionSections as DescriptionSection[] : []).filter(s=>s.enabled!==false&&s.title&&s.html);
  const legacyDownload = text(d.play) || text(d.apk), releaseUrl = text(d.githubReleasesUrl);
  return <div className="kl-app kl-public-app">
    <header className="kl-header kl-public-header"><a className="kl-brand" href="/"><span className="kl-brand-mark"><span/></span><span>Khepi<span className="kl-brand-accent">Labs</span><small>DISCOVER SOMETHING BETTER</small></span></a><a className="kl-submit" href="/contact">Contact ↗</a></header>
    <main className="kl-public-main">
      <nav aria-label="Breadcrumb" className="kl-public-breadcrumb"><a href="/">Home</a><span>/</span><a href={kind==='Game'?'/games':'/apps'}>{kind}s</a><span>/</span><span>{name}</span></nav>
      <article className="kl-public-hero"><div className="kl-public-copy"><div className="kl-eyebrow">{kind.toUpperCase()} · KHEPILABS</div><h1>{name}</h1>{text(d.category)&&<p>{text(d.category)}</p>}{description&&<p>{description}</p>}<dl>{text(d.version)&&<><dt>Version</dt><dd>{text(d.version)}</dd></>}{text(d.developer)&&<><dt>Developer</dt><dd>{text(d.developer)}</dd></>}{text(d.size)&&<><dt>Size</dt><dd>{text(d.size)}</dd></>}{text(d.updated)&&<><dt>Updated</dt><dd>{text(d.updated)}</dd></>}</dl>
      {primary ? <a className="kl-primary" href={primary.url} target="_blank" rel="noopener noreferrer">{text(d.downloadButtonLabel)||'Download for Android'} · {primary.version||text(d.version)||'Latest'} ↗</a> : legacyDownload.startsWith('https://') && <a className="kl-primary" href={legacyDownload} target="_blank" rel="noopener noreferrer">Download / Get app ↗</a>}
      {downloads.length>0&&<div className="kl-advanced-downloads"><h3>Advanced downloads</h3><div>{downloads.map((o,i)=><a key={o.id||i} href={o.url} target="_blank" rel="noopener noreferrer"><span>{o.label||'Download APK'}</span><small>{[o.version&&'v'+o.version,o.size].filter(Boolean).join(' · ')}</small></a>)}</div></div>}
      {releaseUrl.startsWith('https://')&&<a className="kl-release-link" href={releaseUrl} target="_blank" rel="noopener noreferrer">View all releases ↗</a>}</div>
      {text(d.icon).startsWith('https://')&&<img src={text(d.icon)} alt={`${name} app icon`} width="160" height="160" loading="eager"/>}</article>
      {descriptionSections.length>0&&<div className="kl-rich-description">{descriptionSections.map((s,i)=><section key={s.id||i}><h2>{s.title}</h2><div dangerouslySetInnerHTML={{__html:safeHtml(s.html||'')}}/></section>)}</div>}
      {screenshots.length>0&&<section className="kl-public-screenshots"><div className="kl-public-section-heading"><h2>Screenshots</h2><span>{screenshots.length} images</span></div><div className="kl-public-screenshot-track">{screenshots.map((src,i)=><button className="kl-public-screenshot-thumb" key={src+i} type="button" onClick={()=>setActiveScreenshot(i)} aria-label={`Open screenshot ${i+1} of ${screenshots.length}`}><img src={src} alt={`${name} screenshot ${i+1}`} loading="lazy"/></button>)}</div></section>}
      {activeScreenshot!==null&&<div className="kl-screenshot-lightbox" role="dialog" aria-modal="true" aria-label="Screenshot preview" onClick={e=>{if(e.target===e.currentTarget)setActiveScreenshot(null)}} onTouchStart={e=>{(e.currentTarget as HTMLDivElement).dataset.touchX=String(e.touches[0].clientX)}} onTouchEnd={e=>{const start=Number((e.currentTarget as HTMLDivElement).dataset.touchX||0),delta=e.changedTouches[0].clientX-start;if(Math.abs(delta)>45)setActiveScreenshot(index=>index===null?null:(index+(delta<0?1:-1)+screenshots.length)%screenshots.length)}}><button className="kl-lightbox-close" type="button" onClick={()=>setActiveScreenshot(null)} aria-label="Close screenshot preview">×</button>{screenshots.length>1&&<button className="kl-lightbox-nav prev" type="button" onClick={()=>setActiveScreenshot(index=>index===null?null:(index-1+screenshots.length)%screenshots.length)} aria-label="Previous screenshot">‹</button>}<img src={screenshots[activeScreenshot]} alt={`${name} screenshot ${activeScreenshot+1}`}/>{screenshots.length>1&&<button className="kl-lightbox-nav next" type="button" onClick={()=>setActiveScreenshot(index=>index===null?null:(index+1)%screenshots.length)} aria-label="Next screenshot">›</button>}<div className="kl-lightbox-count">{activeScreenshot+1} / {screenshots.length}</div></div>}
      {list(d.changelog).length>0&&<section><h2>What’s new</h2><ul>{list(d.changelog).map(x=><li key={x}>{x}</li>)}</ul></section>}
      <p>Listing information is provided for discovery. Always verify the publisher and permissions before installing software.</p>
    </main>
  </div>;
}
