import { useRef, useState } from "react";
import { Icon } from "./Icons.jsx";
import { ACCEPTED } from "../lib/parse.js";

export default function FileDrop({ onFile, title = "Drop a file here or click to browse", hint = "CSV, TSV, JSON or Excel (.xlsx) · up to 5 MB", disabled }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();
  const pick = (files) => files?.[0] && onFile(files[0]);
  return (
    <div
      className={`dropzone ${drag ? "drag" : ""}`}
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={() => !disabled && ref.current.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !disabled && ref.current.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (!disabled) pick(e.dataTransfer.files);
      }}
      style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
    >
      <Icon name="upload" size={26} />
      <h4>{title}</h4>
      <p>{hint}</p>
      <input ref={ref} type="file" hidden accept={ACCEPTED.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
    </div>
  );
}
