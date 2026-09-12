/* ==========================================================================
   CORAVIDA — admin core.
   The website's content lives in content/site.json on GitHub; the books live
   in a private repository of their own. Both are read and written through the
   GitHub Contents API with a fine-grained token the operator pastes once. A
   GitHub Action rebuilds the pages after every content commit, so an edit is
   live about two minutes after Publish. No framework, no build step.
   ========================================================================== */
window.Admin = (function () {
  "use strict";

  var DEFAULTS = { owner: "muaaadh", repo: "coravida", branch: "main", path: "content/site.json",
                   booksRepo: "coravida-books", booksPath: "books.json", api: "https://api.github.com" };
  var KEY = { settings: "cv:admin:settings", token: "cv:admin:token", remember: "cv:admin:remember", draft: "cv:admin:draft", uploads: "cv:admin:uploads" };

  /* ---------------------------------------------------------------- dom */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function E(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "class") el.className = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (k === "value") el.value = v;
      else if (k === "checked" || k === "disabled" || k === "hidden" || k === "selected" || k === "readOnly") el[k] = !!v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    (kids || []).forEach(function (c) { if (c == null || c === false) return; el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var slug = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60); };
  var uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  var ICON = {
    home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>',
    brand: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>',
    film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4"/>',
    route: '<path d="M4 19c4 0 4-14 8-14s4 14 8 14"/><circle cx="4" cy="19" r="1.5"/><circle cx="20" cy="19" r="1.5"/>',
    plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    boat: '<path d="M3 15h18l-2 4H5z"/><path d="M6 15V9l6-4 6 4v6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    faq: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5M12 17h.01"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    inv: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h6M9 16h6"/>',
    cash: '<rect x="3" y="7" width="18" height="11" rx="2"/><circle cx="12" cy="12.5" r="2.5"/>',
    card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
    up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>', chev: '<path d="m9 6 6 6-6 6"/>', print: '<path d="M6 9V3h12v6M6 18H4V9h16v9h-2"/><rect x="6" y="14" width="12" height="7"/>'
  };
  var svg = function (p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[p] || p) + "</svg>"; };
  var iconBtn = function (name, title, onclick, cls) { var b = E("button", { class: "btn btn--icon " + (cls || ""), type: "button", title: title, "aria-label": title, html: svg(name), onclick: onclick }); return b; };

  var toastT = null;
  function toast(msg, kind) {
    var t = $("#toast"); t.textContent = msg; t.className = "toast" + (kind ? " is-" + kind : ""); t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, kind === "err" ? 8000 : 3600);
  }
  function status(msg, kind) { var s = $("#status"); s.textContent = msg; s.className = "top__status" + (kind ? " is-" + kind : ""); s.title = msg; }
  function dialog(opts) {
    return new Promise(function (resolve) {
      var m = $("#modal"), body = $("#modal-body"), acts = $("#modal-acts"), card = $(".modal__card", m);
      card.classList.toggle("is-wide", !!opts.wide);
      $("#modal-title").textContent = opts.title || "";
      body.innerHTML = ""; acts.innerHTML = "";
      if (opts.node) body.appendChild(opts.node); else body.appendChild(E("p", { text: opts.text || "" }));
      function close(v) { m.hidden = true; document.body.style.overflow = ""; resolve(v); }
      (opts.actions || [["OK", "btn--go", "ok"]]).forEach(function (a) {
        acts.appendChild(E("button", { class: "btn " + (a[1] || ""), type: "button", text: a[0], onclick: function () {
          if (a[2] === "ok" && opts.validate && !opts.validate()) return;
          close(a[2]);
        } }));
      });
      m.hidden = false; document.body.style.overflow = "hidden";
      var first = $("input,select,textarea", body) || $("button", acts); if (first) setTimeout(function () { first.focus(); }, 30);
      m.onkeydown = function (e) { if (e.key === "Escape") close(null); };
      m.onclick = function (e) { if (e.target === m) close(null); };
    });
  }
  function confirm(title, text, okLabel, danger) {
    return dialog({ title: title, text: text, actions: [["Cancel", "btn--ghost", null], [okLabel || "Confirm", danger ? "btn--bad" : "btn--go", "ok"]] }).then(function (r) { return r === "ok"; });
  }

  /* ------------------------------------------------------------ storage */
  function settings() { try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY.settings) || "{}")); } catch (e) { return Object.assign({}, DEFAULTS); } }
  function saveSettings(s) { localStorage.setItem(KEY.settings, JSON.stringify(s)); }
  function token() { return sessionStorage.getItem(KEY.token) || localStorage.getItem(KEY.token) || ""; }
  function setToken(v, remember) {
    sessionStorage.removeItem(KEY.token); localStorage.removeItem(KEY.token);
    if (!v) return;
    (remember ? localStorage : sessionStorage).setItem(KEY.token, v);
    localStorage.setItem(KEY.remember, remember ? "1" : "");
  }
  function lsGet(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* full or blocked — keep working */ } }

  /* ------------------------------------------------------------ github */
  function b64encodeUtf8(str) {
    var bytes = new TextEncoder().encode(str), bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64decodeUtf8(b64) {
    var bin = atob(String(b64).replace(/\s+/g, "")), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function ghHeaders() { return { Authorization: "Bearer " + token(), Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" }; }
  function ghUrl(repo, path) {
    var s = settings();
    return s.api.replace(/\/$/, "") + "/repos/" + encodeURIComponent(s.owner) + "/" + encodeURIComponent(repo) + "/contents/" + path.split("/").map(encodeURIComponent).join("/");
  }
  function ghMessage(res, repo) {
    return res.json().catch(function () { return {}; }).then(function (j) {
      var detail = j && j.message ? " GitHub said: “" + j.message + "”." : "";
      switch (res.status) {
        case 401: return "GitHub rejected the token (401) — it is missing, mistyped or expired. Paste a fresh one in Settings." + detail;
        case 403: return "GitHub refused (403). The token needs Contents: read and write on " + settings().owner + "/" + repo + ", or a rate limit was hit." + detail;
        case 404: return "Not found (404) on " + settings().owner + "/" + repo + " — check the repository name in Settings, and that the token can see it." + detail;
        case 409: case 422: return "GitHub rejected the commit (" + res.status + ") — the file changed since it was loaded. Reload and try again." + detail;
        default: return "GitHub returned " + res.status + " " + res.statusText + "." + detail;
      }
    });
  }
  function ghRead(repo, path, branch) {
    if (!token()) return Promise.reject(new Error("No GitHub token. Add one in Settings."));
    return fetch(ghUrl(repo, path) + "?ref=" + encodeURIComponent(branch || settings().branch), { headers: ghHeaders(), cache: "no-store" })
      .then(function (res) {
        if (res.status === 404) return { sha: null, text: null, missing: true };
        if (!res.ok) return ghMessage(res, repo).then(function (m) { throw new Error(m); });
        return res.json().then(function (j) { return { sha: j.sha, text: b64decodeUtf8(j.content || ""), htmlUrl: j.html_url }; });
      });
  }
  function ghPut(repo, path, content64, message, sha, branch) {
    var body = { message: message, content: content64, branch: branch || settings().branch };
    if (sha) body.sha = sha;
    return fetch(ghUrl(repo, path), { method: "PUT", headers: ghHeaders(), body: JSON.stringify(body) })
      .then(function (res) { if (!res.ok) return ghMessage(res, repo).then(function (m) { var e = new Error(m); e.status = res.status; throw e; }); return res.json(); });
  }
  function ghPutText(repo, path, text, message, sha, branch) { return ghPut(repo, path, b64encodeUtf8(text), message, sha, branch); }
  function ghRuns() {
    var s = settings();
    return fetch(s.api + "/repos/" + s.owner + "/" + s.repo + "/actions/runs?per_page=1&branch=" + encodeURIComponent(s.branch), { headers: ghHeaders(), cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { return j && j.workflow_runs && j.workflow_runs[0] || null; }).catch(function () { return null; });
  }
  var actionsUrl = function () { return "https://github.com/" + settings().owner + "/" + settings().repo + "/actions"; };
  var siteUrl = function () { return new URL("../", location.href).href; };

  /* ------------------------------------------------------------ sections & routing */
  var SECTIONS = [];
  function register(sec) { SECTIONS.push(sec); }
  function route() { var h = (location.hash || "#overview").replace(/^#\/?/, "").split("/"); return { id: h[0] || "overview", arg: h.slice(1).join("/") || "" }; }
  function go(hash) { if (("#" + hash) === location.hash) render(); else location.hash = hash; }

  var GROUPS = ["Overview", "Website", "Books", "Settings"];
  function renderNav() {
    var r = route(), nav = $("#nav"), grp = null;
    nav.innerHTML = "";
    SECTIONS.slice().sort(function (a, b) { return GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group); }).forEach(function (s) {
      if (s.group !== grp) { grp = s.group; nav.appendChild(E("div", { class: "side__grp", text: grp })); }
      var a = E("a", { class: "side__lnk" + (r.id === s.id ? " on" : ""), href: "#" + s.id, html: svg(s.icon || "chev") + "<span>" + esc(s.label) + "</span>" });
      var b = s.badge && s.badge(); if (b) a.appendChild(E("span", { class: "bdg", text: b }));
      a.addEventListener("click", closeSide);
      nav.appendChild(a);
    });
  }
  function openSide() { $("#side").classList.add("open"); $("#scrim").hidden = false; $("#menuBtn").setAttribute("aria-expanded", "true"); }
  function closeSide() { $("#side").classList.remove("open"); $("#scrim").hidden = true; $("#menuBtn").setAttribute("aria-expanded", "false"); }

  function render() {
    var r = route(), s = SECTIONS.filter(function (x) { return x.id === r.id; })[0] || SECTIONS[0];
    if (!s) return;
    var host = $("#view"); host.innerHTML = "";
    $("#topH").textContent = s.label; document.title = s.label + " · Coravida Admin";
    try { s.render(host, r.arg); } catch (e) { console.error(e); host.appendChild(E("div", { class: "note note--bad", text: "This view failed to draw: " + e.message })); }
    renderNav();
    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------ content state */
  var C = { baseline: null, draft: null, sha: null, readonly: true, dirty: false, media: null, uploads: [] };
  var serialize = function (o) { return JSON.stringify(o, null, 2) + "\n"; };
  var canon = function (d) { return d ? serialize(d) : ""; };
  function setDirty(on) {
    C.dirty = !!on;
    $("#dirty").hidden = !C.dirty;
    $("#btn-discard").hidden = !C.dirty;
    $("#btn-publish").disabled = !C.dirty || C.readonly;
    if (C.dirty) lsSet(KEY.draft, { at: Date.now(), sha: C.sha, data: C.draft });
    renderNav();
  }
  function changed() { setDirty(canon(C.draft) !== canon(C.baseline) || C.uploads.length > 0); }
  function changedSections() {
    if (!C.draft || !C.baseline) return [];
    return Object.keys(C.draft).filter(function (k) { return JSON.stringify(C.draft[k]) !== JSON.stringify(C.baseline[k]); });
  }

  function loadContent() {
    var s = settings();
    if (token()) {
      status("Connecting to GitHub…", "busy");
      return ghRead(s.repo, s.path).then(function (r) {
        if (r.missing) throw new Error("content/site.json is not in " + s.owner + "/" + s.repo + "@" + s.branch + ".");
        C.baseline = JSON.parse(r.text); C.sha = r.sha; C.readonly = false;
        status("Connected · " + s.owner + "/" + s.repo + " @ " + r.sha.slice(0, 7), "ok");
      }).catch(function (e) {
        status(e.message, "err"); toast(e.message, "err");
        return loadPublished();
      });
    }
    return loadPublished().then(function () { status("Read-only — add a GitHub token in Settings to publish.", "warn"); });
  }
  function loadPublished() {
    return fetch("../content/site.json", { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (j) { C.baseline = j; C.readonly = true; }).catch(function () { C.baseline = null; });
  }
  function loadMedia() {
    return fetch("../content/media.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) { C.media = m || { images: [], clips: [], tracks: [] }; }).catch(function () { C.media = { images: [], clips: [], tracks: [] }; });
  }

  function discard() {
    confirm("Discard changes?", "Every unpublished edit and any photograph waiting to upload will be dropped, and the editor will go back to what is live.", "Discard", true).then(function (ok) {
      if (!ok) return;
      C.draft = clone(C.baseline); C.uploads = []; lsSet(KEY.uploads, []); localStorage.removeItem(KEY.draft);
      setDirty(false); render(); toast("Back to the published content.");
    });
  }

  var buildPoll = null;
  function watchBuild(sinceIso) {
    clearTimeout(buildPoll);
    var t0 = Date.now();
    (function poll() {
      ghRuns().then(function (run) {
        if (!run) { status("Committed — the site rebuilds in about two minutes.", "ok"); return; }
        var fresh = new Date(run.created_at).getTime() >= new Date(sinceIso).getTime() - 15000;
        if (!fresh || run.status !== "completed") {
          status("Building the site… (" + Math.round((Date.now() - t0) / 1000) + "s)", "busy");
          if (Date.now() - t0 < 12 * 60000) buildPoll = setTimeout(poll, 8000); else status("Still building — check Actions on GitHub.", "warn");
          return;
        }
        if (run.conclusion === "success") { status("Live · published " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), "ok"); toast("The site is live with your changes.", "ok"); loadMedia(); }
        else { status("The build failed — open Actions on GitHub to see why.", "err"); toast("The build failed. Open Actions on GitHub to see why.", "err"); }
      });
    })();
  }

  function publish() {
    if (C.readonly) return toast("Add a GitHub token in Settings first.", "err");
    var bad = $$(".field.is-bad").length;
    if (bad) return toast("Fix the highlighted fields first.", "err");
    var secs = changedSections(), ups = C.uploads.slice();
    var node = E("div", {}, [
      E("p", { text: "This commits your changes to GitHub. The site rebuilds itself and is live in about two minutes." }),
      secs.length ? E("p", { class: "small body", text: "Changed: " + secs.join(", ") + "." }) : null,
      ups.length ? E("p", { class: "small body", text: ups.length + " new photograph" + (ups.length > 1 ? "s" : "") + " will be uploaded first: " + ups.map(function (u) { return u.name; }).join(", ") + "." }) : null,
      secs.length ? E("p", { class: "note small", text: "Other languages keep their existing translations. Text you changed shows in English on the Russian, Chinese and German pages until Dheemi translates it." }) : null
    ]);
    dialog({ title: "Publish to the live site?", node: node, actions: [["Cancel", "btn--ghost", null], ["Publish", "btn--go", "ok"]] }).then(function (r) {
      if (r !== "ok") return;
      var s = settings(), btn = $("#btn-publish"); btn.disabled = true;
      status("Publishing…", "busy");
      var chain = Promise.resolve();
      ups.forEach(function (u) {
        chain = chain.then(function () {
          status("Uploading " + u.name + "…", "busy");
          return ghRead(s.repo, "assets/src/" + u.name + ".jpg").then(function (ex) {
            return ghPut(s.repo, "assets/src/" + u.name + ".jpg", u.b64, "Photograph: " + u.name, ex.sha);
          });
        });
      });
      chain.then(function () {
        status("Committing content…", "busy");
        var msg = "Content: " + (secs.length ? secs.join(", ") : "photographs") + " (admin)";
        return ghPutText(s.repo, s.path, serialize(C.draft), msg, C.sha);
      }).then(function (j) {
        C.baseline = clone(C.draft); C.sha = j.content.sha; C.uploads = []; lsSet(KEY.uploads, []); localStorage.removeItem(KEY.draft);
        setDirty(false); toast("Published. Building the site…", "ok");
        watchBuild(new Date().toISOString());
        render();
      }).catch(function (e) {
        status(e.message, "err"); toast(e.message, "err"); btn.disabled = false;
        if (e.status === 409 || e.status === 422) {
          ghRead(s.repo, s.path).then(function (r) { C.sha = r.sha; toast("Reloaded the latest version from GitHub — check your edits and publish again.", "err"); });
        }
      });
    });
  }

  /* ------------------------------------------------------------ overview */
  register({ id: "overview", group: "Overview", label: "Overview", icon: "home", render: function (host) {
    var s = settings(), B = window.Books;
    var k = E("div", { class: "kpis" });
    if (B) {
      var sum = B.summary();
      k.appendChild(kpi("Upcoming charters", sum.upcoming, "confirmed, from today"));
      k.appendChild(kpi("Outstanding", B.money(sum.outstanding, 0), sum.unpaid + " unpaid invoice" + (sum.unpaid === 1 ? "" : "s")));
      k.appendChild(kpi("This month", B.money(sum.month.revenue, 0), "invoiced, before T-GST"));
      k.appendChild(kpi("Expenses", B.money(sum.month.expenses, 0), "this month"));
    }
    host.appendChild(k);
    var g = E("div", { class: "grid2" });
    // site
    var site = E("div", { class: "card" }, [
      E("div", { class: "card__h" }, [E("div", {}, [E("h2", { text: "Website" }), E("p", { text: C.readonly ? "Read-only until a GitHub token is added in Settings." : "Connected to " + s.owner + "/" + s.repo + "." })]),
        E("a", { class: "btn btn--ghost btn--sm", href: siteUrl(), target: "_blank", rel: "noopener", text: "Open site ↗" })])
    ]);
    var cs = changedSections();
    site.appendChild(cs.length || C.uploads.length
      ? E("div", { class: "note note--warn", text: "Unpublished: " + cs.concat(C.uploads.length ? [C.uploads.length + " photograph(s)"] : []).join(", ") + ". Use Publish at the top when you are ready." })
      : E("div", { class: "note note--ok", text: "Everything you see in the editor is what is live." }));
    var quick = E("div", { class: "list" });
    [["excursions", "Excursions & prices", "Titles, plans, what is included, and the price for seven."],
     ["hero", "Hero film", "Which clips open the home page and how long each holds."],
     ["gallery", "Gallery", "Captions, sections, order and new photographs."],
     ["brand", "Brand & contact", "Telephone, WhatsApp, email, address and opening hours."]].forEach(function (q) {
      quick.appendChild(E("div", { class: "list__i" }, [E("div", {}, [E("a", { href: "#" + q[0], text: q[1] }), E("div", { class: "s", text: q[2] })]), E("a", { class: "btn btn--icon", href: "#" + q[0], html: svg("chev"), "aria-label": q[1] })]));
    });
    site.appendChild(quick);
    g.appendChild(site);
    if (B) g.appendChild(B.overviewCard());
    host.appendChild(g);
    if (token()) ghRuns().then(function (run) {
      if (!run) return;
      var when = new Date(run.updated_at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      site.insertBefore(E("p", { class: "small body", html: "Last build: <b>" + esc(run.conclusion || run.status) + "</b> · " + esc(when) + " · <a href='" + actionsUrl() + "' target='_blank' rel='noopener'>Actions ↗</a>" }), quick);
    });
  } });
  function kpi(k, v, n) { return E("div", { class: "kpi" }, [E("div", { class: "kpi__k", text: k }), E("div", { class: "kpi__v", text: v }), n ? E("div", { class: "kpi__n", text: n }) : null]); }

  /* ------------------------------------------------------------ settings */
  register({ id: "settings", group: "Settings", label: "Settings", icon: "cog", render: function (host) {
    var s = settings();
    var tok = E("input", { type: "password", id: "tok", value: token(), placeholder: "github_pat_…", autocomplete: "off", spellcheck: "false" });
    var rem = E("input", { type: "checkbox", checked: localStorage.getItem(KEY.remember) === "1" });
    var owner = E("input", { value: s.owner }), repo = E("input", { value: s.repo }), branch = E("input", { value: s.branch }), books = E("input", { value: s.booksRepo });
    var f = function (label, input, help) { var w = E("div", { class: "field" }, [E("label", { text: label }), input]); if (help) w.appendChild(E("p", { class: "field__help", text: help })); return w; };
    var card = E("div", { class: "card" }, [
      E("div", { class: "card__h" }, [E("div", {}, [E("h2", { text: "GitHub access" }), E("p", { text: "One fine-grained token unlocks both the website content and the books." })])]),
      E("div", { class: "note", html: "Create it at <a href='https://github.com/settings/personal-access-tokens/new' target='_blank' rel='noopener'>github.com/settings/personal-access-tokens/new</a>: " +
        "<b>Repository access</b> → Only select repositories → <b>" + esc(s.repo) + "</b> and <b>" + esc(s.booksRepo) + "</b>; " +
        "<b>Permissions</b> → Contents: <b>Read and write</b>, Actions: <b>Read-only</b> (so the editor can show the build). Set an expiry you are comfortable with and paste it here." }),
      f("Personal access token", tok),
      E("label", { class: "check" }, [rem, "Remember on this device (otherwise it is forgotten when the tab closes)"]),
      E("div", { class: "fg fg3" }, [f("Owner", owner), f("Website repository", repo), f("Branch", branch)]),
      f("Books repository", books, "A private repository of your own — bookings, invoices and expenses are kept there, never on the public site."),
      E("div", { class: "acts acts--between" }, [
        E("button", { class: "btn btn--ghost", type: "button", text: "Forget token", onclick: function () { setToken("", false); tok.value = ""; toast("Token forgotten on this device."); } }),
        E("button", { class: "btn btn--go", type: "button", text: "Save and connect", onclick: function () {
          saveSettings({ owner: owner.value.trim() || DEFAULTS.owner, repo: repo.value.trim() || DEFAULTS.repo, branch: branch.value.trim() || DEFAULTS.branch, booksRepo: books.value.trim() || DEFAULTS.booksRepo });
          setToken(tok.value.trim(), rem.checked);
          toast("Saved. Connecting…"); boot();
        } })
      ])
    ]);
    host.appendChild(card);
    if (window.Books) host.appendChild(window.Books.settingsCard());
    host.appendChild(E("div", { class: "card" }, [
      E("h2", { text: "How publishing works" }),
      E("p", { class: "body", html: "Edits are kept as a draft in this browser until you press <b>Publish</b>. Publish commits <code>content/site.json</code> (and any new photographs) to GitHub; a GitHub Action then rebuilds all 48 pages in four languages and republishes the site — about two minutes. New photographs are cut to web sizes during that build." }),
      E("p", { class: "body", html: "Translations: Russian, Chinese and German are maintained by Dheemi. Anything you change shows in English on those pages until it is translated." }),
      E("p", { class: "small mute", html: "Admin build " + esc(VERSION) + " · <a href='" + actionsUrl() + "' target='_blank' rel='noopener'>Actions on GitHub ↗</a>" })
    ]));
  } });
  var VERSION = "2026.09.12";

  /* ------------------------------------------------------------ boot */
  var booted = false;
  function boot() {
    if (!booted) {
      booted = true;
      $("#btn-publish").addEventListener("click", publish);
      $("#btn-discard").addEventListener("click", discard);
      $("#menuBtn").addEventListener("click", openSide); $("#sideX").addEventListener("click", closeSide); $("#scrim").addEventListener("click", closeSide);
      window.addEventListener("hashchange", render);
      window.addEventListener("beforeunload", function (e) { if (C.dirty && !C.readonly) { e.preventDefault(); e.returnValue = ""; } });
      $("#sideVer").textContent = VERSION;
    }
    C.uploads = lsGet(KEY.uploads, []);
    Promise.all([loadContent(), loadMedia(), window.Books ? window.Books.load() : Promise.resolve()]).then(function () {
      var d = lsGet(KEY.draft, null);
      if (C.baseline && d && d.data && canon(d.data) !== canon(C.baseline)) {
        C.draft = d.data; setDirty(true);
        toast("Restored your unsaved draft from " + new Date(d.at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + ".");
      } else { C.draft = C.baseline ? clone(C.baseline) : null; setDirty(C.uploads.length > 0); }
      if (!C.draft && route().id !== "settings" && route().id !== "overview") location.hash = "#settings";
      render();
    });
  }

  return { boot: boot, register: register, route: route, go: go, render: render, renderNav: renderNav,
           E: E, $: $, $$: $$, esc: esc, clone: clone, slug: slug, uid: uid, svg: svg, iconBtn: iconBtn,
           toast: toast, status: status, dialog: dialog, confirm: confirm,
           settings: settings, token: token, lsGet: lsGet, lsSet: lsSet, KEY: KEY,
           gh: { read: ghRead, put: ghPut, putText: ghPutText, runs: ghRuns },
           C: C, changed: changed, kpi: kpi, siteUrl: siteUrl };
})();
