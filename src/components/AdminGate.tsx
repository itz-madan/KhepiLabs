import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getAdminProfile } from "../lib/catalogue";
import "../auth.css";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [checking,setChecking]=useState(true);
  const [sessionUser,setSessionUser]=useState<any>(null);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  const verify = async (user:any) => {
    if(!user){setSessionUser(null);setChecking(false);return;}
    try {
      const profile=await getAdminProfile(user.id);
      if(!profile){await supabase.auth.signOut();setSessionUser(null);setError("This account does not have KhepiLabs admin access.");}
      else {setSessionUser({...user,role:profile.role});setError("");}
    } catch(e:any) {setSessionUser(null);setError(e.message||"Could not verify administrator access.");}
    finally {setChecking(false);}
  };
  useEffect(()=>{
    let alive=true;
    supabase.auth.getSession().then(({data})=>{if(alive)void verify(data.session?.user);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(alive)void verify(session?.user);});
    return ()=>{alive=false;subscription.unsubscribe();};
  },[]);
  const login=async(e:FormEvent)=>{
    e.preventDefault();setBusy(true);setError("");
    const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    if(error){setError(error.message);setBusy(false);return;}
    await verify(data.user);
    setBusy(false);
  };
  if(checking)return <div className="kag-screen"><div className="kag-card"><div className="kag-mark">K</div><h2>Checking secure session</h2><p>Verifying your KhepiLabs administrator access…</p></div></div>;
  if(sessionUser)return <>{children}</>;
  return <div className="kag-screen"><form className="kag-card" onSubmit={login}>
    <div className="kag-mark">K</div><div className="kag-eyebrow"><ShieldCheck size={14}/> SECURE ADMIN ACCESS</div>
    <h1>Welcome back<span>.</span></h1><p>Sign in with your authorised KhepiLabs administrator account.</p>
    <label>Email address<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com"/></label>
    <label>Password<div className="kag-password"><input type={showPassword?"text":"password"} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label="Toggle password visibility">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
    {error&&<div className="kag-error">{error}</div>}
    <button className="kag-submit" disabled={busy}>{busy?"Signing in…":<><LockKeyhole size={16}/> Sign in securely</>}</button>
    <small>Access is restricted to accounts listed in the admin_profiles table.</small>
  </form></div>;
}
