import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchPublishedApps, subscribeToApps } from "../../lib/catalogue";
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
  if (!value) return undefined;
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === "https:" || url.protocol === "http:" ? value : undefined;
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
  return <div className={large ? "kl-product-icon large" : "kl-product-icon"} style={{
    background: item.iconBg || "linear-gradient(135deg,#65758c,#293548)"
  }}>{item.icon || item.name.slice(0, 1)}</div>;
}
export function KhepiLabsHomePagePreview() {
  const [items, setItems] = useState<Entry[]>(() => {
    try {
      return parseEntries(localStorage.getItem("khl-preview-items")) ?? demo;
    } catch {
      return demo;
    }
  });
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("khl-theme");
      if (saved === "light") return false;
      if (saved === "dark") return true;
    } catch { /* storage can be unavailable in private browsing */ }
    return true;
  });
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const detailCloseRef = useRef<HTMLButtonElement>(null);
  const detailOpenerRef = useRef<HTMLElement | null>(null);
  const previousDetailRef = useRef(false);
  const openedDetailInAppRef = useRef(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
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
  const current = trending.length ? trending[slide % trending.length] : null;
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
        {["Discover", "Apps", "Games", "Categories"].map((n, i) => <button key={n} className={i === 0 && active === "All" && category === "All" ? "selected" : ""} onClick={() => {
          if (i === 1) setActive("Apps");else if (i === 2) setActive("Games");else {
            setActive("All");
            setCategory("All");
          }
          setMenu(false);
          scrollToCatalog();
        }}>{n}</button>)}
      </nav>
      <a className="kl-home-about-link" href="#/about">About</a>
      <div className="kl-header-actions"><button className="kl-theme" aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? "☼" : "☾"}</button><button className="kl-menu-toggle" onClick={() => setMenu(!menu)} aria-label="Menu" aria-expanded={menu} aria-controls="khepilabs-navigation">{menu ? "×" : "☰"}</button><button className="kl-submit" onClick={() => notify("Submission portal will be available soon")}>Submit an app <span>↗</span></button></div>
    </header>
    <main>
      <section className="kl-hero">
        <div className="kl-hero-copy">
          <div className="kl-eyebrow"><span className="kl-live-dot" /> THE BETTER WAY TO DISCOVER</div>
          <h1>Find your next<br /><em>favourite.</em></h1>
          <p>Thoughtfully selected apps, games and digital tools.<br className="kl-desktop" /> Discover what’s useful. Keep what you love.</p>
          <div className="kl-search-wrap"><Icon>⌕</Icon><input ref={searchInputRef} value={search} onChange={e => {
              setSearch(e.target.value);
              scrollToCatalog();
            }} placeholder="Search apps, games, tools..." aria-label="Search apps and games" /><kbd>⌘ K</kbd><button onClick={scrollToCatalog}>Explore <span>↗</span></button></div>
          <div className="kl-hero-meta"><span><b>{published.length.toString().padStart(2, "0")}</b> curated picks</span><i /> <span>Free to explore</span><i /> <span>Always evolving</span></div>
        </div>
        <div className="kl-hero-bottom"><span>SCROLL TO EXPLORE</span><div className="kl-scroll-line" /></div>
      </section>
      {current && <section className="kl-featured kl-trending">
        <div className="kl-trending-heading"><div><div className="kl-eyebrow">✦ TRENDING NOW</div><h2>Popular right now<span>.</span></h2></div><div className="kl-slider-controls"><span>{String(slide + 1).padStart(2, "0")} <i>/ {String(trending.length).padStart(2, "0")}</i></span><button onClick={() => setSlide((slide - 1 + trending.length) % trending.length)} aria-label="Previous trending item">←</button><button onClick={() => setSlide((slide + 1) % trending.length)} aria-label="Next trending item">→</button></div></div>
        <button className="kl-trending-row" onClick={() => open(current)} aria-label={"View " + current.name + " details"}>
          <ProductIcon item={current} />
          <span className="kl-trending-copy"><strong>{current.name}</strong><small>{current.kind} <i /> {current.category}{current.version ? " · v" + current.version : ""}</small><small className="kl-trending-description">{current.description}</small></span>
          <span className="kl-trending-open">View details <b>↗</b></span>
        </button>
        <div className="kl-trending-dots">{trending.map((item, i) => <button key={item.id} aria-label={"Show trending item " + (i + 1)} className={i === slide % trending.length ? "active" : ""} onClick={() => setSlide(i)} />)}</div>
      </section>}
      <section className="kl-catalog" id="catalog">
        <div className="kl-catalog-heading"><div><div className="kl-eyebrow">THE COLLECTION</div><h2>Explore the good stuff<span>.</span></h2><p>Useful finds, without the endless scrolling.</p></div><div className="kl-catalog-count"><b>{filtered.length.toString().padStart(2, "0")}</b><span>RESULTS</span></div></div>
        <div className="kl-toolbar"><div className="kl-tabs"><button className={active === "All" ? "active" : ""} onClick={() => setActive("All")}>Everything</button><button className={active === "Apps" ? "active" : ""} onClick={() => setActive("Apps")}>Apps</button><button className={active === "Games" ? "active" : ""} onClick={() => setActive("Games")}>Games</button></div><div className="kl-view-switch" role="group" aria-label="Choose app layout">{(["list", "grid", "card", "mixed"] as const).map(mode => <button key={mode} type="button" className={viewMode === mode ? "active" : ""} aria-pressed={viewMode === mode} onClick={() => setViewMode(mode)} title={mode[0].toUpperCase() + mode.slice(1)}><span aria-hidden="true">{mode === "list" ? "☷" : mode === "grid" ? "▦" : mode === "card" ? "▣" : "◫"}</span><small>{mode[0].toUpperCase() + mode.slice(1)}</small></button>)}</div><div className="kl-category-select"><span>FILTER BY</span><div className="kl-filter-control"><button className={filterOpen ? "kl-filter-trigger open" : "kl-filter-trigger"} onClick={() => setFilterOpen(!filterOpen)} aria-expanded={filterOpen}><span>{category === "All" ? "All categories" : category}</span><b>⌄</b></button>{filterOpen && <><button className="kl-filter-dismiss" aria-label="Close filters" onClick={() => setFilterOpen(false)} /><div className="kl-filter-menu">{categories.map(c => <button key={c} className={category === c ? "chosen" : ""} onClick={() => {
                    setCategory(c);
                    setFilterOpen(false);
                  }}>{c}<span>{category === c ? "✓" : ""}</span></button>)}</div></>}</div></div></div>
        <div className={"kl-product-grid kl-view-" + viewMode}>{filtered.map((p, i) => <article key={p.id} className={"kl-card " + (viewMode === "mixed" ? (i === 0 ? "kl-card-featured" : i % 4 === 3 ? "kl-card-compact" : "kl-card-standard") : "kl-card-standard")} role="button" tabIndex={0} aria-label={"View " + p.name + " details"} style={{
            animationDelay: i * 55 + "ms"
          }} onClick={() => open(p)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(p); } }}><div className="kl-card-top"><ProductIcon item={p} /><span className="kl-card-arrow">↗</span></div><div className="kl-card-body"><div className="kl-card-kicker">{p.kind} <i /> {p.category}</div><h3>{p.name}</h3><p>{p.description}</p><div className="kl-card-foot"><span>{p.version ? "v" + p.version : "Latest"}</span><span>{p.rating ? "★ " + p.rating : "Discover"}</span></div></div></article>)}</div>
        {!filtered.length && <div className="kl-empty"><span>⌕</span><h3>No matches just yet.</h3><p>Try another search or choose a different category.</p><button onClick={() => {
            setSearch("");
            setCategory("All");
            setActive("All");
            setFilterOpen(false);
            searchInputRef.current?.focus();
          }}>Clear filters</button></div>}
      </section>
      <section className="kl-bottom-cta"><div className="kl-cta-glow" /><div className="kl-eyebrow">A LITTLE MORE DISCOVERY</div><h2>Good finds deserve<br /><em>to be shared.</em></h2><p>Know something worth discovering? Let’s put it on the map.</p><button className="kl-primary" onClick={() => notify("Submission portal will be available soon")}>Suggest an app <span>↗</span></button></section>
    </main>
    <footer className="kl-site-footer"><div className="kl-footer-main"><div className="kl-footer-brand"><a className="kl-brand" href="#/"><span className="kl-brand-mark"><span /></span><span>Khepi<span className="kl-brand-accent">Labs</span><small>APPS STORE</small></span></a><p>Your one-stop destination for discovering and exploring Android apps and games.</p><div className="kl-socials"><a href="https://t.me/khepilabs_support" aria-label="Telegram">➤</a><a href="mailto:support@khepilabs.com" aria-label="Email">✉</a></div></div><div><h3>Explore</h3><a href="#/">Home</a><a href="#/apps">Apps</a><a href="#/games">Games</a><a href="#/categories">Categories</a><a href="#/top-charts">Top Charts</a><a href="#/collections">Collections</a><a href="#/updates">Updates</a></div><div><h3>Legal</h3><a href="#/about">About Us</a><a href="#/privacy-policy">Privacy Policy</a><a href="#/terms-of-service">Terms of Service</a><a href="#/disclaimer">Disclaimer</a><a href="#/dmca-policy">DMCA Policy</a></div><div><h3>Contact</h3><a href="mailto:support@khepilabs.com">support@khepilabs.com</a><a href="https://t.me/khepilabs_support">Telegram: @khepilabs_support</a><a href="#/contact">KhepiLabs Team</a></div></div><div className="kl-footer-bottom"><span>© 2026 KhepiLabs. All rights reserved.</span><span>Made with ♥ by KhepiLabs</span></div></footer>
    {detail && <div className="kl-detail-overlay kl-page-enter" role="presentation" onMouseDown={e => {
      if (e.target === e.currentTarget) close();
    }}><article className="kl-detail" role="dialog" aria-modal="true" aria-labelledby="kl-detail-title">
      <button ref={detailCloseRef} className="kl-detail-close" onClick={close} aria-label="Close details">← <span>Back to discovery</span></button>
      <div className="kl-detail-head"><ProductIcon item={detail} large /><div><div className="kl-eyebrow">{detail.kind.toUpperCase()} / {detail.category.toUpperCase()}</div><h2 id="kl-detail-title">{detail.name}</h2><p>{detail.developer || "Independent developer"} {detail.version ? "· Version " + detail.version : ""}</p></div></div>
      {detail.description && <section className="kl-detail-section"><h3>About this {detail.kind.toLowerCase()}</h3><p>{detail.description}</p></section>}
      <div className="kl-detail-meta">{detail.size && <div><small>SIZE</small><b>{detail.size}</b></div>}{detail.rating && <div><small>RATING</small><b>★ {detail.rating}</b></div>}{detail.updated && <div><small>UPDATED</small><b>{detail.updated}</b></div>}</div>
      {(safeExternalUrl(detail.apk) || safeExternalUrl(detail.play)) && <div className="kl-detail-actions">{safeExternalUrl(detail.apk) && <a className="kl-primary" href={safeExternalUrl(detail.apk)} target="_blank" rel="noopener noreferrer">Download APK ↗</a>}{safeExternalUrl(detail.play) && <a className="kl-secondary" href={safeExternalUrl(detail.play)} target="_blank" rel="noopener noreferrer">Google Play ↗</a>}</div>}
      {!!detail.screenshots?.length && <section className="kl-detail-section"><h3>Screenshots</h3><div className="kl-screens">{detail.screenshots.map((s, i) => <img key={i} src={s} alt={detail.name + " screenshot " + (i + 1)} />)}</div></section>}
      {!!detail.changelog?.length && <section className="kl-detail-section"><h3>What’s new</h3><ul>{detail.changelog.map((c, i) => <li key={i}>{c}</li>)}</ul></section>}
      <div className="kl-detail-note">Details and download options are supplied by the publisher.</div>
    </article></div>}
    {toast && <div className="kl-toast">{toast}</div>}
  </div>;
}