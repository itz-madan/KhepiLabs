import { useEffect, useState } from 'react';
import { KhepiLabsHomePagePreview } from './components/generated/KhepiLabsHomePagePreview';
import { PublicPage } from './components/PublicPage';
import { AdminPanel } from './components/AdminPanel';
import { AdminGate } from './components/AdminGate';
import { applySeo } from './lib/seo';
import './admin.css';

function readRoute() {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash.startsWith('/')) return hash.split('?')[0];
  if (!hash || hash === '/' || hash.startsWith('preview/')) {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    return path;
  }
  return '/';
}

function App() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const sync = () => setRoute(readRoute());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => { window.removeEventListener('hashchange', sync); window.removeEventListener('popstate', sync); };
  }, []);
  useEffect(() => { applySeo(route); }, [route]);
  if (route === '/admin') return <AdminGate>{({role,userId})=><AdminPanel role={role} userId={userId}/>}</AdminGate>;
  if (route === '/') return <KhepiLabsHomePagePreview />;
  return <PublicPage route={route} />;
}
export default App;
