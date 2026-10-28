// Light or dark. Follows the system until a visitor picks one, then remembers it on every page.
// Loaded in <head> so the choice applies before the page paints.
(() => {
  const root = document.documentElement;
  const media = matchMedia("(prefers-color-scheme: dark)");
  const COLORS = { light: "#f1ecf7", dark: "#251e37" };

  const stored = () => {
    try { return localStorage.getItem("theme"); } catch { return null; }
  };
  const dark = () => (root.dataset.theme ? root.dataset.theme === "dark" : media.matches);

  function apply(choice) {
    if (choice === "light" || choice === "dark") root.dataset.theme = choice;
    else delete root.dataset.theme;
    // The browser chrome color follows the page, not just the system.
    for (const m of document.querySelectorAll('meta[name="theme-color"]')) {
      m.dataset.media ??= m.media;
      if (root.dataset.theme) {
        m.media = "all";
        m.content = COLORS[root.dataset.theme];
      } else {
        m.media = m.dataset.media;
        m.content = m.dataset.media.includes("dark") ? COLORS.dark : COLORS.light;
      }
    }
    dispatchEvent(new Event("themechange"));
  }

  // Picking what the system already shows means "follow the system" again.
  function choose(choice) {
    const keep = choice === (media.matches ? "dark" : "light") ? null : choice;
    try {
      if (keep) localStorage.setItem("theme", keep);
      else localStorage.removeItem("theme");
    } catch {}
    apply(keep);
  }

  apply(stored());
  // Another tab, or the page around an embedded frame, changed it.
  addEventListener("storage", (e) => { if (e.key === "theme") apply(e.newValue); });
  media.addEventListener("change", () => apply(stored()));
  window.siteTheme = { dark, choose };

  function mount() {
    const nav = document.querySelector(".masthead nav");
    if (!nav) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "theme-toggle";
    b.setAttribute("aria-label", "Dark mode");
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>';
    const sync = () => b.setAttribute("aria-pressed", String(dark()));
    sync();
    b.addEventListener("click", () => choose(dark() ? "light" : "dark"));
    addEventListener("themechange", sync);
    nav.append(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
