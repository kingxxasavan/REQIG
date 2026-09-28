import { useNavigate } from "react-router-dom";
import { Modal } from "./UI.jsx";
import { useStore } from "../lib/store.jsx";
import { industryList } from "../lib/industries.js";

// Replaces the current workspace with a generated sample business.
export default function DemoPicker({ onClose }) {
  const { loadDemo } = useStore();
  const nav = useNavigate();
  return (
    <Modal title="Load a sample business" onClose={onClose} wide>
      <p className="text-2">Pick an industry. EPRI generates a realistic company with 12 months of books, a team, suppliers and complaints. This replaces the data in this workspace.</p>
      <div className="demo-grid">
        {industryList.map((i) => (
          <button
            key={i.key}
            className="demo-card"
            onClick={() => {
              loadDemo(i.key);
              onClose();
              nav("/app");
            }}
          >
            <span className="emoji">{i.icon}</span>
            <b>{i.label}</b>
            <span className="xs muted">{i.tools[0]}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
