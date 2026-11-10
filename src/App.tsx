import React, { useEffect, useState } from 'react';
import { KhepiLabsHomePagePreview } from './components/generated/KhepiLabsHomePagePreview';
import { PublicPage } from './components/PublicPage';
import { AppDetailPage } from './components/AppDetailPage';
import { AdminPanel } from './components/AdminPanel';
import { AdminGate } from './components/AdminGate';
import { applySeo } from './lib/seo';
import './admin.css';


class AdminErrorBoundary extends React.Component<{children:React.ReactNode},{hasError:boolean}> {
  state={hasError:false};
  static getDerivedStateFromError(){return {hasError:true};}
  componentDidCatch(error:Error){console.error("Admin section render failed",error);}
  render(){if(this.state.hasError)return <main className="ka-error-screen"><section><h1>This admin section could not be opened.</h1><p>The rest of the control centre is still available. Return to Dashboard or reload this section after checking the browser console.</p><button onClick={()=>{this.setState({hasError:false});window.location.hash="#/admin";}}>Return to Dashboard</button></section></main>;return this.props.children;}
}

function readRoute() {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash.startsWith('/')) return hash.split('?')[0];
  if (!hash || hash === '/' || hash.startsWith('preview/')) return window.location.pathname.replace(/\/+$/, '') || '/';
  return '/';
}
function App() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const sync = () => setRoute(readRoute());
    window.addEventListener('hashchange', sync); window.addEventListener('popstate', sync);
    return () => { window.removeEventListener('hashchange', sync); window.removeEventListener('popstate', sync); };
  }, []);
  useEffect(() => { if (!/^\/(apps|games)\/[^/]+$/.test(route)) applySeo(route); }, [route]);
  useEffect(() => {
    const isAdmin = route === '/admin';
    document.documentElement.classList.toggle('kl-public-mode', !isAdmin);
    if (isAdmin) {
      document.documentElement.classList.remove('kl-light');
    } else {
      let savedTheme = 'light';
      try { savedTheme = localStorage.getItem('khl-theme') || 'light'; } catch { /* storage unavailable */ }
      document.documentElement.classList.toggle('kl-light', savedTheme !== 'dark');
    }
  }, [route]);
  if (route === '/admin') return <AdminGate>{({role,userId})=><AdminErrorBoundary><AdminPanel role={role} userId={userId}/></AdminErrorBoundary>}</AdminGate>;
  const detail = route.match(/^\/(?:apps|games)\/([^/]+)$/);
  if (detail) return <AppDetailPage slug={decodeURIComponent(detail[1])}/>;
  if (route === '/') return <KhepiLabsHomePagePreview />;
  return <PublicPage route={route} />;
}
export default App;
