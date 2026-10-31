import { useEffect, useState } from 'react';
import { KhepiLabsHomePagePreview } from './components/generated/KhepiLabsHomePagePreview';
import { PublicPage } from './components/PublicPage';

function readRoute() {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash || hash === '/' || hash.startsWith('preview/')) return '/';
  if (hash.startsWith('/')) return hash.split('?')[0];
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
  if (route === '/') return <KhepiLabsHomePagePreview />;
  return <PublicPage route={route} />;
}
export default App;
