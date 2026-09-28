import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { useStore } from "../lib/store.jsx";
import { money, monthLabel } from "../lib/format.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip);

// Charts read their colors from the same CSS tokens as the rest of the UI,
// and re-read them whenever the theme flips.
function useTokens() {
  const { theme } = useStore();
  const [sys, setSys] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const fn = (e) => setSys(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return useMemo(() => {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim();
    return {
      key: `${theme}-${sys}`,
      text: v("--text"),
      text2: v("--text-2"),
      muted: v("--muted"),
      grid: v("--grid"),
      baseline: v("--baseline"),
      surface: v("--surface"),
      pos: v("--pos"),
      neg: v("--neg"),
      series: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => v(`--s${i}`)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, sys]);
}

function baseOptions(t, currency, { stacked = false, horizontal = false, compact = true } = {}) {
  const valueAxis = {
    stacked,
    grid: { color: t.grid, drawTicks: false },
    border: { display: false },
    ticks: { color: t.muted, padding: 8, font: { size: 11 }, callback: (v) => money(v, currency, { compact }) },
  };
  const catAxis = {
    stacked,
    grid: { display: false },
    border: { color: t.baseline },
    ticks: { color: t.muted, font: { size: 11 }, maxRotation: 0, autoSkipPadding: 10 },
  };
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? "y" : "x",
    interaction: { mode: horizontal ? "nearest" : "index", intersect: false, axis: horizontal ? "y" : "x" },
    animation: { duration: 500 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: t.surface,
        titleColor: t.text,
        bodyColor: t.text2,
        borderColor: t.grid,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${money(ctx.parsed[horizontal ? "x" : "y"], currency)}` },
      },
    },
    scales: horizontal ? { x: { ...valueAxis, beginAtZero: true }, y: catAxis } : { x: catAxis, y: { ...valueAxis, beginAtZero: true } },
  };
}

export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((it) => (
        <span key={it.label}>
          <i className={it.type || ""} style={{ background: it.color, borderColor: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

// Revenue vs expenses over time, with the forecast continuing dashed.
export function RevenueExpenseChart({ rows, forecast = [], currency, height = "tall" }) {
  const t = useTokens();
  const labels = [...rows, ...forecast].map((r) => monthLabel(r.month));
  const pad = (arr) => [...arr, ...forecast.map(() => null)];
  const fpad = (field) => {
    if (!forecast.length) return [];
    const lead = rows.map(() => null);
    lead[lead.length - 1] = rows[rows.length - 1][field];
    return [...lead, ...forecast.map((f) => f[field])];
  };
  const line = (color) => ({ borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointHoverBorderWidth: 2, pointHoverBorderColor: t.surface, tension: 0.3, cubicInterpolationMode: "monotone" });
  const data = {
    labels,
    datasets: [
      { label: "Revenue", data: pad(rows.map((r) => r.revenue)), ...line(t.series[0]), fill: { target: "origin", above: t.series[0] + "14" } },
      { label: "Expenses", data: pad(rows.map((r) => r.expenses)), ...line(t.series[1]) },
      ...(forecast.length
        ? [
            { label: "Revenue (forecast)", data: fpad("revenue"), ...line(t.series[0]), borderDash: [5, 4] },
            { label: "Expenses (forecast)", data: fpad("expenses"), ...line(t.series[1]), borderDash: [5, 4] },
          ]
        : []),
    ],
  };
  const opts = baseOptions(t, currency);
  opts.plugins.tooltip.filter = (item) => item.raw != null && !(item.dataset.label.includes("forecast") && item.dataIndex === rows.length - 1);
  return (
    <>
      <Legend
        items={[
          { label: "Revenue", color: t.series[0], type: "line" },
          { label: "Expenses", color: t.series[1], type: "line" },
          ...(forecast.length ? [{ label: "Forecast", color: t.muted, type: "dash" }] : []),
        ]}
      />
      <div className={`chart-box ${height}`}>
        <Line key={t.key} data={data} options={opts} aria-label="Revenue and expenses by month" role="img" />
      </div>
    </>
  );
}

// Monthly net profit; bars below zero switch to the negative pole.
export function ProfitBars({ rows, currency, height = "" }) {
  const t = useTokens();
  const data = {
    labels: rows.map((r) => monthLabel(r.month)),
    datasets: [
      {
        label: "Net profit",
        data: rows.map((r) => r.profit),
        backgroundColor: rows.map((r) => (r.profit >= 0 ? t.pos : t.neg)),
        borderRadius: 4,
        borderSkipped: "start",
        maxBarThickness: 28,
      },
    ],
  };
  const opts = baseOptions(t, currency);
  opts.scales.y.beginAtZero = true;
  return (
    <div className={`chart-box ${height}`}>
      <Bar key={t.key} data={data} options={opts} aria-label="Net profit by month" role="img" />
    </div>
  );
}

// Stacked spend by category per month.
export function ExpenseStack({ rows, categories, currency, height = "" }) {
  const t = useTokens();
  const data = {
    labels: rows.map((r) => monthLabel(r.month)),
    datasets: categories.map((c, i) => ({
      label: c.label,
      data: rows.map((r) => r[c.key] || 0),
      backgroundColor: t.series[i],
      borderColor: t.surface,
      borderWidth: { top: 2 },
      borderSkipped: "start",
      borderRadius: i === categories.length - 1 ? { topLeft: 4, topRight: 4 } : 0,
      maxBarThickness: 32,
    })),
  };
  return (
    <>
      <Legend items={categories.map((c, i) => ({ label: c.label, color: t.series[i] }))} />
      <div className={`chart-box ${height}`}>
        <Bar key={t.key} data={data} options={baseOptions(t, currency, { stacked: true })} aria-label="Expenses by category by month" role="img" />
      </div>
    </>
  );
}

// One series, horizontal — for ranked breakdowns.
export function HBar({ items, label = "Amount", currency, slot = 0, height = "short", format }) {
  const t = useTokens();
  const data = {
    labels: items.map((i) => i.label),
    datasets: [{ label, data: items.map((i) => i.value), backgroundColor: t.series[slot], borderRadius: 4, borderSkipped: "start", maxBarThickness: 22 }],
  };
  const opts = baseOptions(t, currency, { horizontal: true });
  if (format) {
    opts.scales.x.ticks.callback = format;
    opts.plugins.tooltip.callbacks.label = (ctx) => ` ${label}: ${format(ctx.parsed.x)}`;
  }
  return (
    <div className={`chart-box ${height}`} style={{ height: Math.max(140, items.length * 38 + 40) }}>
      <Bar key={t.key} data={data} options={opts} aria-label={label} role="img" />
    </div>
  );
}

// Multi-series line for projections.
export function MultiLine({ labels, series, currency, height = "", dashedIndex = [] }) {
  const t = useTokens();
  const data = {
    labels,
    datasets: series.map((s, i) => ({
      label: s.label,
      data: s.data,
      borderColor: t.series[s.slot ?? i],
      backgroundColor: t.series[s.slot ?? i],
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBorderColor: t.surface,
      pointHoverBorderWidth: 2,
      tension: 0.25,
      cubicInterpolationMode: "monotone",
      borderDash: dashedIndex.includes(i) ? [5, 4] : undefined,
    })),
  };
  return (
    <>
      <Legend items={series.map((s, i) => ({ label: s.label, color: t.series[s.slot ?? i], type: dashedIndex.includes(i) ? "dash" : "line" }))} />
      <div className={`chart-box ${height}`}>
        <Line key={t.key} data={data} options={baseOptions(t, currency)} role="img" aria-label={series.map((s) => s.label).join(", ")} />
      </div>
    </>
  );
}

export function HealthRing({ score, level }) {
  const r = 56, c = 2 * Math.PI * r;
  const color = level === "good" ? "var(--good)" : level === "warning" ? "var(--warning)" : "var(--critical)";
  return (
    <div className="health-ring">
      <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">
        <circle cx="66" cy="66" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="11" />
        <circle cx="66" cy="66" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: "stroke-dashoffset .8s ease" }} />
      </svg>
      <div className="v">
        <div>
          <b>{score}</b>
          <small>of 100</small>
        </div>
      </div>
    </div>
  );
}
