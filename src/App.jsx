import { Navigate, Route, Routes } from "react-router-dom";
import { useStore } from "./lib/store.jsx";
import Layout from "./components/Layout.jsx";
import LockScreen from "./components/LockScreen.jsx";
import { Toasts } from "./components/UI.jsx";
import Landing from "./pages/Landing.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Reports from "./pages/Reports.jsx";
import Advisor from "./pages/Advisor.jsx";
import Budget from "./pages/Budget.jsx";
import DataPage from "./pages/Data.jsx";
import Payroll from "./pages/Payroll.jsx";
import Inventory from "./pages/Inventory.jsx";
import Complaints from "./pages/Complaints.jsx";
import PricingStudio from "./pages/PricingStudio.jsx";
import Planner from "./pages/Planner.jsx";
import Team from "./pages/Team.jsx";
import Settings from "./pages/Settings.jsx";

function RequireWorkspace({ children }) {
  const { state, locked } = useStore();
  if (locked) return <LockScreen />;
  if (!state?.onboarded) return <Navigate to="/start" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/start" element={<Onboarding />} />
        <Route
          path="/app"
          element={
            <RequireWorkspace>
              <Layout />
            </RequireWorkspace>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="advisor" element={<Advisor />} />
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
