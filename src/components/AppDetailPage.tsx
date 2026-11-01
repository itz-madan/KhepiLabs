import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { applySeo } from '../lib/seo';

type Listing = {
  id: string;
  slug: string;
  status: string;
  data: Record<string, unknown>;
};

const text = (value: unknown) => typeof value === 'string' ? value : '';
const list = (value: unknown) => Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];

export function AppDetailPage({ slug }: { slug: string }) {
  const [item, setItem] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('apps')
        .select('id,slug,status,data')
        .eq('slug', slug)
        .eq('status', 'published')
        .eq('is_visible', true)
        .is('deleted_at', null)
        .maybeSingle();
      if (!active) return;
      if (error) console.error('Could not load listing', error);
      setItem(data as Listing | null);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!item) return;
    const d = item.data || {};
    const name = text(d.name) || slug;
    const description = text(d.description) || `Explore ${name} on KhepiLabs.`;
    const kind = text(d.kind) === 'Game' ? 'Game' : 'App';
    applySeo(`/listing/${slug}`, {
      title: `${name} — Download Android ${kind} | KhepiLabs`,
      description,
      canonical: `https://khepilabs.com/${kind === 'Game' ? 'games' : 'apps'}/${slug}`,
      image: text(d.icon).startsWith('https://') ? text(d.icon) : undefined,
      index: true
    });
    const schema = document.getElementById('khepilabs-jsonld');
    if (schema) schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name,
      description,
      applicationCategory: text(d.category) || (kind === 'Game' ? 'GameApplication' : 'UtilitiesApplication'),
      operatingSystem: 'Android',
      url: `https://khepilabs.com/${kind === 'Game' ? 'games' : 'apps'}/${slug}`,
      image: text(d.icon).startsWith('https://') ? text(d.icon) : undefined,
      publisher: { '@type': 'Organization', name: text(d.developer) || 'KhepiLabs' },
      softwareVersion: text(d.version) || undefined,
      downloadUrl: text(d.play) || text(d.apk) || undefined
    });
  }, [item, slug]);

  if (loading) return <main className="kl-public-main"><p>Loading listing…</p></main>;
  if (!item) return <main className="kl-public-main"><h1>Listing not found</h1><p>This app or game may have been unpublished or removed.</p><a href="/">Back to KhepiLabs</a></main>;

  const d = item.data || {};
  const name = text(d.name) || slug;
  const description = text(d.description);
  const kind = text(d.kind) === 'Game' ? 'Game' : 'App';
  const screenshots = list(d.screenshots);
  const download = text(d.play) || text(d.apk);
  return <div className="kl-app kl-public-app">
    <header className="kl-header kl-public-header"><a className="kl-brand" href="/"><span className="kl-brand-mark"><span/></span><span>Khepi<span className="kl-brand-accent">Labs</span><small>DISCOVER SOMETHING BETTER</small></span></a><a className="kl-submit" href="/contact">Contact ↗</a></header>
    <main className="kl-public-main">
      <nav aria-label="Breadcrumb" className="kl-public-breadcrumb"><a href="/">Home</a><span>/</span><a href={kind === 'Game' ? '/games' : '/apps'}>{kind}s</a><span>/</span><span>{name}</span></nav>
      <article className="kl-public-hero">
        <div className="kl-public-copy"><div className="kl-eyebrow">{kind.toUpperCase()} · KHEPILABS</div><h1>{name}</h1>
          {text(d.category) && <p>{text(d.category)}</p>}
          {description && <p>{description}</p>}
          <dl>{text(d.version) && <><dt>Version</dt><dd>{text(d.version)}</dd></>}{text(d.developer) && <><dt>Developer</dt><dd>{text(d.developer)}</dd></>}{text(d.size) && <><dt>Size</dt><dd>{text(d.size)}</dd></>}{text(d.updated) && <><dt>Updated</dt><dd>{text(d.updated)}</dd></>}</dl>
          {download.startsWith('https://') && <a className="kl-primary" href={download} target="_blank" rel="noopener noreferrer">Download / Get app ↗</a>}
        </div>
        {text(d.icon).startsWith('https://') && <img src={text(d.icon)} alt={`${name} app icon`} width="160" height="160" loading="eager"/>}
      </article>
      {screenshots.length > 0 && <section><h2>Screenshots</h2><div>{screenshots.map((src,i)=><img key={src} src={src} alt={`${name} screenshot ${i+1}`} loading="lazy" style={{maxWidth:220}}/>)}</div></section>}
      {list(d.changelog).length > 0 && <section><h2>What’s new</h2><ul>{list(d.changelog).map(x=><li key={x}>{x}</li>)}</ul></section>}
      <p>Listing information is provided for discovery. Always verify the publisher and permissions before installing software.</p>
    </main>
  </div>;
}
