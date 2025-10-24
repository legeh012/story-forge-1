import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Performance monitoring
if (import.meta.env.PROD) {
  console.log("StoryForge App - Production Mode");
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center; padding: 2rem;">
      <div>
        <h1 style="color: #ef4444; margin-bottom: 1rem;">Application Error</h1>
        <p style="color: #666;">Unable to mount application. Please refresh the page or contact support.</p>
      </div>
    </div>
  `;
  throw new Error("Root element #root not found in DOM");
}

// Initialize React application
try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Failed to render application:", error);
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center; padding: 2rem; background: #0f0f1a; color: white;">
      <div>
        <h1 style="color: #ef4444; margin-bottom: 1rem;">Initialization Failed</h1>
        <p style="color: #999; margin-bottom: 1.5rem;">An error occurred while starting the application.</p>
        <button 
          onclick="window.location.reload()" 
          style="padding: 0.75rem 1.5rem; background: #9b87f5; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem;"
        >
          Reload Application
        </button>
      </div>
    </div>
  `;
}
