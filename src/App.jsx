import { Navigate, Route, Routes } from "react-router-dom";
import { useStore } from "./lib/store.jsx";
import { useAuth } from "./lib/auth.jsx";
import Auth from "./pages/Auth.jsx";
import { Logo } from "./components/Icons.jsx";
import Layout from "./components/Layout.jsx";
import LockScreen from "./components/LockScreen.jsx";
import { Toasts } from "./components/UI.jsx";
import Landing from "./pages/Landing.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Reports from "./pages/Reports.jsx";
import Budget from "./pages/Budget.jsx";
import DataPage from "./pages/Data.jsx";
import Payroll from "./pages/Payroll.jsx";
import Inventory from "./pages/Inventory.jsx";
import Complaints from "./pages/Complaints.jsx";
import PricingStudio from "./pages/PricingStudio.jsx";
import Planner from "./pages/Planner.jsx";
import Team from "./pages/Team.jsx";
import Settings from "./pages/Settings.jsx";

function Splash() {
  return (
    <div className="lock-screen">
      <div className="row" style={{ gap: 12 }}>
        <Logo size={34} /> <span className="spinner" />
      </div>
    </div>
  );
}

// Signed in with Firebase, or taking the guided tour.
function RequireAccount({ children }) {
  const { user, ready, tour } = useAuth();
  if (tour) return children;
  if (!ready) return <Splash />;
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}

function RequireWorkspace({ children }) {
  const { state, locked } = useStore();
  if (locked) return <LockScreen />;
  if (!state?.onboarded) return <Navigate to="/start" replace />;
  return children;
}

// Signed-in visitors skip the sign-in screens.
function GuestOnly({ children }) {
  const { user, tour } = useAuth();
  if (user && !tour) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<GuestOnly><Auth mode="signin" /></GuestOnly>} />
        <Route path="/signup" element={<GuestOnly><Auth mode="signup" /></GuestOnly>} />
        <Route path="/reset" element={<GuestOnly><Auth mode="reset" /></GuestOnly>} />
        <Route path="/start" element={<RequireAccount><Onboarding /></RequireAccount>} />
        <Route
          path="/app"
          element={
            <RequireAccount>
              <RequireWorkspace>
                <Layout />
              </RequireWorkspace>
            </RequireAccount>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="budget" element={<Budget />} />
          <Route path="data" element={<DataPage />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="pricing" element={<PricingStudio />} />
          <Route path="planner" element={<Planner />} />
          <Route path="team" element={<Team />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toasts />
    </>
  );
}
