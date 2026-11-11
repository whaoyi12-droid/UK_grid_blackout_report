import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import './style.css';
import App from './App';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

import './presentation.css';
import './timeline-scene.css';
