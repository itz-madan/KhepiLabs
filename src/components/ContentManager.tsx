import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Plus, Pencil, Trash2, Save, X, RefreshCw } from "lucide-react";

type Config={table:string;title:string;description:string;activeColumn?:string;visibleColumn?:string;readonly?:boolean;sortColumn?:string};
const configs:Record<string,Config>={
"Categories":{table:"categories",title:"Categories",description:"Manage categories used to organise public apps and games."},
"Trending & Banners":{table:"site_settings",title:"Trending, banners & featured content",description:"Edit homepage configuration stored in site_settings. Use the record ID to keep settings organised."},
"Updates":{table:"announcements",title:"Updates & announcements",description:"Publish notices and platform updates to the public website.",activeColumn:"is_active"},
"Projects":{table:"projects",title:"Projects",description:"Manage KhepiLabs projects and public project cards.",visibleColumn:"is_visible"},
"Tags":{table:"tags",title:"Tags",description:"Manage discovery tags used by the catalogue."},
"Versions":{table:"app_versions",title:"App versions & changelogs",description:"Create version records linked to an app ID."},
"Settings":{table:"site_settings",title:"Site settings",description:"Manage public site configuration records."},
"Storage":{table:"storage_files",title:"Storage file registry",description:"Review metadata for uploaded files in Supabase Storage."},
"Activity":{table:"activity_logs",title:"Activity logs",description:"Review administrative activity recorded in the database.",readonly:true,sortColumn:"created_at"},
"Reviews":{table:"app_ratings",title:"App ratings",description:"Review ratings submitted for published apps.",readonly:true,sortColumn:"created_at"}
};
export function ContentManager({section,notify}:{section:string;notify:(s:string)=>void}){
 const config=configs[section];
 if(!config)return <section className="ka-panel ka-empty"><h2>Section unavailable</h2><p>No data configuration exists for “{section}”. No database records were changed.</p></section>;
 const [rows,setRows]=useState<any[]>([]);
 const [loading,setLoading]=useState(true);
 const [editing,setEditing]=useState<any|null>(null);
 const [editorOpen,setEditorOpen]=useState(false);
 const [id,setId]=useState("");
 const [json,setJson]=useState("{}");
 const [active,setActive]=useState(true);
 const [visible,setVisible]=useState(true);
 const [busy,setBusy]=useState(false);
 const load=async()=>{setLoading(true);try{const {data,error}=await supabase.from(config.table).select("*").order(config.sortColumn||"updated_at",{ascending:false});if(error){setRows([]);notify("Could not load "+config.title+": "+error.message);}else setRows(data||[]);}catch(error:any){setRows([]);notify("Could not load "+config.title+": "+(error?.message||"Unexpected database error"));}finally{setLoading(false);}};
 useEffect(()=>{setEditing(null);void load();},[config.table]);
 const open=(row?:any)=>{setEditorOpen(true);setEditing(row||null);setId(row?.id||"");setJson(JSON.stringify(row?.data||{},null,2));setActive(row?.[config.activeColumn||"is_active"]??true);setVisible(row?.[config.visibleColumn||"is_visible"]??true);};
 const save=async()=>{let data:any;try{data=JSON.parse(json);if(!data||typeof data!=="object"||Array.isArray(data))throw new Error("JSON must be an object");}catch(e:any){notify("Invalid JSON: "+e.message);return;}if(!id.trim()){notify("Record ID is required");return;}setBusy(true);const payload:any={id:id.trim(),data,updated_at:new Date().toISOString()};if(config.activeColumn)payload[config.activeColumn]=active;if(config.visibleColumn)payload[config.visibleColumn]=visible;if(config.table==="app_versions"&&!data.app_id){notify("Add app_id inside JSON for version records");setBusy(false);return;}if(config.table==="app_versions"){payload.app_id=String(data.app_id);delete payload.data.app_id;}const {error}=await supabase.from(config.table).upsert(payload,{onConflict:"id"});setBusy(false);if(error){notify("Save failed: "+error.message);return;}notify("Saved to Supabase");setEditing(null);setEditorOpen(false);void load();};
 const remove=async(row:any)=>{if(!window.confirm("Delete this record?"))return;const {error}=await supabase.from(config.table).delete().eq("id",row.id);if(error)notify("Delete failed: "+error.message);else{notify("Record deleted");void load();}};
 return <><div className="ka-page-heading"><div><div className="ka-eyebrow">DATABASE / {config.table.toUpperCase()}</div><h1>{config.title}<span>.</span></h1><p>{config.description}</p></div>{!config.readonly&&<button className="ka-primary" onClick={()=>open()}><Plus size={16}/> Add record</button>}</div>
 <section className="ka-panel"><div className="ka-panel-head"><div><h3>{config.title} records</h3><p>{rows.length} records · Live Supabase data</p></div><button className="ka-filter-btn" onClick={()=>void load()}><RefreshCw size={14}/> Refresh</button></div>
 {editorOpen&&<div className="ka-json-editor"><div className="ka-panel-head"><div><h3>{editing.id?"Edit record":"New record"}</h3><p>Record payload stored as JSONB.</p></div><button className="ka-row-action" onClick={()=>{setEditing(null);setEditorOpen(false)}}><X size={17}/></button></div><label className="ka-field">Record ID<input value={id} disabled={!!editing?.id} onChange={e=>setId(e.target.value)} placeholder="e.g. featured-home"/></label>{config.table==="app_versions"&&<p className="ka-inline-note">Include <code>app_id</code> and <code>version</code> in the JSON data.</p>}<label className="ka-field">Data (JSON)<textarea className="ka-json-area" value={json} onChange={e=>setJson(e.target.value)} rows={10}/></label>{config.activeColumn&&<label className="ka-check"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/> Active / published</label>}{config.visibleColumn&&<label className="ka-check"><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/> Visible on public website</label>}<div className="ka-modal-actions"><button className="ka-cancel" onClick={()=>{setEditing(null);setEditorOpen(false)}}>Cancel</button><button className="ka-primary" disabled={busy} onClick={()=>void save()}><Save size={15}/>{busy?"Saving…":"Save record"}</button></div></div>}
 {loading?<div className="ka-empty">Loading records…</div>:rows.length===0?<div className="ka-empty">No records yet. Add your first record to this section.</div>:<div className="ka-table-wrap"><table><thead><tr><th>RECORD ID</th><th>DATA PREVIEW</th><th>UPDATED</th><th>ACTIONS</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><b>{row.id}</b></td><td><span className="ka-json-preview">{JSON.stringify(row.data||{}).slice(0,140)}</span></td><td>{row.updated_at?new Date(row.updated_at).toLocaleString():"—"}</td><td><div className="ka-actions">{!config.readonly&&<><button onClick={()=>open(row)} title="Edit"><Pencil size={14}/></button><button onClick={()=>void remove(row)} title="Delete"><Trash2 size={14}/></button></>}</div></td></tr>)}</tbody></table></div>}</section></>;
}
