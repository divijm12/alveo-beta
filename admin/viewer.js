// Alveo beta admin: clip viewer. Unzips a shared clip (from a 10-minute signed link) in memory and shows it:
// a player with play/pause/step and a grid of every frame, each with the detector's box (red) and the lip points.
// Nothing is stored; object URLs are revoked when the viewer closes. Needs JSZip (loaded by the admin page).
(() => {
  let timer = null, urls = [];
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  function draw(ctx, img, row, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const sx = w / img.naturalWidth, sy = h / img.naturalHeight;
    if (row.det) {
      const [x0, y0, x1, y1] = row.det;
      ctx.strokeStyle = "#ff2d2d"; ctx.lineWidth = Math.max(1.5, w / 160);
      ctx.strokeRect(x0 * sx, y0 * sy, (x1 - x0) * sx, (y1 - y0) * sy);
    }
    ctx.fillStyle = "#30d158";
    for (const [x, y] of row.lips || []) { ctx.beginPath(); ctx.arc(x * sx, y * sy, Math.max(1.2, w / 220), 0, 6.283); ctx.fill(); }
  }
  async function render(container, buffer) {
    stop();
    container.textContent = "Opening clip…";
    const zip = await JSZip.loadAsync(buffer);
    const meta = JSON.parse(await zip.file("meta.json").async("string"));
    const rows = (await zip.file("index.jsonl").async("string")).trim().split("\n").filter(Boolean).map(l => JSON.parse(l));
    const imgs = await Promise.all(rows.map(async r => {
      const u = URL.createObjectURL(await zip.file(r.file).async("blob")); urls.push(u);
      const im = new Image(); im.src = u; await im.decode(); return im;
    }));
    container.textContent = "";
    const head = el("div", "row");
    head.style.justifyContent = "space-between";
    const label = { yes: "Yes, vaped", no: "Not a vape", missed_yes: "Near miss: yes", missed_no: "Near miss: no" }[meta.answer] || meta.answer;
    head.append(el("span", "pill " + (meta.answer.endsWith("yes") ? "ok" : "red"), label),
                el("span", "fine", `${rows.length} frames · ${(rows.at(-1)?.t ?? 0).toFixed(1)} s · ${meta.at || ""}`));
    const W = Math.min(480, container.clientWidth || 480), H = Math.round(W * imgs[0].naturalHeight / imgs[0].naturalWidth);
    const big = el("canvas"); big.width = W; big.height = H; big.style.cssText = "width:100%;max-width:480px;border-radius:12px;background:#000";
    const ctrl = el("div", "row"), play = el("button", "small", "Play"), prev = el("button", "ghost small", "‹"), next = el("button", "ghost small", "›");
    const pos = el("span", "fine");
    ctrl.append(prev, play, next, pos);
    const grid = el("div"); grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:6px";
    let i = 0;
    const show = k => { i = (k + rows.length) % rows.length; draw(big.getContext("2d"), imgs[i], rows[i], W, H);
      pos.textContent = `frame ${i + 1}/${rows.length} · t=${rows[i].t.toFixed(2)} s${rows[i].det ? " · vape box" : ""}`;
      grid.querySelectorAll("canvas").forEach((c, j) => c.style.outline = j === i ? "2px solid #ff2d2d" : "none"); };
    rows.forEach((r, k) => { const c = el("canvas"); const tw = 96, th = Math.round(tw * H / W); c.width = tw; c.height = th;
      c.style.cssText = "width:100%;border-radius:6px;cursor:pointer"; draw(c.getContext("2d"), imgs[k], r, tw, th);
      c.onclick = () => { pause(); show(k); }; grid.append(c); });
    const pause = () => { clearTimeout(timer); timer = null; play.textContent = "Play"; };
    const tick = () => { const dt = Math.max(60, ((rows[(i + 1) % rows.length].t - rows[i].t) || .2) * 1000); show(i + 1);
      timer = setTimeout(tick, i === rows.length - 1 ? 900 : dt); };
    play.onclick = () => timer ? pause() : (play.textContent = "Pause", tick());
    prev.onclick = () => { pause(); show(i - 1); }; next.onclick = () => { pause(); show(i + 1); };
    container.append(head, big, ctrl, el("p", "fine", "Red box: where the detector saw the vape. Green dots: lip points."), grid);
    show(0);
    return { meta, frames: rows.length };
  }
  function stop() { clearTimeout(timer); timer = null; urls.forEach(u => URL.revokeObjectURL(u)); urls = []; }
  window.AlveoClipViewer = { render, stop };
})();
