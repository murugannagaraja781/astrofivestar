import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Polyfill for process/buffer in browser for simple-peer
import * as process from "process";
window.global = window;
window.process = process;
window.Buffer = [];

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
