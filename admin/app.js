/* ==========================================================================
   CORAVIDA — admin core.
   Everything lives in one Supabase project — the website's content, the
   books, the inbox — behind a staff login. Publishing writes the content to
   the database and asks Vercel to rebuild the site. No framework, no build.
   ========================================================================== */
window.Admin = (function () {
  "use strict";

  var KEY = { draft: "cv:admin:draft", uploads: "cv:admin:uploads", email: "cv:admin:email" };

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
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    inbox: '<path d="M4 4h16v16H4z"/><path d="M4 14h5l1.5 2h3L15 14h5"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
    up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>', chev: '<path d="m9 6 6 6-6 6"/>', chevl: '<path d="m15 6-6 6 6 6"/>', print: '<path d="M6 9V3h12v6M6 18H4V9h16v9h-2"/><rect x="6" y="14" width="12" height="7"/>'
  };
  var svg = function (p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[p] || p) + "</svg>"; };
  var iconBtn = function (name, title, onclick, cls) { var b = E("button", { class: "btn btn--icon " + (cls || ""), type: "button", title: title, "aria-label": title, html: svg(name), onclick: onclick }); return b; };

  var toastT = null;
  function toast(msg, kind, action) {
    var t = $("#toast"); t.textContent = msg; t.className = "toast" + (kind ? " is-" + kind : ""); t.hidden = false;
    if (action) t.appendChild(E("button", { class: "toast__act", type: "button", text: action.label, onclick: function () { t.hidden = true; action.run(); } }));
    clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, action ? 8000 : kind === "err" ? 8000 : 3600);
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
  function lsGet(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* full or blocked — keep working */ } }
  var siteUrl = function () { return new URL("../", location.href).href; };
  var signedIn = function () { return !!(window.DB && DB.ready && DB.auth.user()); };

  /* ------------------------------------------------------------ sections & routing */
  var SECTIONS = [];
  function register(sec) { SECTIONS.push(sec); }
  function route() { var h = (location.hash || "#overview").replace(/^#\/?/, "").split("/"); return { id: h[0] || "overview", arg: h.slice(1).join("/") || "" }; }
  function go(hash) { if (("#" + hash) === location.hash) render(); else location.hash = hash; }

  var GROUPS = ["Overview", "Website", "Books", "Settings"];
  function renderNav() {
    var r = route(), nav = $("#nav"), grp = null;
    nav.innerHTML = "";
    SECTIONS.slice().sort(function (a, b) { return (GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group)) || ((a.order == null ? 1 : a.order) - (b.order == null ? 1 : b.order)); }).forEach(function (s) {
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
    var host = $("#view"); host.innerHTML = ""; document.body.classList.remove("cal-open");
    $("#topH").textContent = s.label; document.title = s.label + " · Coravida Admin";
    try { s.render(host, r.arg); } catch (e) { console.error(e); host.appendChild(E("div", { class: "note note--bad", text: "This view failed to draw: " + e.message })); }
    renderNav();
    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------ content state */
  var C = { baseline: null, draft: null, readonly: true, dirty: false, media: null, uploads: [] };
  var serialize = function (o) { return JSON.stringify(o, null, 2) + "\n"; };
  var canon = function (d) { return d ? serialize(d) : ""; };
  function setDirty(on) {
    C.dirty = !!on;
    $("#dirty").hidden = !C.dirty;
    $("#btn-discard").hidden = !C.dirty;
    $("#btn-publish").disabled = !C.dirty || C.readonly;
    if (C.dirty) lsSet(KEY.draft, { at: Date.now(), data: C.draft });
    renderNav();
  }
  function changed() { setDirty(canon(C.draft) !== canon(C.baseline) || C.uploads.length > 0); }
  function changedSections() {
    if (!C.draft || !C.baseline) return [];
    return Object.keys(C.draft).filter(function (k) { return JSON.stringify(C.draft[k]) !== JSON.stringify(C.baseline[k]); });
  }

  function loadContent() {
    if (signedIn()) {
      status("Loading…", "busy");
      return DB.content.get("site").then(function (r) {
        if (!r) return loadPublished().then(function () { if (C.baseline) return DB.content.set("site", C.baseline); });   // first run: seed from the built site
        C.baseline = r.data; C.readonly = false;
        status("Signed in · " + (DB.auth.user().email || ""), "ok");
      }).catch(function (e) { status(e.message, "err"); toast(e.message, "err"); return loadPublished(); })
        .then(function () { if (C.baseline) { C.readonly = false; status("Signed in · " + (DB.auth.user().email || ""), "ok"); } });
    }
    return loadPublished().then(function () { status("Not signed in", "warn"); });
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

  /* The site reads the content straight from the database, so publishing is
     saving: the next visitor gets the new words. /api/publish exists for the
     rare case that the code itself changed and the deployment must be redone —
     it is not needed for content, and a failure there is not a failure to publish. */
  function rebuild() {
    return DB.auth.token().then(function (tok) {
      return fetch("../api/publish", { method: "POST", headers: { Authorization: "Bearer " + tok } }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || ("The rebuild could not be started (HTTP " + r.status + ")")); return j; }); });
    });
  }
  var buildT = null;
  function watchBuild() {
    clearTimeout(buildT);
    var t0 = Date.now();
    status("Live · published " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), "ok");
    buildT = setTimeout(function () { loadMedia(); }, 2000);
  }

  function publish() {
    if (C.readonly) return toast("Sign in first.", "err");
    var bad = $$(".field.is-bad").length;
    if (bad) return toast("Fix the highlighted fields first.", "err");
    var secs = changedSections(), ups = C.uploads.slice();
    var node = E("div", {}, [
      E("p", { text: "This saves your changes to the website. They are live within a minute — no rebuild, nothing to wait for." }),
      secs.length ? E("p", { class: "small body", text: "Changed: " + secs.join(", ") + "." }) : null,
      ups.length ? E("p", { class: "small body", text: ups.length + " new photograph" + (ups.length > 1 ? "s" : "") + " will be uploaded first: " + ups.map(function (u) { return u.name; }).join(", ") + "." }) : null,
      secs.length ? E("p", { class: "note small", text: "Other languages keep their existing translations. Text you changed shows in English on the Russian, Chinese and German pages until Dheemi translates it." }) : null
    ]);
    dialog({ title: "Publish to the live site?", node: node, actions: [["Cancel", "btn--ghost", null], ["Publish", "btn--go", "ok"]] }).then(function (r) {
      if (r !== "ok") return;
      var btn = $("#btn-publish"); btn.disabled = true;
      status("Publishing…", "busy");
      var chain = Promise.resolve();
      ups.forEach(function (u) {
        chain = chain.then(function () {
          status("Uploading " + u.name + "…", "busy");
          var bin = atob(u.b64), bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          return DB.storage.upload(u.name, new Blob([bytes], { type: "image/jpeg" }));
        });
      });
      chain.then(function () { status("Saving content…", "busy"); return DB.content.set("site", JSON.parse(JSON.stringify(C.draft, function (k, v) { return k.charAt(0) === "_" ? undefined : v; }))); })   // editor-only keys stay here
        .then(function () { return rebuild().catch(function () { /* content is published either way */ }); })
        .then(function () {
          C.baseline = clone(C.draft); C.uploads = []; lsSet(KEY.uploads, []); localStorage.removeItem(KEY.draft);
          setDirty(false); toast("Published. The site shows it within a minute.", "ok"); watchBuild(); render();
        })
        .catch(function (e) { status(e.message, "err"); toast(e.message, "err"); btn.disabled = false; });
    });
  }

  /* ------------------------------------------------------------ overview */
  register({ id: "overview", group: "Overview", label: "Overview", icon: "home", render: function (host) {
    var B = window.Books;
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
      E("div", { class: "card__h" }, [E("div", {}, [E("h2", { text: "Website" }), E("p", { text: C.readonly ? "Sign in to edit." : "Signed in as " + (DB.auth.user().email || "staff") + "." })]),
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
    if (window.Inbox && signedIn()) g.appendChild(window.Inbox.overviewCard());
    if (B) g.appendChild(B.overviewCard());
    host.appendChild(g);
  } });
  function kpi(k, v, n) { return E("div", { class: "kpi" }, [E("div", { class: "kpi__k", text: k }), E("div", { class: "kpi__v", text: v }), n ? E("div", { class: "kpi__n", text: n }) : null]); }

  /* ------------------------------------------------------------ account */
  register({ id: "settings", group: "Settings", label: "Settings", icon: "cog", render: function (host) {
    var u = DB.ready ? DB.auth.user() : null;
    var card = E("div", { class: "card" }, [E("div", { class: "card__h" }, [E("div", {}, [E("h2", { text: "Your account" }), E("p", { text: u ? "Signed in as " + u.email : "Not signed in." })])])]);
    if (u) {
      var p1 = E("input", { type: "password", autocomplete: "new-password", placeholder: "At least 8 characters" }), p2 = E("input", { type: "password", autocomplete: "new-password" });
      card.appendChild(E("div", { class: "fg fg2" }, [E("div", { class: "field" }, [E("label", { text: "New password" }), p1]), E("div", { class: "field" }, [E("label", { text: "Again" }), p2])]));
      card.appendChild(E("div", { class: "acts acts--between" }, [
        E("button", { class: "btn btn--ghost", type: "button", text: "Sign out", onclick: function () { DB.auth.signOut().then(function () { location.reload(); }); } }),
        E("button", { class: "btn btn--go", type: "button", text: "Change password", onclick: function () { if (p1.value.length < 8) return toast("Use at least 8 characters.", "err"); if (p1.value !== p2.value) return toast("The two passwords differ.", "err"); DB.auth.setPassword(p1.value).then(function () { p1.value = p2.value = ""; toast("Password changed.", "ok"); }).catch(function (e) { toast(e.message, "err"); }); } })
      ]));
      card.appendChild(E("p", { class: "small mute", text: "New staff accounts are created by Dheemi. Each person signs in with their own email and password on any device." }));
    }
    host.appendChild(card);
    if (window.Books) host.appendChild(window.Books.settingsCard());
    host.appendChild(E("div", { class: "card" }, [
      E("h2", { text: "How publishing works" }),
      E("p", { class: "body", html: "Edits are kept as a draft in this browser until you press <b>Publish</b>. Publish saves the content to the database and rebuilds the website — about two minutes. New photographs are cut to web sizes during that build." }),
      E("p", { class: "body", html: "The books, the calendar and the inbox save as you go and are shared by every device the moment they change." }),
      E("p", { class: "small mute", text: "Admin build " + VERSION })
    ]));
  } });
  var VERSION = "2026.09.16";

  /* ------------------------------------------------------------ sign in */
  function login() {
    var host = $("#view"); host.innerHTML = ""; $("#topH").textContent = "Sign in"; document.title = "Sign in · Coravida Admin";
    $("#nav").innerHTML = ""; $("#btn-publish").disabled = true; $("#dirty").hidden = true; $("#btn-discard").hidden = true;
    if (!DB.ready) { host.appendChild(E("div", { class: "note note--bad", text: DB.reason })); return; }
    var em = E("input", { type: "email", autocomplete: "username", value: lsGet(KEY.email, ""), placeholder: "you@coravida.com" }), pw = E("input", { type: "password", autocomplete: "current-password" });
    var form = E("form", { class: "login card", onsubmit: function (e) {
      e.preventDefault(); var b = $("button[type=submit]", form); b.disabled = true; status("Signing in…", "busy");
      DB.auth.signIn(em.value.trim(), pw.value).then(function () { lsSet(KEY.email, em.value.trim()); boot(); }).catch(function (x) { b.disabled = false; status("", ""); toast(x.message === "Invalid login credentials" ? "That email and password do not match." : x.message, "err"); });
    } }, [
      E("h2", { text: "Coravida admin" }), E("p", { class: "body", text: "Sign in with your staff email and password." }),
      E("div", { class: "field" }, [E("label", { text: "Email" }), em]), E("div", { class: "field" }, [E("label", { text: "Password" }), pw]),
      E("div", { class: "acts acts--between" }, [E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Forgotten password", onclick: function () { if (!em.value) return toast("Type your email first.", "err"); DB.auth.reset(em.value.trim()).then(function () { toast("Check your email for the reset link.", "ok"); }).catch(function (x) { toast(x.message, "err"); }); } }), E("button", { class: "btn btn--go", type: "submit", text: "Sign in" })])
    ]);
    host.appendChild(E("div", { class: "login__wrap" }, [form]));
    setTimeout(function () { (em.value ? pw : em).focus(); }, 50);
    status("", "");
  }

  /* ------------------------------------------------------------ boot */
  var booted = false;
  /* the admin's own chrome uses the media library too, wherever it is */
  (function () {
    var base = (window.CV_ENV && window.CV_ENV.MEDIA_URL) || "";
    if (base) $$("[data-media]").forEach(function (n) { n.src = base + n.getAttribute("data-media"); });
  })();

  function boot() {
    if (!booted) {
      booted = true;
      $("#btn-publish").addEventListener("click", publish);
      $("#btn-discard").addEventListener("click", discard);
      $("#menuBtn").addEventListener("click", openSide); $("#sideX").addEventListener("click", closeSide); $("#scrim").addEventListener("click", closeSide);
      window.addEventListener("hashchange", function () { if (signedIn()) render(); });
      window.addEventListener("beforeunload", function (e) { if (C.dirty && !C.readonly) { e.preventDefault(); e.returnValue = ""; } });
      $("#sideVer").textContent = VERSION;
      if (DB.ready) DB.auth.onChange(function (u, ev) { if (ev === "SIGNED_OUT") login(); if (ev === "PASSWORD_RECOVERY") { location.hash = "#settings"; toast("Set a new password below.", "ok"); } });
    }
    var start = DB.ready ? DB.auth.session() : Promise.resolve(null);
    start.then(function (session) {
      if (!session) return login();
      C.uploads = lsGet(KEY.uploads, []);
      return Promise.all([loadContent(), loadMedia(), window.Books ? window.Books.load() : Promise.resolve()]).then(function () {
        if (window.Inbox) window.Inbox.load(true);
        var d = lsGet(KEY.draft, null);
        if (C.baseline && d && d.data && canon(d.data) !== canon(C.baseline)) {
          C.draft = d.data; setDirty(true);
          toast("Restored your unsaved draft from " + new Date(d.at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + ".");
        } else { C.draft = C.baseline ? clone(C.baseline) : null; setDirty(C.uploads.length > 0); }
        render();
      });
    });
  }

  return { boot: boot, register: register, route: route, go: go, render: render, renderNav: renderNav,
           E: E, $: $, $$: $$, esc: esc, clone: clone, slug: slug, uid: uid, svg: svg, iconBtn: iconBtn,
           toast: toast, status: status, dialog: dialog, confirm: confirm,
           lsGet: lsGet, lsSet: lsSet, KEY: KEY, signedIn: signedIn,
           C: C, changed: changed, kpi: kpi, siteUrl: siteUrl };
})();
