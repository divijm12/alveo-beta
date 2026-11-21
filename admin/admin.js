// Frame-buster (GitHub Pages can't send X-Frame-Options / frame-ancestors): the page stays hidden (admin.css)
// unless it is the top window; if framed, try to break out, and never show the panel inside a frame.
if (window.top !== window.self) { try { window.top.location = window.self.location.href; } catch {} throw new Error("framed"); }
document.documentElement.classList.add("top-ok");
(async () => {
  const C = window.ALVEO_BETA, $ = id => document.getElementById(id);
  const sb = supabase.createClient(C.supabaseUrl, C.publishableKey);
  const say = (el, text, cls) => { $(el).textContent = text; $(el).className = "msg " + (cls || ""); };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const day = t => t ? new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
  const linkFor = code => `https://beta.getalveo.app/#${code}`;
  async function signOut() { await sb.auth.signOut(); location.reload(); }
  $("out1").onclick = signOut; $("out2").onclick = signOut;

  $("signIn").onclick = async () => {
    const email = $("adminEmail").value.trim().toLowerCase(), password = $("adminPw").value;
    if (!email || !password) return say("signinMsg", "Enter your email and password.", "err");
    $("signIn").disabled = true; say("signinMsg", "Signing in…");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    $("signIn").disabled = false;
    if (error) return say("signinMsg", "Wrong email or password.", "err");
    location.reload();
  };
  $("adminPw").addEventListener("keydown", e => e.key === "Enter" && $("signIn").click());

  const { data: { session } } = await sb.auth.getSession();
  if (!session) return;                                   // stay on the sign-in card
  $("signin").hidden = true; $("who").textContent = session.user.email;
  const { data: me } = await sb.from("beta_admins").select("email");   // RLS: only admins see rows
  if (!me || !me.length) { $("notAdmin").hidden = false; return; }
  // Clip viewing is a separate permission (owner only); the server enforces it too, this just hides the buttons.
  const { data: mine } = await sb.from("beta_admins").select("can_view_clips").eq("email", session.user.email.toLowerCase()).maybeSingle();
  const canViewClips = mine?.can_view_clips === true;
  $("panel").hidden = false;

  async function fn(name, body) {
    const { data: { session: s } } = await sb.auth.getSession();
    try {
      const r = await fetch(`${C.functions}/${name}`, { method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${s.access_token}` }, body: JSON.stringify(body) });
      return await r.json();
    } catch { return { ok: false, error: "Couldn't reach the server." }; }
  }
  async function loadRequests() {
    const { data: rq } = await sb.from("beta_requests").select("*").eq("status", "pending").order("created_at", { ascending: true });
    $("rqCount").textContent = rq && rq.length ? `${rq.length} waiting` : "";
    $("reqRows").innerHTML = (rq || []).map(r => `<tr><td><b>${esc(r.name)}</b><br><span class="sub">${esc(r.email)}</span></td>
      <td><span class="sub">${esc(r.note) || "-"}</span></td><td>${day(r.created_at)}</td>
      <td><div class="row"><button class="small" data-rq="approve" data-id="${r.id}">Approve &amp; email</button>
      <button class="ghost small" data-rq="decline" data-id="${r.id}">Decline</button></div></td></tr>`).join("")
      || '<tr><td colspan="4" class="sub">No requests waiting.</td></tr>';
  }
  $("reqRows").addEventListener("click", async e => {
    const b = e.target.closest("button[data-rq]"); if (!b) return;
    if (b.dataset.rq === "decline" && b.textContent !== "Sure?") { b.textContent = "Sure?"; return; }
    b.disabled = true;
    const r = await fn("beta-admin-invite", { action: b.dataset.rq, request_id: b.dataset.id });
    if (!r.ok) { b.disabled = false; b.textContent = r.error || "Failed"; return; }
    loadRequests(); load();
  });

  async function openClips(inviteId, name) {
    $("viewer").hidden = false; $("viewerTitle").textContent = `Clips: ${name}`;
    $("clipList").textContent = "Loading…"; $("clipStage").textContent = "";
    $("viewer").scrollIntoView({ behavior: "smooth", block: "start" });
    const r = await fn("beta-admin-clips", { invite_id: inviteId });
    if (!r.ok) { $("clipList").textContent = r.error || "Couldn't load clips."; return; }
    const label = { yes: "Yes", no: "No", missed_yes: "Near miss: yes", missed_no: "Near miss: no" };
    const fixed = { vape: "Vape", not_vape: "Not a vape", exclude: "Excluded" };
    const item = c => `${new Date(c.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · ${label[c.answer] || c.answer}${c.label_override ? ` → ${fixed[c.label_override]} (fixed)` : ""}`;
    let cur = -1;
    const paintList = () => { $("clipList").innerHTML = r.clips.map((c, k) => `<button class="${k === cur ? "small" : "ghost small"}" data-clip="${k}">${esc(item(c))}</button>`).join("") || "No clips yet."; };
    const paintBar = () => {
      const c = r.clips[cur]; $("relabel").hidden = $("relabelNote").hidden = !c;
      if (c) $("relabel").querySelectorAll("button[data-label]").forEach(b => b.className = (b.dataset.label === (c.label_override || "")) ? "small" : "ghost small");
    };
    $("relabel").onclick = async e => {
      const b = e.target.closest("button[data-label]"); const c = r.clips[cur]; if (!b || !c) return;
      $("relabelMsg").textContent = "Saving…";
      const res = await fn("beta-admin-clips", { action: "relabel", clip_id: c.id, label: b.dataset.label || null });
      if (!res.ok) { $("relabelMsg").textContent = res.error || "Couldn't save."; return; }
      c.label_override = res.label_override; $("relabelMsg").textContent = "Saved"; paintList(); paintBar();
    };
    paintList();
    const open = async k => {
      const c = r.clips[k]; cur = k; paintList(); paintBar(); $("relabelMsg").textContent = "";
      if (!c.url) { $("clipStage").textContent = "This clip's link couldn't be created."; return; }
      try { const buf = await (await fetch(c.url)).arrayBuffer(); await AlveoClipViewer.render($("clipStage"), buf); }
      catch (e) { $("clipStage").textContent = "Couldn't open this clip: " + e.message; }
    };
    $("clipList").onclick = e => { const b = e.target.closest("button[data-clip]"); if (b) open(+b.dataset.clip); };
    if (r.clips.length) open(0);
  }
  $("viewerClose").onclick = () => { AlveoClipViewer.stop(); $("viewer").hidden = true; $("clipStage").textContent = ""; $("relabel").hidden = $("relabelNote").hidden = true; };

  const ago = t => { if (!t) return ""; const m = Math.round((Date.now() - new Date(t)) / 60000);
    return m < 2 ? "just now" : m < 60 ? `${m} min ago` : m < 48 * 60 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`; };
  const vnum = v => String(v || "").split(".").map(n => parseInt(n, 10) || 0);
  const vcmp = (a, b) => { const x = vnum(a), y = vnum(b); for (let k = 0; k < Math.max(x.length, y.length); k++) { const d = (x[k] || 0) - (y[k] || 0); if (d) return d; } return 0; };
  // rels: one beta_release row per platform (no platform column = before the platforms migration = the Mac).
  // A tester is compared with THEIR platform's latest build; not reported yet = compared with the Mac.
  const PLAT = { mac: "Mac", win: "Windows" };
  function versions(inv, rels) {
    const relOf = p => (rels || []).find(r => (r.platform || "mac") === p);
    // Mac only (Windows discontinued 2026-11-18); tester pills keep their platform for history.
    const shown = ["mac"].map(p => relOf(p)).filter(r => r?.short_version);
    const checked = shown.map(r => r.updated_at).filter(Boolean).sort().pop();     // newest refresh of these rows
    $("latest").textContent = shown.map(r => `${PLAT[r.platform || "mac"]} ${r.short_version} (build ${r.build})`)
      .join(" · ").replace(/^(?=.)/, "Latest beta: ") + (shown.length && checked ? ` · checked ${ago(checked)}` : "");
    const active = inv.filter(i => i.activated_at && !i.revoked)
      .sort((a, b) => new Date(b.app_seen_at || b.last_seen_at || 0) - new Date(a.app_seen_at || a.last_seen_at || 0));
    $("verRows").innerHTML = active.map(i => {
      const v = i.app_version, seen = i.app_seen_at || i.last_seen_at, rel = relOf(i.app_platform || "mac");
      const stale = seen && Date.now() - new Date(seen) > 48 * 3600e3;
      const behind = v && rel?.short_version && (vcmp(v, rel.short_version) < 0
        || (vcmp(v, rel.short_version) === 0 && i.app_build && rel.build && +i.app_build < +rel.build));
      const pill = !v ? '<span class="pill">Not reported yet</span>'
        : behind ? '<span class="pill red">Behind</span>' : rel?.short_version ? '<span class="pill ok">Up to date</span>' : "";
      const plat = PLAT[i.app_platform] ? `<span class="pill">${PLAT[i.app_platform]}</span> ` : "";
      return `<tr><td><b>${esc(i.name) || "-"}</b><br><span class="sub">${esc(i.email)}</span></td>
        <td>${plat}${v ? `<b>${esc(v)}</b>${i.app_build ? ` <span class="sub">build ${esc(i.app_build)}</span>` : ""}<br>` : ""}${pill}</td>
        <td>${seen ? esc(ago(seen)) : "-"}${stale ? '<br><span class="sub">app not running lately</span>' : ""}</td></tr>`;
    }).join("") || '<tr><td colspan="3" class="sub">No active testers yet.</td></tr>';
  }

  // "Latest beta" comes from beta_release, which beta-appcast only updates when a tester's app checks (hourly). Ask the
  // server to refresh it from the GitHub releases first (owner, 2026-11-16), at most once a minute; errors -> old rows.
  let releasesAt = 0;
  async function refreshReleases() {
    if (Date.now() - releasesAt < 60e3) return;
    releasesAt = Date.now();
    try { await fn("beta-admin-invite", { action: "refresh_releases" }); } catch { /* keep the stored rows */ }
  }

  async function load() {
    const { data: inv, error } = await sb.from("beta_invites").select("*").order("created_at", { ascending: false });
    if (!error) { await refreshReleases(); const { data: rels } = await sb.from("beta_release").select("*"); versions(inv, rels); }
    if (error) { $("rows").innerHTML = `<tr><td colspan="5">Couldn't load invites: ${esc(error.message)}</td></tr>`; return; }
    const { data: clips } = await sb.from("beta_clips").select("invite_id");
    const n = {}; (clips || []).forEach(c => n[c.invite_id] = (n[c.invite_id] || 0) + 1);
    $("rows").innerHTML = inv.map(i => {
      const expired = !i.downloaded_at && new Date(i.expires_at) < new Date();
      const status = i.revoked ? '<span class="pill red">Revoked</span>'
        : i.activated_at ? `<span class="pill ok">Active</span> <span class="sub">since ${day(i.activated_at)}</span>`
        : i.downloaded_at ? `<span class="pill">Downloaded</span> <span class="sub">${day(i.downloaded_at)}</span>`
        : expired ? '<span class="pill">Expired</span>' : '<span class="pill">Not downloaded yet</span>';
      const consent = i.activated_at && !i.consent_at ? ' <span class="sub">(sharing off)</span>' : "";
      const mailed = i.emailed_at ? `<br><span class="sub">emailed ${day(i.emailed_at)}</span>` : "";
      return `<tr><td><b>${esc(i.name) || "-"}</b><br><span class="sub">${esc(i.email)}</span><br><span class="sub">${esc(i.code)}</span></td>
        <td>${status}${mailed}</td><td>${n[i.id] || 0}${consent}</td><td>${day(i.created_at)}<br><span class="sub">by ${esc(i.created_by.split("@")[0])}</span></td>
        <td><div class="row"><button class="ghost small" data-copy="${esc(i.code)}">Copy link</button>
        ${!i.revoked && !i.downloaded_at ? `<button class="ghost small" data-act="email" data-id="${i.id}">${i.emailed_at ? "Resend email" : "Email it"}</button>` : ""}
        <button class="ghost small" data-act="${i.revoked ? "unrevoke" : "revoke"}" data-id="${i.id}">${i.revoked ? "Restore" : "Revoke"}</button>
        ${n[i.id] && canViewClips ? `<button class="small" data-act="clips" data-id="${i.id}" data-name="${esc(i.name || i.email)}">View clips</button>` : ""}
        ${i.downloaded_at ? `<button class="ghost small" data-act="reset" data-id="${i.id}" title="Allow one more download and a new computer">Reset</button>` : ""}</div></td></tr>`;
    }).join("") || '<tr><td colspan="5" class="sub">No invites yet. Create the first one above.</td></tr>';
  }
  $("rows").addEventListener("click", async e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.copy) { try { await navigator.clipboard.writeText(linkFor(b.dataset.copy)); b.textContent = "Copied"; } catch {} return; }
    const id = b.dataset.id, act = b.dataset.act;
    if (act === "clips") { openClips(id, b.dataset.name); return; }
    if (act === "email") { b.disabled = true; const r = await fn("beta-admin-invite", { action: "send", invite_id: id }); b.textContent = r.ok ? "Sent" : (r.error || "Failed"); load(); return; }
    if (act === "reset" && b.textContent !== "Sure?") { b.textContent = "Sure?"; return; }       // two-click confirm (no dialogs)
    const patch = act === "revoke" ? { revoked: true } : act === "unrevoke" ? { revoked: false }
      : { downloaded_at: null, device_hash: null, activated_at: null };
    await sb.from("beta_invites").update(patch).eq("id", id); load();
  });
  $("refresh").onclick = load;

  let lastMsg = "";
  $("create").onclick = async () => {
    const name = $("invName").value.trim(), email = $("invEmail").value.trim().toLowerCase();
    if (!email || !$("invEmail").checkValidity()) return say("createMsg", "Enter their email address.", "err");
    $("create").disabled = true;
    const { data, error } = await sb.from("beta_invites").insert({ name: name || null, email }).select("code").single();
    $("create").disabled = false;
    if (error) return say("createMsg", "Couldn't create the invite: " + error.message, "err");
    const link = linkFor(data.code);
    let note = "Invite created.";
    if ($("autoEmail").checked) {
      const { data: row } = await sb.from("beta_invites").select("id").eq("code", data.code).single();
      const r = await fn("beta-admin-invite", { action: "send", invite_id: row.id });
      note = r.ok ? `Invite created and emailed to ${email}.` : `Invite created, but the email failed: ${r.error || "unknown error"}. Copy the link below instead.`;
    }
    say("createMsg", note, note.includes("failed") ? "err" : "ok");
    $("newLink").textContent = link; $("newInvite").hidden = false;
    lastMsg = `Hey${name ? " " + name : ""}! Here's your personal invite to the Alveo beta: ${link}\nIt's only for you: you'll confirm with your email (${email}), it downloads once, and it works on one Mac. As we discussed, the beta shares the short clips from alerts you answer to help train Alveo.`;
    $("invName").value = ""; $("invEmail").value = ""; load();
  };
  $("copyLink").onclick = async () => { try { await navigator.clipboard.writeText($("newLink").textContent); $("copyLink").textContent = "Copied"; } catch {} };
  $("copyMsg").onclick = async () => { try { await navigator.clipboard.writeText(lastMsg); $("copyMsg").textContent = "Copied"; } catch {} };
  load(); loadRequests();
})();
