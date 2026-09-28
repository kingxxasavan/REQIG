import { Component } from "react";

// If anything below fails while rendering, show a way out instead of an
// empty page. `quiet` boundaries (decorations like the 3D hero) just
// render nothing.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("EPRI render error:", error, info?.componentStack);
  }

  reset = () => {
    try {
      sessionStorage.removeItem("epri.tourMode");
      sessionStorage.removeItem("epri.tourStep");
      localStorage.removeItem("epri.tour.workspace");
      localStorage.removeItem("epri.tour.vault");
    } catch {
      /* ignore */
    }
    window.location.hash = "#/";
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.quiet) return this.props.fallback || null;
    return (
      <div className="crash">
        <div className="crash-card glass hairline">
          <h1>Something went wrong on this page.</h1>
          <p>Your saved data is safe. Reloading usually fixes it. If it keeps happening, go back to the home page (this also ends a guided tour).</p>
          <div className="row wrap" style={{ gap: 10, marginTop: 20 }}>
            <button className="btn primary" onClick={() => window.location.reload()}>Reload</button>
            <button className="btn" onClick={this.reset}>Back to home</button>
          </div>
          <details style={{ marginTop: 18 }}>
            <summary className="xs muted" style={{ cursor: "pointer" }}>Technical details</summary>
            <pre className="xs muted" style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{String(this.state.error?.message || this.state.error)}</pre>
          </details>
        </div>
      </div>
    );
  }
}
