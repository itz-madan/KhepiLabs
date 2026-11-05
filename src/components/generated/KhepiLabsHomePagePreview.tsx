import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchPublishedApps, subscribeToApps } from "../../lib/catalogue";
import { supabase } from "../../lib/supabase";
type Entry = {
  id: string;
  name: string;
  kind: "App" | "Game";
  category: string;
  version?: string;
  developer?: string;
  size?: string;
  rating?: string;
  downloads?: string;
  description?: string;
  icon?: string;
  iconBg?: string;
  trending?: boolean;
  updated?: string;
  apk?: string;
  play?: string;
  screenshots?: string[];
  changelog?: string[];
};
const demo: Entry[] = [{
  id: "1",
  name: "KhepiTube",
  kind: "App",
  category: "Video & Music",
  version: "4.2.0",
  developer: "KhepiLabs",
  size: "48 MB",
  rating: "4.8",
  downloads: "12.4K",
  description: "A clean, focused media experience for discovering and enjoying your favourite content.",
  icon: "▶",
  iconBg: "linear-gradient(135deg,#ff5b68,#a82445)",
  trending: true,
  updated: "Updated today",
  screenshots: [],
  changelog: ["A refreshed player experience", "Performance and stability improvements"]
}, {
  id: "2",
  name: "Nova Launcher",
  kind: "App",
  category: "Personalization",
  version: "8.1.1",
  developer: "Branch",
  size: "18 MB",
  rating: "4.7",
  downloads: "8.2K",
  description: "Make your home screen feel like your own with flexible customisation.",
  icon: "N",
  iconBg: "linear-gradient(135deg,#7667ff,#312b83)",
  trending: true,
  updated: "Updated yesterday"
}, {
  id: "3",
  name: "Monio",
  kind: "App",
  category: "Finance",
  version: "1.8.0",
  developer: "KhepiLabs",
  size: "22 MB",
  rating: "4.9",
  downloads: "5.8K",
  description: "A simple and thoughtful way to keep track of everyday expenses.",
  icon: "M",
  iconBg: "linear-gradient(135deg,#39c99a,#087d71)",
  updated: "Updated 2 days ago"
}, {
  id: "4",
  name: "Pixel Quest",
  kind: "Game",
  category: "Adventure",
  version: "2.4.1",
  developer: "Indie Studio",
  size: "136 MB",
  rating: "4.6",
  downloads: "9.1K",
  description: "A colourful adventure through curious worlds and hidden paths.",
  icon: "✦",
  iconBg: "linear-gradient(135deg,#ffbd59,#d45a39)",
  updated: "Updated 3 days ago"
}, {
  id: "5",
  name: "Focus Notes",
  kind: "App",
  category: "Productivity",
  version: "3.0.2",
  developer: "KhepiLabs",
  size: "16 MB",
  rating: "4.7",
  downloads: "3.4K",
  description: "Capture ideas, organise thoughts and keep your day moving.",
  icon: "✎",
  iconBg: "linear-gradient(135deg,#50b9ef,#2760ad)",
  updated: "Updated this week"
}, {
  id: "6",
  name: "Orbit Run",
  kind: "Game",
  category: "Arcade",
  version: "1.2.0",
  developer: "Indie Studio",
  size: "92 MB",
  rating: "4.5",
  downloads: "2.7K",
  description: "A quick, satisfying arcade challenge with a cosmic twist.",
  icon: "◉",
  iconBg: "linear-gradient(135deg,#bd78ff,#6335a8)",
  updated: "Updated this week"
}];
const categories = ["All", "Video & Music", "Personalization", "Finance", "Productivity", "Adventure", "Arcade"];
const isEntry = (value: unknown): value is Entry => {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<Entry>;
  const optionalStrings: (keyof Entry)[] = [
    "version", "developer", "size", "rating", "downloads", "description",
    "icon", "iconBg", "updated", "apk", "play"
  ];
  return typeof entry.id === "string" && entry.id.trim().length > 0 &&
    typeof entry.name === "string" && entry.name.trim().length > 0 &&
    (entry.kind === "App" || entry.kind === "Game") && typeof entry.category === "string" &&
    optionalStrings.every((key) => entry[key] === undefined || typeof entry[key] === "string") &&
    (entry.trending === undefined || typeof entry.trending === "boolean") &&
    (entry.screenshots === undefined || (Array.isArray(entry.screenshots) && entry.screenshots.every((item) => typeof item === "string"))) &&
    (entry.changelog === undefined || (Array.isArray(entry.changelog) && entry.changelog.every((item) => typeof item === "string")));
};
const safeExternalUrl = (value?: string) => {
  const raw = value?.trim();
  if (!raw) return undefined;
  try {
    // Admin entries often contain a bare domain (e.g. www.example.com).
    // Normalize those to HTTPS instead of treating them as a path on this site.
    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
};
const parseEntries = (raw: string | null): Entry[] | null => {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return null;
    const seen = new Set<string>();
    return value.filter(isEntry).filter((entry) => {
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });
  } catch {
    return null;
  }
};
const Icon = ({
  children
}: {
  children: React.ReactNode;
}) => <span className="kl-icon">{children}</span>;
function ProductIcon({
  item,
  large = false
}: {
  item: Entry;
  large?: boolean;
}) {
  const iconIsImage = !!item.icon && (item.icon.startsWith("https://") || item.icon.startsWith("http://") || item.icon.startsWith("data:image/"));
  const brand = (item.iconBg || "").trim().toLowerCase();
  const brandBackgrounds: Record<string, string> = {
    youtube: "linear-gradient(135deg,#ff4545 0%,#c90024 100%)",
    instagram: "linear-gradient(135deg,#ffb347 0%,#e1306c 52%,#833ab4 100%)",
    spotify: "linear-gradient(135deg,#1ed760,#087b3b)",
    telegram: "linear-gradient(135deg,#35baf2,#0878bd)",
    whatsapp: "linear-gradient(135deg,#25d366,#087c48)",
    chrome: "linear-gradient(135deg,#4285f4,#34a853 48%,#fbbc05 72%,#ea4335)",
    netflix: "linear-gradient(135deg,#e50914,#65000a)"
  };
  const isCssBackground = /^(#([\da-f]{3,8})|rgba?\(|hsla?\(|(linear|radial|conic)-gradient\()/i.test(item.iconBg || "");
  const background = brandBackgrounds[brand] || (isCssBackground ? item.iconBg! : "linear-gradient(135deg,#65758c,#293548)");
  const fallbackGlyph = !item.icon && brand === "youtube" ? "▶" : item.icon || item.name.trim().slice(0, 1).toUpperCase();
  return <div className={large ? "kl-product-icon large" : "kl-product-icon"} style={{background}}>
    <span className="kl-product-icon-fallback" aria-hidden="true">{fallbackGlyph}</span>
    {iconIsImage && <img src={item.icon} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = "none"; }}/>}
  </div>;
}
export function KhepiLabsHomePagePreview() {
  const [items, setItems] = useState<Entry[]>(() => {
    try {
      return parseEntries(localStorage.getItem("khl-preview-items")) ?? demo;
    } catch {
      return demo;
    }
  });
  const [dark, setDark] = useState(() => { try { return localStorage.getItem("khl-theme") === "dark"; } catch { return false; } });
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const rows = await fetchPublishedApps();
        if (alive) setItems(rows as Entry[]);
      } catch (error) {
        console.error("KhepiLabs catalogue connection failed", error);
      }
    };
    void load();
    const channel = subscribeToApps(() => void load());
    return () => {
      alive = false;
      void channel.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let alive = true;
    const loadCategories = async () => {
      const { data, error } = await supabase.from("categories").select("id,data").order("updated_at", { ascending: false });
      if (error) { console.warn("Could not load KhepiLabs categories", error); return; }
      const names = (data || []).map((row:any) => row.data?.name || row.data?.title || row.data?.label || row.data?.category).filter((name:any): name is string => typeof name === "string" && name.trim().length > 0);
      if (alive && names.length) setCategoryOptions(["All", ...Array.from(new Set(names))]);
    };
    void loadCategories();
    const channel = supabase.channel("khepilabs-public-categories").on("postgres_changes", {event:"*",schema:"public",table:"categories"}, () => void loadCategories()).subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, []);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const detailCloseRef = useRef<HTMLButtonElement>(null);
  const detailOpenerRef = useRef<HTMLElement | null>(null);
  const previousDetailRef = useRef(false);
  const openedDetailInAppRef = useRef(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [category, setCategory] = useState("All");
  const [categoryOptions, setCategoryOptions] = useState<string[]>(categories);
  const [active, setActive] = useState<"All" | "Apps" | "Games">("All");
  const [slide, setSlide] = useState(0);
  const [detail, setDetail] = useState<Entry | null>(null);
  const [toast, setToast] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "card" | "mixed">(() => {
    try { const saved = localStorage.getItem("khl-view-mode"); return saved === "list" || saved === "grid" || saved === "card" || saved === "mixed" ? saved : "mixed"; } catch { return "mixed"; }
  });
  useEffect(() => { try { localStorage.setItem("khl-view-mode", viewMode); } catch { /* storage can be unavailable */ } }, [viewMode]);
  const published = items;
  const trending = published.filter(x => x.trending);
  const toastTimerRef = useRef<number | null>(null);
  useEffect(() => {
    try { localStorage.setItem("khl-preview-items", JSON.stringify(items)); } catch { /* storage can be unavailable or full */ }
  }, [items]);
  useEffect(() => {
    const syncFromOtherTab = (event: StorageEvent) => {
      if (event.key !== "khl-preview-items") return;
      const next = parseEntries(event.newValue);
      setItems(next ?? demo);
    };
    window.addEventListener("storage", syncFromOtherTab);
    return () => window.removeEventListener("storage", syncFromOtherTab);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("kl-light", !dark);
    try { localStorage.setItem("khl-theme", dark ? "dark" : "light"); } catch { /* ignore unavailable storage */ }
  }, [dark]);
  useEffect(() => {
    const syncDetailFromHash = () => {
      const match = window.location.hash.match(/^#preview\/(.+)$/);
      let item: Entry | undefined;
      if (match) {
        try { const id = decodeURIComponent(match[1]); item = items.find(entry => entry.id === id); }
        catch { item = undefined; }
      }
      setDetail(item || null);
    };
    const handleHistoryChange = () => {
      openedDetailInAppRef.current = false;
      syncDetailFromHash();
    };
    syncDetailFromHash();
    window.addEventListener("popstate", handleHistoryChange);
    window.addEventListener("hashchange", handleHistoryChange);
    return () => {
      window.removeEventListener("popstate", handleHistoryChange);
      window.removeEventListener("hashchange", handleHistoryChange);
    };
  }, [items]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (event.key === "Escape") {
        if (detail) close();
        setFilterOpen(false);
        setMenu(false);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const target = event.target;
        const isTyping = target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
        if (!isTyping && trending.length > 1 && !detail) setSlide((value) => (value + (event.key === "ArrowRight" ? 1 : -1) + trending.length) % trending.length);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detail, trending.length]);
  useEffect(() => {
    if (slide >= trending.length || slide < 0) setSlide(0);
  }, [slide, trending.length]);
  useEffect(() => {
    if (detail && !items.some((entry) => entry.id === detail.id)) close();
  }, [items]);
  useEffect(() => {
    if (detail) {
      previousDetailRef.current = true;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      detailCloseRef.current?.focus();
      const dialog = detailCloseRef.current?.closest("[role=dialog]");
      const keepFocusInside = (event: KeyboardEvent) => {
        if (event.key !== "Tab" || !dialog) return;
        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter((element) => element.getAttribute("aria-hidden") !== "true");
        if (!focusable.length) {
          event.preventDefault();
          detailCloseRef.current?.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };
      document.addEventListener("keydown", keepFocusInside);
      return () => {
        document.removeEventListener("keydown", keepFocusInside);
        document.body.style.overflow = previousOverflow;
      };
    }
    if (previousDetailRef.current) {
      previousDetailRef.current = false;
      detailOpenerRef.current?.focus();
      detailOpenerRef.current = null;
    }
  }, [detail]);
  const searchMatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return published.map(item => ({item, score: [item.name,item.category,item.developer||"",item.kind,item.description||"",item.version||""].reduce((score,value,index)=>{const v=value.toLowerCase();return score+(v===query?5:v.startsWith(query)?4:v.includes(query)?(index<3?3:1):0);},0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5).map(x=>x.item);
  }, [published, search]);
  const filtered = useMemo(() => {
    const query = search.trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
    return published.filter((x) => {
      const haystack = [x.name, x.category, x.description || "", x.developer || "", x.kind, x.version || ""]
        .join(" ").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
      return (active === "All" || x.kind === active.slice(0, -1)) &&
        (category === "All" || x.category === category) && (!query || haystack.includes(query));
    });
  }, [published, active, category, search]);
  const notify = (s: string) => {
    setToast(s);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2200);
  };
  useEffect(() => () => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
  }, []);
  const open = (p: Entry) => {
    void supabase.rpc("record_app_view", { p_app_id: p.id }).then(({error}) => { if (error) console.warn("View counter unavailable", error); });
    if (!detail) {
      detailOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    setDetail(p);
    if (window.location.hash !== "#preview/" + encodeURIComponent(p.id)) {
      window.history.pushState({ preview: p.id }, "", "#preview/" + encodeURIComponent(p.id));
      openedDetailInAppRef.current = true;
    }
  };
  const close = () => {
    if (!window.location.hash.startsWith("#preview/")) {
      setDetail(null);
      return;
    }
    // Only travel back when this page created the current history entry.
    // A directly opened detail URL must close in-place instead of leaving the site.
    const state = window.history.state as { preview?: string } | null;
    let currentId = "";
    try { currentId = decodeURIComponent(window.location.hash.slice("#preview/".length)); }
    catch { /* malformed hash: replace it safely below */ }
    if (openedDetailInAppRef.current && state?.preview === currentId) {
      openedDetailInAppRef.current = false;
      window.history.back();
    } else {
      window.history.replaceState(state, "", window.location.pathname + window.location.search);
      setDetail(null);
    }
  };
  const scrollToCatalog = () => document.getElementById("catalog")?.scrollIntoView({
    behavior: "smooth"
  });
  const current = trending.length ? trending[slide % trending.length] : (published[0] ?? null);
  return <div className="kl-app">
    <div className="kl-ambient kl-ambient-one" /><div className="kl-ambient kl-ambient-two" />
    <header className="kl-header">
      <a className="kl-brand" href="#" onClick={e => {
        e.preventDefault();
        close();
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }}>
        <span className="kl-brand-mark"><span /></span><span>Khepi<span className="kl-brand-accent">Labs</span><small>DISCOVER SOMETHING BETTER</small></span>
      </a>
      <nav id="khepilabs-navigation" aria-label="Main navigation" className={menu ? "kl-nav open" : "kl-nav"}>
        {[["⌂","Home"],["▦","Apps"],["♧","Games"],["▤","Categories"],["◷","Updates"]].map(([ico,n])=><button key={n} className={(n==="Home"&&active==="All"&&category==="All")||(n==="Apps"&&active==="Apps")||(n==="Games"&&active==="Games")?"selected":""} onClick={()=>{if(n==="Apps")setActive("Apps");else if(n==="Games")setActive("Games");else{setActive("All");setCategory("All");}setMenu(false);if(n==="Updates")window.location.hash="#/updates";else if(n!=="Home")scrollToCatalog();else window.scrollTo({top:0,behavior:"smooth"});}}><span className="kl-nav-icon">{ico}</span>{n}</button>)}
        <a className="kl-nav-admin" href="#/admin" onClick={()=>setMenu(false)}>♙ Admin Login</a>
      </nav>
      <div className="kl-header-search"><Icon>⌕</Icon><input value={search} onFocus={()=>setSearchFocused(true)} onBlur={()=>window.setTimeout(()=>setSearchFocused(false),160)} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){setSearchFocused(false);scrollToCatalog();}}} placeholder="Search apps, games..." aria-label="Search apps and games"/>{search&&<button aria-label="Clear search" onClick={()=>setSearch("")}>×</button>}{searchFocused&&search.trim()&&<div className="kl-search-results kl-header-search-results"><div className="kl-search-results-label">SUGGESTED RESULTS <span>{searchMatches.length} FOUND</span></div>{searchMatches.length?searchMatches.map(item=><button key={item.id} className="kl-search-result" onMouseDown={e=>e.preventDefault()} onClick={()=>{setSearchFocused(false);open(item);}}><ProductIcon item={item}/><span><strong>{item.name}</strong><small>{item.category} · {item.kind}</small></span><b>↗</b></button>):<div className="kl-search-no-results">No matching apps found.</div>}<button className="kl-search-all" onMouseDown={e=>e.preventDefault()} onClick={()=>{setSearchFocused(false);scrollToCatalog();}}>Search for “{search}”</button></div>}</div>
      <div className="kl-header-actions"><button className="kl-theme" aria-label="Toggle theme" onClick={()=>setDark(!dark)}>{dark?"☾":"☼"}</button><button className="kl-menu-toggle" onClick={()=>setMenu(!menu)} aria-label="Menu" aria-expanded={menu} aria-controls="khepilabs-navigation">{menu?"×":"☰"}</button></div>
    </header>
    <main>
      <section className="kl-hero kl-reference-hero">
        <div className="kl-hero-copy">
          <div className="kl-eyebrow">KHEPILABS</div>
          <h1>Discover &amp; Download<br/>Quality Apps and Games</h1>
          <p>Explore a curated collection of Android apps, games,<br className="kl-desktop"/> mods and useful tools — fast, safe and always updated.</p>
          <div className="kl-hero-ctas"><button className="kl-primary" onClick={()=>{setActive("Apps");scrollToCatalog();}}>⇩ &nbsp; Explore Apps</button><button className="kl-secondary" onClick={()=>{setActive("Games");scrollToCatalog();}}>♧ &nbsp; Explore Games</button></div>
        </div>
        {current&&<div className="kl-hero-feature"><button className="kl-feature-arrow prev" onClick={()=>setSlide((slide-1+trending.length)%trending.length)}>‹</button><div className="kl-hero-feature-inner"><ProductIcon item={current} large/><div className="kl-hero-feature-copy"><span className="kl-eyebrow">FEATURED {current.kind.toUpperCase()}</span><h2>{current.name}</h2><p>{current.category}{current.developer?" · "+current.developer:""}</p><div className="kl-feature-details"><span>★ {current.rating||"New"}</span><i/><span>⇩ {current.downloads||"Discover"}</span></div>{safeExternalUrl(current.apk)&&<a className="kl-primary" href={safeExternalUrl(current.apk)} target="_blank" rel="noopener noreferrer" onClick={()=>void supabase.rpc("record_app_download",{p_app_id:current.id})}>⇩ &nbsp; Download</a>}</div></div><div className="kl-hero-feature-dots">{trending.map((item,i)=><button key={item.id} className={i===slide?"active":""} onClick={()=>setSlide(i)}/>)}</div><button className="kl-feature-arrow next" onClick={()=>setSlide((slide+1)%trending.length)}>›</button></div>}
      </section>
      <section className="kl-category-pills" aria-label="Browse categories">{["All","Tools","Photo & Video","Music & Audio","Productivity","Entertainment","Games","Customization"].map((name,i)=><button className={(i===0&&category==="All")||category===name?"active":""} key={name} onClick={()=>{setCategory(i===0?"All":name);setActive(name==="Games"?"Games":"All");scrollToCatalog();}}><span>{["▦","⚒","▧","♫","▱","⊙","♧","◉"][i]}</span>{name}</button>)}</section>
      <section className="kl-catalog kl-reference-catalog" id="catalog">
        <div className="kl-reference-catalog-heading"><div><h2>Featured Apps</h2><p>Handpicked apps for a better Android experience</p></div><div className="kl-reference-view"><span>View:</span><div className="kl-view-picker"><button className="kl-view-picker-trigger" aria-expanded={viewMenuOpen} onClick={()=>setViewMenuOpen(v=>!v)}><span>{viewMode==="list"?"☷":viewMode==="grid"?"▦":viewMode==="card"?"▣":"◫"}</span><b>{viewMode[0].toUpperCase()+viewMode.slice(1)}</b><i>⌄</i></button>{viewMenuOpen&&<><button className="kl-view-dismiss" aria-label="Close view selector" onClick={()=>setViewMenuOpen(false)}/><div className="kl-view-menu">{(["grid","list","card","mixed"] as const).map(mode=><button key={mode} className={viewMode===mode?"active":""} onClick={()=>{setViewMode(mode);setViewMenuOpen(false);}}><span>{mode==="list"?"☷":mode==="grid"?"▦":mode==="card"?"▣":"◫"}</span>{mode[0].toUpperCase()+mode.slice(1)} View{viewMode===mode&&<b>✓</b>}</button>)}</div></>}</div></div></div>
        <div className={"kl-product-grid kl-reference-grid kl-view-"+viewMode}>{filtered.map(p=><article key={p.id} className="kl-reference-app-card" role="button" tabIndex={0} aria-label={`View ${p.name} details`} onClick={()=>open(p)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open(p);}}}><ProductIcon item={p}/><div className="kl-reference-app-info"><h3>{p.name}</h3><p className="kl-reference-version">{p.version ? `Version ${p.version}` : "Version not specified"}</p></div></article>)}</div>
        {!filtered.length&&<div className="kl-empty"><span>⌕</span><h3>No matching apps found.</h3><p>Try another search or category.</p><button onClick={()=>{setSearch("");setCategory("All");setActive("All");}}>Clear filters</button></div>}
      </section>
      <section className="kl-bottom-cta"><div className="kl-cta-glow" /><div className="kl-eyebrow">A LITTLE MORE DISCOVERY</div><h2>Good finds deserve<br /><em>to be shared.</em></h2><p>Know something worth discovering? Let’s put it on the map.</p><button className="kl-primary" onClick={() => notify("Submission portal will be available soon")}>Suggest an app <span>↗</span></button></section>
    </main>
    <footer className="kl-site-footer"><div className="kl-footer-main"><div className="kl-footer-brand"><a className="kl-brand" href="#/"><span className="kl-brand-mark"><span /></span><span>Khepi<span className="kl-brand-accent">Labs</span><small>APPS STORE</small></span></a><p>Your one-stop destination for discovering and exploring Android apps and games.</p><div className="kl-socials"><a href="https://t.me/khepilabs_support" aria-label="Telegram">➤</a><a href="mailto:support@khepilabs.com" aria-label="Email">✉</a></div></div><div><h3>Explore</h3><a href="#/">Home</a><a href="#/apps">Apps</a><a href="#/games">Games</a><a href="#/categories">Categories</a><a href="#/top-charts">Top Charts</a><a href="#/collections">Collections</a><a href="#/updates">Updates</a></div><div><h3>Legal</h3><a href="#/about">About Us</a><a href="#/privacy-policy">Privacy Policy</a><a href="#/terms-of-service">Terms of Service</a><a href="#/disclaimer">Disclaimer</a><a href="#/dmca-policy">DMCA Policy</a></div><div><h3>Contact</h3><a href="mailto:support@khepilabs.com">support@khepilabs.com</a><a href="https://t.me/khepilabs_support">Telegram: @khepilabs_support</a><a href="#/contact">KhepiLabs Team</a><a href="#/admin">Admin Login ↗</a></div></div><div className="kl-footer-bottom"><span>© 2026 KhepiLabs. All rights reserved.</span><span>Made with ♥ by KhepiLabs</span></div></footer>
    {detail && <div className="kl-detail-overlay kl-page-enter" role="presentation" onMouseDown={e => {
      if (e.target === e.currentTarget) close();
    }}><article className="kl-detail" role="dialog" aria-modal="true" aria-labelledby="kl-detail-title">
      <button ref={detailCloseRef} className="kl-detail-close" onClick={close} aria-label="Close details">← <span>Back to discovery</span></button>
      <div className="kl-detail-head"><ProductIcon item={detail} large /><div><div className="kl-eyebrow">{detail.kind.toUpperCase()} / {detail.category.toUpperCase()}</div><h2 id="kl-detail-title">{detail.name}</h2><p>{detail.developer || "Independent developer"} {detail.version ? "· Version " + detail.version : ""}</p></div></div>
      {detail.description && <section className="kl-detail-section"><h3>About this {detail.kind.toLowerCase()}</h3><p>{detail.description}</p></section>}
      <div className="kl-detail-meta">{detail.size && <div><small>SIZE</small><b>{detail.size}</b></div>}{detail.rating && <div><small>RATING</small><b>★ {detail.rating}</b></div>}{detail.updated && <div><small>UPDATED</small><b>{detail.updated}</b></div>}</div>
      {(safeExternalUrl(detail.apk) || safeExternalUrl(detail.play)) && <div className="kl-detail-actions">{safeExternalUrl(detail.apk) && <a className="kl-primary" href={safeExternalUrl(detail.apk)} target="_blank" rel="noopener noreferrer" onClick={()=>{void supabase.rpc("record_app_download",{p_app_id:detail.id});}}>Download APK ↗</a>}{safeExternalUrl(detail.play) && <a className="kl-secondary" href={safeExternalUrl(detail.play)} target="_blank" rel="noopener noreferrer">Google Play ↗</a>}</div>}
      {!!detail.screenshots?.length && <section className="kl-detail-section"><h3>Screenshots</h3><div className="kl-screens">{detail.screenshots.map((s, i) => <img key={i} src={s} alt={detail.name + " screenshot " + (i + 1)} />)}</div></section>}
      {!!detail.changelog?.length && <section className="kl-detail-section"><h3>What’s new</h3><ul>{detail.changelog.map((c, i) => <li key={i}>{c}</li>)}</ul></section>}
      <div className="kl-detail-note">Details and download options are supplied by the publisher.</div>
    </article></div>}
    {toast && <div className="kl-toast">{toast}</div>}
  </div>;
}