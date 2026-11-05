import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Ouverture from './Ouverture';
import './styles.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Ouverture />
  </StrictMode>,
);
