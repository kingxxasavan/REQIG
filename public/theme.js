// Runs before the page paints so the chosen theme is there from the first
// frame (no flash, no blank dark screen while the app downloads).
try {
  document.documentElement.setAttribute("data-theme", localStorage.getItem("epri.theme") === "light" ? "light" : "dark");
} catch (e) {
  document.documentElement.setAttribute("data-theme", "dark");
}
