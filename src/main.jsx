import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import AuthProvider from './context/AuthContext.jsx';
import LeadsProvider from './context/LeadsContext.jsx';

import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/auth.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LeadsProvider>
          <App />
        </LeadsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);