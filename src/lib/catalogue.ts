import { supabase } from "./supabase";

export type CatalogueEntry = {
  id: string; name: string; kind: "App" | "Game"; category: string;
  version?: string; developer?: string; size?: string; rating?: string;
  downloads?: string; description?: string; icon?: string; iconBg?: string;
  trending?: boolean; updated?: string; apk?: string; play?: string;
  screenshots?: string[]; changelog?: string[]; status?: string;
};

export function fromAppRow(row: any): CatalogueEntry {
  return { ...(row.data || {}), id: row.id, status: row.status, name: row.data?.name || row.slug || row.id };
}
export function toAppRow(item: CatalogueEntry) {
  const { id, status = "draft", ...data } = item;
  return { id, slug: (item.name || id).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), data, status, is_visible: status === "published", deleted_at: null, updated_at: new Date().toISOString() };
}
export async function fetchPublishedApps() {
  const { data, error } = await supabase.from("apps").select("id,data,status,slug").eq("status","published").eq("is_visible",true).is("deleted_at",null).order("updated_at",{ascending:false});
  if (error) throw error;
  return (data || []).map(fromAppRow);
}
export async function fetchAdminApps() {
  const { data, error } = await supabase.from("apps").select("id,data,status,slug").is("deleted_at",null).order("updated_at",{ascending:false});
  if (error) throw error;
  return (data || []).map(fromAppRow);
}
export async function saveApp(item: CatalogueEntry) {
  const row = toAppRow(item);
  const { error } = await supabase.from("apps").upsert(row,{onConflict:"id"});
  if (error) throw error;
}
export async function deleteApp(id: string) {
  const { error } = await supabase.from("apps").update({deleted_at:new Date().toISOString(),is_visible:false,status:"deleted"}).eq("id",id);
  if (error) throw error;
}
export function subscribeToApps(onChange: () => void) {
  return supabase.channel("khepilabs-app-catalogue")
    .on("postgres_changes",{event:"*",schema:"public",table:"apps"},onChange)
    .subscribe();
}
export async function getAdminProfile(userId: string) {
  const { data, error } = await supabase.from("admin_profiles").select("id,role").eq("id",userId).maybeSingle();
  if (error) throw error;
  return data;
}
