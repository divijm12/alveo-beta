/* Google Analytics 4 for getalveo.app + beta.getalveo.app (owner, 2026-11-10).
   Nothing from Google loads, and no cookies are set, until the visitor clicks Accept (consent mode v2 defaults
   all denied). The choice is remembered in localStorage; the footer "Cookies" link asks again.
   Privacy: page_location is origin + path only (beta invite codes travel in the #hash), page_title is fixed text
   (the beta page puts tester names in the title), never on /admin/. Events carry no names, emails or codes.
   The same file is in alveo-site and alveo-beta: keep them identical. */
(() => {
  const ID = "";                                   // GA4 Measurement ID, e.g. "G-XXXXXXXXXX" (public, not a secret)
  const KEY = "alveo_analytics";                   // "yes" | "no"
  if (!ID || location.pathname.startsWith("/admin")) { window.alveoTrack = () => {}; window.alveoCookies = () => {}; return; }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });

  const get = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch {} };
  let loaded = false;
  function load() {
    if (loaded) return; loaded = true;
    gtag("consent", "update", { analytics_storage: "granted" });
    const s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", ID, { page_location: location.origin + location.pathname,
                         page_title: document.documentElement.dataset.gaTitle || document.title });
  }
  function forget() {                               // declined after accepting: remove GA's cookies
    gtag("consent", "update", { analytics_storage: "denied" });
    document.cookie.split(";").map(c => c.trim().split("=")[0]).filter(n => n === "_ga" || n.startsWith("_ga_"))
      .forEach(n => { for (const d of ["", "; domain=." + location.hostname.split(".").slice(-2).join(".")])
        document.cookie = `${n}=; Max-Age=0; path=/${d}`; });
  }
  window.alveoTrack = (name, params = {}) => { if (get() === "yes") gtag("event", name, params); };

  const css = `.alveo-cookies{position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);
    z-index:50;width:min(calc(100% - 32px),34rem);display:flex;gap:14px;align-items:center;flex-wrap:wrap;
    padding:12px 14px 12px 18px;border-radius:18px;background:#141416;border:1px solid #26262a;color:#a1a1aa;
    font:14px/1.45 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.45);
    -webkit-user-select:none;user-select:none}
    .alveo-cookies p{margin:0;flex:1 1 15rem;color:#a1a1aa;font-size:14px;text-align:left;opacity:1;animation:none}
    .alveo-cookies .b{display:flex;gap:8px;margin-left:auto}
    .alveo-cookies button{height:34px;padding:0 14px;border-radius:999px;border:0;font:inherit;font-weight:600;cursor:pointer}
    .alveo-cookies .ok{background:#e0112b;color:#fff}.alveo-cookies .ok:hover{background:#ff2d2d}
    .alveo-cookies .no{background:rgba(255,255,255,.08);color:#f4f4f5}.alveo-cookies .no:hover{background:rgba(255,255,255,.14)}
    .alveo-cookies button:focus-visible{outline:2px solid #ff2d2d;outline-offset:2px}`;
  function banner() {
    if (document.querySelector(".alveo-cookies")) return;
    if (!document.getElementById("alveo-cookies-css")) {
      const st = document.createElement("style"); st.id = "alveo-cookies-css"; st.textContent = css; document.head.appendChild(st);
    }
    const el = document.createElement("div");
    el.className = "alveo-cookies"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Cookies");
    el.innerHTML = `<p>We'd like to use Google Analytics cookies to see how people find Alveo. Nothing loads unless you say yes.</p>
      <div class="b"><button class="no" type="button">No thanks</button><button class="ok" type="button">Accept</button></div>`;
    el.querySelector(".ok").onclick = () => { set("yes"); el.remove(); load(); };
    el.querySelector(".no").onclick = () => { set("no"); el.remove(); forget(); };
    document.body.appendChild(el);
  }
  window.alveoCookies = banner;                     // footer "Cookies" link

  const start = () => { const c = get(); if (c === "yes") load(); else if (c !== "no") banner(); };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();
})();
