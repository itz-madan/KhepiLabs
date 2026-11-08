import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Eye, Plus, Save, Trash2, X } from "lucide-react";
import { fetchAdminApps, saveApp } from "../lib/catalogue";

type AppRecord = any;
type DownloadOption = { id: string; key: string; label: string; url: string; version: string; size: string; enabled: boolean; order: number; primary?: boolean };
type DescriptionSection = { id: string; title: string; html: string; enabled: boolean };
const architectures = [
  ["universal", "Universal APK"], ["arm64-v8a", "ARM64 APK"], ["armeabi-v7a", "ARM32 APK"], ["x86", "x86 APK"], ["x86_64", "x86_64 APK"], ["custom", "Custom link"]
] as const;
const uid = () => Math.random().toString(36).slice(2, 10);
const defaultSections = (): DescriptionSection[] => [
  { id: uid(), title: "Application Introduction", html: "<p>Introduce your application and what it does.</p>", enabled: true },
  { id: uid(), title: "Short Description", html: "<p>A short overview of the app.</p>", enabled: true },
  { id: uid(), title: "Key Features", html: "<ul><li>First key feature</li><li>Second key feature</li></ul>", enabled: true },
  { id: uid(), title: "Feature Highlights", html: "<p>Highlight the most important capabilities.</p>", enabled: true },
  { id: uid(), title: "Additional Information", html: "<p>Compatibility, requirements and other details.</p>", enabled: true },
  { id: uid(), title: "Important Notes", html: "<p>Any important information users should know.</p>", enabled: true }
];
const safeHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  doc.querySelectorAll("script,style,iframe,object,embed,form,svg,math").forEach(n => n.remove());
  doc.body.querySelectorAll("*").forEach(el => {
    [...el.attributes].forEach(attr => {
      const name = attr.name.toLowerCase(), value = attr.value.trim();
      if (name.startsWith("on") || name === "srcdoc" || ((name === "href" || name === "src") && /^\s*(javascript:|data:text\/html)/i.test(value))) el.removeAttribute(attr.name);
      if (name === "style" && /url\s*\(|expression\s*\(|position\s*:\s*fixed/i.test(value)) el.removeAttribute(attr.name);
    });
  });
  return doc.body.innerHTML;
};
export function AppPublishingManager({ section, notify }: { section: "Download Settings" | "Description Editor"; notify: (message: string) => void }) {
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState<DownloadOption[]>([]);
  const [releaseUrl, setReleaseUrl] = useState("");
  const [primaryLabel, setPrimaryLabel] = useState("Download for Android");
  const [sections, setSections] = useState<DescriptionSection[]>(defaultSections());
  const [activeSection, setActiveSection] = useState("");
  const [draft, setDraft] = useState(false);
  const editor = useRef<HTMLDivElement>(null);
  const selected = apps.find(a => a.id === selectedId);
  useEffect(() => { void fetchAdminApps().then(rows => { setApps(rows as AppRecord[]); if (rows[0]) setSelectedId(rows[0].id); }).catch(e => notify("Could not load apps: " + e.message)); }, []);
  useEffect(() => {
    if (!selected) return;
    const d = selected;
    const raw = Array.isArray(d.downloads) ? d.downloads : [];
    setOptions(raw.map((o: any, i: number) => ({ id: o.id || uid(), key: o.key || "custom", label: o.label || "Download", url: o.url || "", version: o.version || d.version || "", size: o.size || "", enabled: o.enabled !== false, order: Number(o.order ?? i), primary: !!o.primary })).sort((a: DownloadOption, b: DownloadOption) => a.order - b.order));
    setReleaseUrl(d.githubReleasesUrl || "");
    setPrimaryLabel(d.downloadButtonLabel || "Download for Android");
    const content = Array.isArray(d.descriptionSections) && d.descriptionSections.length ? d.descriptionSections : defaultSections();
    setSections(content.map((s: any) => ({ id: s.id || uid(), title: s.title || "Section", html: safeHtml(s.html || ""), enabled: s.enabled !== false })));
    setActiveSection(content[0]?.id || "");
    setDraft(d.contentStatus === "draft");
  }, [selectedId, apps]);
  const currentSection = sections.find(s => s.id === activeSection);
  const updateSection = (patch: Partial<DescriptionSection>) => setSections(old => old.map(s => s.id === activeSection ? { ...s, ...patch } : s));
  const addOption = (key: string) => { const meta = architectures.find(a => a[0] === key); setOptions(old => [...old, { id: uid(), key, label: meta?.[1] || "Custom download", url: "", version: selected?.version || "", size: "", enabled: true, order: old.length }]); };
  const updateOption = (id: string, patch: Partial<DownloadOption>) => setOptions(old => old.map(o => o.id === id ? { ...o, ...patch } : o));
  const moveOption = (id: string, dir: -1 | 1) => setOptions(old => { const list = [...old].sort((a,b)=>a.order-b.order); const i=list.findIndex(o=>o.id===id), j=i+dir; if(j<0||j>=list.length)return old; [list[i],list[j]]=[list[j],list[i]]; return list.map((o,index)=>({...o,order:index})); });
  const save = async (publish: boolean) => {
    if (!selected) return;
    if (section === "Download Settings") {
      const active = options.filter(o => o.enabled);
      if (active.some(o => !/^https:\/\//i.test(o.url.trim()))) { notify("Every enabled download option needs a valid HTTPS URL."); return; }
      if (releaseUrl && !/^https:\/\//i.test(releaseUrl)) { notify("GitHub Releases URL must use HTTPS."); return; }
    }
    setBusy(true);
    try {
      const patch = section === "Download Settings"
        ? { downloads: options.map((o,i)=>({...o,order:i,url:o.url.trim()})), githubReleasesUrl: releaseUrl.trim(), downloadButtonLabel: primaryLabel }
        : { descriptionSections: sections.map(s=>({...s,html:safeHtml(s.html)})), contentStatus: publish ? "published" : "draft" };
      await saveApp({ ...selected, ...patch } as any);
      setApps(old => old.map(a => a.id === selected.id ? { ...a, ...patch } : a));
      notify(publish ? "Changes published successfully." : "Draft saved successfully.");
    } catch (e: any) { notify("Save failed: " + (e.message || "Unknown error")); }
    finally { setBusy(false); }
  };
  const enabledOptions = useMemo(() => options.filter(o=>o.enabled).sort((a,b)=>a.order-b.order), [options]);
  const command = (name: string, value?: string) => { editor.current?.focus(); document.execCommand(name, false, value); if (editor.current && currentSection) updateSection({ html: editor.current.innerHTML }); };
  const addSection = () => { const s={id:uid(),title:"New section",html:"<p>Write your content here.</p>",enabled:true}; setSections(old=>[...old,s]);setActiveSection(s.id); };
  return <div className="ka-publishing-manager">
    <div className="ka-page-heading"><div><div className="ka-eyebrow">APPLICATION MANAGEMENT</div><h1>{section}<span>.</span></h1><p>{section === "Download Settings" ? "Configure independent GitHub release downloads for every app and game." : "Create structured, richly formatted descriptions with a live preview."}</p></div><label className="ka-field ka-app-picker">Select application<select value={selectedId} onChange={e=>setSelectedId(e.target.value)}>{apps.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label></div>
    {!selected ? <section className="ka-panel ka-empty">No applications found. Add an app first.</section> : section === "Download Settings" ? <>
      <section className="ka-panel"><div className="ka-panel-head"><div><h3>Primary download button</h3><p>Shown prominently on the public app page.</p></div></div><div className="ka-form-grid"><label className="ka-field">Button label<input value={primaryLabel} onChange={e=>setPrimaryLabel(e.target.value)} maxLength={48}/></label><label className="ka-field">GitHub Releases page URL<input value={releaseUrl} onChange={e=>setReleaseUrl(e.target.value)} placeholder="https://github.com/owner/repo/releases"/></label></div><div className="ka-download-option-list">{options.sort((a,b)=>a.order-b.order).map((o,i)=><div className="ka-download-option" key={o.id}><div className="ka-download-option-top"><b>{o.label}</b><label className="ka-check"><input type="checkbox" checked={o.enabled} onChange={e=>updateOption(o.id,{enabled:e.target.checked})}/> Enabled</label><div className="ka-inline-actions"><button type="button" onClick={()=>moveOption(o.id,-1)} disabled={i===0}><ChevronUp size={15}/></button><button type="button" onClick={()=>moveOption(o.id,1)} disabled={i===options.length-1}><ChevronDown size={15}/></button><button type="button" onClick={()=>setOptions(old=>old.filter(x=>x.id!==o.id))}><Trash2 size={15}/></button></div></div><div className="ka-form-grid"><label className="ka-field">Architecture<select value={o.key} onChange={e=>updateOption(o.id,{key:e.target.value,label:architectures.find(a=>a[0]===e.target.value)?.[1]||"Custom download"})}>{architectures.map(a=><option key={a[0]} value={a[0]}>{a[1]}</option>)}</select></label><label className="ka-field">Display name<input value={o.label} onChange={e=>updateOption(o.id,{label:e.target.value})}/></label><label className="ka-field ka-field-wide">GitHub / custom download URL<input value={o.url} onChange={e=>updateOption(o.id,{url:e.target.value})} placeholder="https://github.com/owner/repo/releases/latest/download/app.apk"/></label><label className="ka-field">Version<input value={o.version} onChange={e=>updateOption(o.id,{version:e.target.value})}/></label><label className="ka-field">File size (optional)<input value={o.size} onChange={e=>updateOption(o.id,{size:e.target.value})} placeholder="43.8 MB"/></label><label className="ka-check"><input type="radio" name="primary-download" checked={!!o.primary} onChange={()=>setOptions(old=>old.map(x=>({...x,primary:x.id===o.id})))}/> Use as primary download</label></div></div>)}</div><div className="ka-modal-actions"><div className="ka-add-download">{architectures.map(a=><button type="button" className="ka-filter-btn" key={a[0]} onClick={()=>addOption(a[0])}><Plus size={14}/>{a[1]}</button>)}</div><button className="ka-primary" disabled={busy} onClick={()=>void save(true)}><Save size={15}/>{busy?"Saving…":"Save download settings"}</button></div></section>
      <section className="ka-panel"><div className="ka-panel-head"><div><h3>Public download preview</h3><p>Only enabled options with configured URLs will appear.</p></div></div><div className="ka-public-download-preview"><button className="ka-primary" disabled={!enabledOptions.length}>{primaryLabel} · {selected.version || "Latest"}</button>{enabledOptions.map(o=><a key={o.id} href={o.url||undefined} target="_blank" rel="noreferrer">{o.label} {o.version && "· v"+o.version} {o.size && "· "+o.size}</a>)}{releaseUrl&&<a href={releaseUrl} target="_blank" rel="noreferrer">View all releases ↗</a>}</div></section>
    </> : <>
      <section className="ka-panel"><div className="ka-panel-head"><div><h3>Description template</h3><p>Reorder, rename, add or remove sections. Select a section to edit its content.</p></div><button className="ka-filter-btn" onClick={addSection}><Plus size={14}/> Add section</button></div><div className="ka-description-workspace"><div className="ka-description-sections">{sections.map((s,i)=><div className={"ka-description-section "+(s.id===activeSection?"active":"")} key={s.id}><button type="button" onClick={()=>setActiveSection(s.id)}>{s.title}</button><label><input type="checkbox" checked={s.enabled} onChange={e=>setSections(old=>old.map(x=>x.id===s.id?{...x,enabled:e.target.checked}:x))}/> Show</label><div><button type="button" disabled={!i} onClick={()=>setSections(old=>{const n=[...old];[n[i-1],n[i]]=[n[i],n[i-1]];return n;})}><ChevronUp size={14}/></button><button type="button" disabled={i===sections.length-1} onClick={()=>setSections(old=>{const n=[...old];[n[i+1],n[i]]=[n[i],n[i+1]];return n;})}><ChevronDown size={14}/></button><button type="button" onClick={()=>{setSections(old=>old.filter(x=>x.id!==s.id));if(activeSection===s.id)setActiveSection(sections.find(x=>x.id!==s.id)?.id||"");}}><Trash2 size={14}/></button></div></div>)}</div><div className="ka-description-editor"><label className="ka-field">Section heading<input value={currentSection?.title||""} onChange={e=>updateSection({title:e.target.value})}/></label><div className="ka-editor-toolbar"><button type="button" onClick={()=>command("bold")}><b>B</b></button><button type="button" onClick={()=>command("italic")}><i>I</i></button><button type="button" onClick={()=>command("underline")}><u>U</u></button><button type="button" onClick={()=>command("formatBlock","<h2>")}>H2</button><button type="button" onClick={()=>command("insertUnorderedList")}>• List</button><button type="button" onClick={()=>command("insertOrderedList")}>1. List</button><button type="button" onClick={()=>{const url=window.prompt("HTTPS link URL");if(url&&/^https:\/\//.test(url))command("createLink",url);}}>Link</button><input aria-label="Text colour" type="color" onChange={e=>command("foreColor",e.target.value)}/><input aria-label="Highlight colour" type="color" onChange={e=>command("hiliteColor",e.target.value)}/><select aria-label="Text alignment" onChange={e=>command(e.target.value)}><option value="justifyLeft">Left</option><option value="justifyCenter">Center</option><option value="justifyRight">Right</option><option value="justifyFull">Justify</option></select><select aria-label="Font size" onChange={e=>command("fontSize",e.target.value)}><option value="3">Normal</option><option value="2">Small</option><option value="4">Large</option><option value="5">XL</option><option value="6">XXL</option></select></div><div ref={editor} className="ka-rich-editor" contentEditable suppressContentEditableWarning onInput={e=>updateSection({html:(e.currentTarget as HTMLDivElement).innerHTML})} dangerouslySetInnerHTML={{__html:currentSection?.html||""}}/><div className="ka-editor-note">Select any word or sentence before applying formatting. Only safe HTML formatting is published.</div></div></div></section>
      <section className="ka-panel"><div className="ka-panel-head"><div><h3><Eye size={16}/> Live page preview</h3><p>Preview of the enabled description sections.</p></div></div><article className="ka-description-preview"><h2>{selected.name}</h2><p>{selected.description||"Application description"}</p>{sections.filter(s=>s.enabled).map(s=><section key={s.id}><h3>{s.title}</h3><div dangerouslySetInnerHTML={{__html:safeHtml(s.html)}}/></section>)}</article></section>
      <div className="ka-modal-actions"><button className="ka-cancel" disabled={busy} onClick={()=>void save(false)}>Save Draft</button><button className="ka-primary" disabled={busy} onClick={()=>void save(true)}><Check size={15}/>{busy?"Saving…":"Publish description"}</button></div>
    </>}
  </div>;
}
