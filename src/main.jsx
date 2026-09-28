import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { StoreProvider } from "./lib/store.jsx";
import App from "./App.jsx";
import "./styles.css";
import "./landing.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </StrictMode>,
);
