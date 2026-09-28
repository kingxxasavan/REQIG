import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth.jsx";
import { StoreProvider } from "./lib/store.jsx";
import { AdvisorProvider } from "./components/AdvisorDock.jsx";
import { TourProvider } from "./tour/TourProvider.jsx";
import TourBridge from "./tour/TourBridge.jsx";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./styles.css";
import "./landing.css";

// The workspace is keyed by who is signed in, so switching accounts (or
// starting the tour) loads a different, separate set of books.
function ScopedStore({ children }) {
  const { scope } = useAuth();
  return (
    <StoreProvider key={scope} scope={scope}>
      {children}
    </StoreProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
    <HashRouter>
      <AuthProvider>
        <AdvisorProvider>
          <TourProvider>
            <ScopedStore>
              <App />
              <TourBridge />
            </ScopedStore>
          </TourProvider>
        </AdvisorProvider>
      </AuthProvider>
    </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
);
