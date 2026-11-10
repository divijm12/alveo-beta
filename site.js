/* Google Analytics 4 for getalveo.app + beta.getalveo.app (owner, 2026-11-10).
   Nothing from Google loads, and no cookies are set, until the visitor clicks Accept (consent mode v2 defaults
   all denied). The choice is remembered in localStorage; the footer "Cookies" link asks again.
   Privacy: page_location is origin + path only (beta invite codes travel in the #hash), page_title is fixed text
   (the beta page puts tester names in the title), never on /admin/. Events carry no names, emails or codes.
   The same file is in alveo-site and alveo-beta: keep them identical. After ANY change, bump ?v= on the
   <script src="site.js?v=..."> tag in index.html (browsers cache this file ~10 min). */
(() => {
  const ID = "G-X8DBJDHBE8";                                 // GA4 Measurement ID, e.g. "G-XXXXXXXXXX" (public, not a secret)
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

  const css = `
  .alveo-cc{position:fixed;z-index:1000;left:max(20px,env(safe-area-inset-left));bottom:max(20px,env(safe-area-inset-bottom));
    width:min(380px,calc(100vw - 40px));box-sizing:border-box;padding:20px;border-radius:16px;background:#121214;
    border:1px solid #2a2a2f;box-shadow:0 1px 0 rgba(255,255,255,.04) inset,0 18px 48px rgba(0,0,0,.55);color:#a1a1aa;
    font:13.5px/1.5 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;text-align:left;
    -webkit-user-select:none;user-select:none;opacity:0;transform:translateY(12px);
    transition:opacity .35s cubic-bezier(.2,.7,.2,1),transform .35s cubic-bezier(.2,.7,.2,1)}
  .alveo-cc.in{opacity:1;transform:none}
  .alveo-cc [hidden]{display:none!important}
  .alveo-cc h2{all:unset;display:block;color:#f4f4f5;font-weight:600;font-size:14.5px;margin-bottom:6px}
  .alveo-cc p{all:unset;display:block;color:#a1a1aa;font-size:13.5px;line-height:1.5}
  .alveo-cc .row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}
  .alveo-cc button{all:unset;box-sizing:border-box;height:38px;border-radius:10px;text-align:center;font-weight:600;font-size:13.5px;
    cursor:pointer;color:#f4f4f5;background:#232327;border:1px solid #2f2f35;transition:background .15s,border-color .15s}
  .alveo-cc button:hover{background:#2c2c31;border-color:#3a3a41}
  .alveo-cc button.primary{background:#e0112b;border-color:#e0112b;color:#fff}.alveo-cc button.primary:hover{background:#f01a33}
  .alveo-cc button:focus-visible,.alveo-cc .link:focus-visible{outline:2px solid #ff2d2d;outline-offset:2px}
  .alveo-cc .link{all:unset;display:inline-block;margin-top:12px;color:#a1a1aa;font-size:12.5px;cursor:pointer;
    text-decoration:underline;text-underline-offset:3px;text-decoration-color:#4a4a52}
  .alveo-cc .link:hover{color:#f4f4f5}
  .alveo-cc .prefs{display:none;margin-top:14px;border-top:1px solid #26262a}
  .alveo-cc.open .prefs{display:block}.alveo-cc.open .link.more{display:none}
  .alveo-cc .opt{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #26262a}
  .alveo-cc .opt div{flex:1}.alveo-cc .opt b{display:block;color:#f4f4f5;font-weight:600;font-size:13px}
  .alveo-cc .opt span{display:block;font-size:12.5px;color:#8e8e98;margin-top:2px}
  .alveo-cc .tag{flex:none;font-size:11.5px;color:#8e8e98;padding-top:2px}
  .alveo-cc .sw{all:unset;flex:none;position:relative;width:36px;height:22px;border-radius:99px;background:#3a3a41;cursor:pointer;
    transition:background .2s}
  .alveo-cc .sw::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;
    transition:transform .2s cubic-bezier(.2,.7,.2,1)}
  .alveo-cc .sw[aria-checked="true"]{background:#e0112b}.alveo-cc .sw[aria-checked="true"]::after{transform:translateX(14px)}
  .alveo-cc .sw:focus-visible{outline:2px solid #ff2d2d;outline-offset:2px}
  @media (max-width:520px){.alveo-cc{left:0;right:0;bottom:0;width:100%;border-radius:16px 16px 0 0;border-bottom:0;
    padding:18px max(18px,env(safe-area-inset-left)) max(18px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-right))}}
  @media (prefers-reduced-motion:reduce){.alveo-cc,.alveo-cc .sw,.alveo-cc .sw::after{transition:none}}`;
  function banner() {
    if (document.querySelector(".alveo-cc")) return;
    if (!document.getElementById("alveo-cc-css")) {
      const st = document.createElement("style"); st.id = "alveo-cc-css"; st.textContent = css; document.head.appendChild(st);
    }
    const el = document.createElement("section");
    el.className = "alveo-cc"; el.setAttribute("role", "dialog"); el.setAttribute("aria-labelledby", "alveo-cc-t");
    el.innerHTML = `<h2 id="alveo-cc-t">Cookies</h2>
      <p>We use analytics cookies to understand how people find Alveo. They're off unless you allow them.</p>
      <div class="prefs" id="alveo-cc-prefs">
        <div class="opt"><div><b>Essential</b><span>Remembers this choice. Stored only in your browser.</span></div><span class="tag">Always on</span></div>
        <div class="opt"><div><b>Analytics</b><span>Google Analytics: pages visited and how you got here. No ads.</span></div>
          <button class="sw" role="switch" aria-checked="${get() === "yes"}" aria-label="Analytics cookies"></button></div>
      </div>
      <div class="row"><button type="button" data-a="reject">Reject all</button><button type="button" class="primary" data-a="accept">Accept all</button></div>
      <button type="button" class="link more" aria-controls="alveo-cc-prefs">Manage preferences</button>
      <button type="button" class="link save" hidden>Save preferences</button>`;
    const sw = el.querySelector(".sw"), save = el.querySelector(".save");
    const close = () => { el.classList.remove("in"); setTimeout(() => el.remove(), 300); };
    const choose = yes => { set(yes ? "yes" : "no"); yes ? load() : forget(); close(); };
    el.querySelector('[data-a="accept"]').onclick = () => choose(true);
    el.querySelector('[data-a="reject"]').onclick = () => choose(false);
    el.querySelector(".more").onclick = () => { el.classList.add("open"); save.hidden = false; sw.focus(); };
    sw.onclick = () => sw.setAttribute("aria-checked", sw.getAttribute("aria-checked") !== "true");
    save.onclick = () => choose(sw.getAttribute("aria-checked") === "true");
    el.addEventListener("pointerdown", e => e.stopPropagation());      // main site: don't start the "hold to breathe"
    document.body.appendChild(el);
    el.getBoundingClientRect(); setTimeout(() => el.classList.add("in"), 20);   // start the slide-up after first layout
  }
  window.alveoCookies = banner;                     // footer "Cookies" link

  const start = () => { const c = get(); if (c === "yes") load(); else if (c !== "no") banner(); };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();
})();
