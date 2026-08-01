import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const container = document.getElementById('root');

if (!container) {
  throw new Error('#root 要素が見つかりません。index.html を確認してください。');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
