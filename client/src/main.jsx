import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Polyfills are handled by vite-plugin-node-polyfills in vite.config.js
// Do not manually override Buffer with empty array as it breaks simple-peer

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
