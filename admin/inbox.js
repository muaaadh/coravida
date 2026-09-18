/* ==========================================================================
   CORAVIDA — enquiries, on a board.
   What guests send through the website's enquiry and contact forms lands in
   the inbox table and appears here the moment it arrives, in the first
   column. From there the office moves it along — contacted, quoted, booked —
   or marks it lost. Drag a card between columns, or open it and use Move to.
   An enquiry becomes a booking with one press; the rest is a reply.
   ========================================================================== */
(function (A) {
  "use strict";
  var E = A.E, $ = A.$, $$ = A.$$, esc = A.esc, svg = A.svg, toast = A.toast, B = window.Books;
  var entries = A.lsGet("cv:inbox", []), loadedAt = 0, loading = false, error = "", watching = false;
  /* the columns, in the order an enquiry travels */
  var COLS = [
    { id: "new",       label: "New",       hint: "Just arrived — nobody has replied yet." },
    { id: "contacted", label: "Contacted", hint: "The office has been in touch." },
    { id: "quoted",    label: "Quoted",    hint: "A price has gone out; waiting on the guest." },
    { id: "booked",    label: "Booked",    hint: "In the books, with a reference." },
    { id: "lost",      label: "Lost",      hint: "Did not go ahead — kept for the record." }
  ];
  var LABEL = {}; COLS.forEach(function (c) { LABEL[c.id] = c.label; }); LABEL.archived = "Archived";
  /* rows written before the board are placed where they belong */
  function col(e) { var s = e.status || "new"; if (s === "handled") return e.bookingRef ? "booked" : "contacted"; return LABEL[s] ? s : "new"; }

  function load(force) {
    if (!A.signedIn()) return Promise.resolve(entries);
    if (loading || (!force && Date.now() - loadedAt < 15000)) return Promise.resolve(entries);
    loading = true;
    return DB.inbox.list()
      .then(function (list) { entries = list; error = ""; loadedAt = Date.now(); A.lsSet("cv:inbox", entries); A.renderNav(); watch(); return entries; })
      .catch(function (e) { error = e.message; return entries; })
      .then(function (x) { loading = false; return x; });
  }
  function watch() { if (watching) return; watching = true; DB.inbox.watch(function () { load(true).then(function () { if (A.route().id === "inbox" && $("#modal").hidden) A.render(); }); }); }
  function update(id, patch) {
    return DB.inbox.update(id, Object.assign({ by: B.device() }, patch)).then(function (e) { var i = entries.findIndex(function (x) { return x.id === id; }); if (i > -1) entries[i] = e; else entries.unshift(e); A.lsSet("cv:inbox", entries); A.renderNav(); return e; });
  }
  function del(id) { return DB.inbox.remove(id).then(function () { entries = entries.filter(function (e) { return e.id !== id; }); A.lsSet("cv:inbox", entries); A.renderNav(); }); }
  var fresh = function () { return entries.filter(function (e) { return col(e) === "new"; }); };
  var ago = function (iso) { var s = (Date.now() - new Date(iso)) / 1000; return s < 90 ? "just now" : s < 5400 ? Math.round(s / 60) + " min ago" : s < 172800 ? Math.round(s / 3600) + " h ago" : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); };
  var LANGS = { en: "English", ru: "Russian", zh: "Chinese", de: "German" };

  /* move a card: the column is the status; booked needs the books */
  function move(e, to) {
    if (to === col(e)) return Promise.resolve(e);
    if (to === "booked" && !e.bookingRef && e.kind !== "contact") { toBooking(e); return Promise.resolve(e); }
    return update(e.id, { status: to }).then(function (x) {
      B.logIt("enquiry", "moved", (e.name || "Enquiry") + " → " + LABEL[to], "#inbox"); B.save();
      toast((e.name || "Enquiry") + " moved to " + LABEL[to] + ".", "ok"); return x;
    }).catch(function (x) { toast(x.message, "err"); });
  }

  /* the guest's words become a booking; the books do the rest */
  function toBooking(e) {
    var cv = (A.C.draft || A.C.baseline) || {}, v = (cv.voyages || []).filter(function (x) { return x.slug === e.excursion; })[0];
    var wants = String(e.extras || e.extra || "").toLowerCase();
    var addons = (cv.addons || []).filter(function (a) { return wants.indexOf(String(a.t).toLowerCase()) > -1 || wants.indexOf(a.id) > -1; }).map(function (a) { return { id: a.id, t: a.t, p: a.p }; });
    var notes = [e.notes, e.message, e.arrange ? "Asked for (to quote): " + e.arrange : "", e.alt ? "Alternative date " + B.fmtDate(e.alt) : "", e.pickup ? "Departure " + e.pickup : "", e.total ? "Estimate shown on the site: " + e.total : "", "From the website (" + (LANGS[e.lang] || e.lang || "") + ")"].filter(Boolean).join("\n");
    var preset = { customer: { name: e.name || "", email: e.email || "", phone: e.phone || "", staying: e.staying || "" }, guests: Number(e.guests) || (cv.rates && cv.rates.pax) || 7, notes: notes, status: "enquiry", source: "web", inboxId: e.id };
    if (e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) preset.date = e.date;
    if (v) { preset.excursion = v.slug; preset.excursionTitle = v.title; preset.slot = B.slotFor(v); preset.price = Number(preset.guests) === Number(cv.rates && cv.rates.pax) ? v.price : null; }
    if (addons.length) preset.addons = addons;
    B.newBooking(preset, function (b) {
      update(e.id, { status: "booked", bookingRef: b.ref }).then(function () { B.logIt("booking", "from web", b.ref + " · " + B.nameOf(b) + " — made from a website enquiry", "#bookings/" + b.id, b.ref); B.save(); toast("Booking " + b.ref + " made from the enquiry.", "ok"); A.go("bookings/" + b.id); }).catch(function (x) { toast(x.message, "err"); });
    });
  }

  function replyLinks(e) {
    var acts = E("div", { class: "acts" });
    if (e.phone) acts.appendChild(E("a", { class: "btn btn--ghost btn--sm", href: "https://wa.me/" + String(e.phone).replace(/[^\d]/g, "") + "?text=" + encodeURIComponent("Hello " + (e.name || "").split(" ")[0] + ", this is Coravida — thank you for your enquiry" + (e.date ? " for " + B.fmtDate(e.date) : "") + "."), target: "_blank", rel: "noopener", text: "WhatsApp" }));
    if (e.email) acts.appendChild(E("a", { class: "btn btn--ghost btn--sm", href: "mailto:" + e.email + "?subject=" + encodeURIComponent("Your Coravida enquiry" + (e.date ? " — " + B.fmtDate(e.date) : "")), text: "Email" }));
    if (e.phone) acts.appendChild(E("a", { class: "btn btn--ghost btn--sm", href: "tel:" + String(e.phone).replace(/[^\d+]/g, ""), text: "Call" }));
    return acts;
  }
  function details(e) {
    var dl = E("div", { class: "inb__dl" });
    [["Excursion", e.excursionTitle || e.excursion], ["Date", e.date ? B.fmtDate(e.date) : ""], ["Alternative", e.alt ? B.fmtDate(e.alt) : ""], ["Guests", e.guests], ["Add-ons", e.extras || e.extra], ["Asked for", e.arrange ? e.arrange + " — to quote" : ""], ["Departure", e.pickup], ["Staying at", e.staying], ["Subject", e.kind === "contact" ? e.subject : ""], ["Estimate shown", e.total], ["Language", LANGS[e.lang] || e.lang], ["Handled by", e.handledBy]].forEach(function (p) { if (p[1]) dl.appendChild(E("div", { class: "inb__kv" }, [E("span", { class: "k", text: p[0] }), E("span", { class: "v", text: String(p[1]) })])); });
    return dl;
  }
  function moveMenu(e, after) {
    var sel = E("select", { class: "sel", "aria-label": "Move to" });
    sel.appendChild(E("option", { value: "", text: "Move to…" }));
    COLS.forEach(function (c) { if (c.id !== col(e)) sel.appendChild(E("option", { value: c.id, text: c.label })); });
    if (col(e) !== "archived") sel.appendChild(E("option", { value: "archived", text: "Archive" }));
    sel.addEventListener("change", function () { var to = sel.value; if (!to) return; if (after) after(); move(e, to).then(A.render); });
    return sel;
  }
  /* the card, opened: everything the guest wrote, and every way to answer */
  function open(e) {
    var kind = e.kind === "contact" ? "Message" : "Enquiry", closed = false;
    function close() { if (closed) return; closed = true; var m = $("#modal"); if (m) { m.hidden = true; document.body.style.overflow = ""; } }
    var node = E("div", { class: "inb inb--open" }, [
      E("p", { class: "sub", text: [e.email, e.phone].filter(Boolean).join(" · ") + " · " + ago(e.at) + (e.handledAt ? " · last touched " + ago(e.handledAt) : "") + " · " + LABEL[col(e)] }),
      details(e),
      (e.message || e.notes) ? E("p", { class: "inb__msg", text: e.message || e.notes }) : null,
      E("div", { class: "inb__acts" }, [
        replyLinks(e),
        E("div", { class: "acts" }, [
          e.kind !== "contact" && !e.bookingRef ? E("button", { class: "btn btn--go btn--sm", type: "button", text: "Make a booking", onclick: function () { close(); toBooking(e); } }) : null,
          e.bookingRef ? E("a", { class: "btn btn--ghost btn--sm", href: (function () { var b = B.live("bookings").filter(function (x) { return x.ref === e.bookingRef; })[0]; return b ? "#bookings/" + b.id : "#bookings"; })(), text: "Open " + e.bookingRef, onclick: close }) : null,
          moveMenu(e, close),
          A.iconBtn("trash", "Delete for good", function () { A.confirm("Delete this " + kind.toLowerCase() + "?", "It is removed from the board for good. The books keep any booking made from it.", "Delete", true).then(function (ok) { if (ok) del(e.id).then(A.render).catch(function (x) { toast(x.message, "err"); }); else open(e); }); close(); })
        ])
      ])
    ]);
    A.dialog({ title: (e.name || "—") + " · " + kind, node: node, wide: true, actions: [["Close", "btn--ghost", null]] }).then(function () { closed = true; });
  }
  function card(e) {
    var c = E("article", { class: "kb__card" + (col(e) === "new" ? " kb__card--new" : ""), draggable: "true", tabindex: "0", role: "button", "aria-label": (e.name || "Enquiry") + " — open" });
    c.appendChild(E("div", { class: "kb__top" }, [E("strong", { text: e.name || "—" }), E("span", { class: "kb__age", text: ago(e.at) })]));
    var line = e.kind === "contact" ? (e.subject || "Message") : [e.excursionTitle || e.excursion, e.date ? B.fmtDate(e.date) : "", e.guests ? e.guests + " guests" : ""].filter(Boolean).join(" · ");
    if (line) c.appendChild(E("div", { class: "kb__line", text: line }));
    var tags = E("div", { class: "kb__tags" });
    if (e.kind === "contact") tags.appendChild(E("span", { class: "badge badge--info", text: "Message" }));
    if (e.total && e.kind !== "contact") tags.appendChild(E("span", { class: "badge", text: e.total }));
    if (e.arrange) tags.appendChild(E("span", { class: "badge badge--warn", text: "To quote" }));
    if (e.bookingRef) tags.appendChild(E("span", { class: "badge badge--ok", text: e.bookingRef }));
    if (tags.childNodes.length) c.appendChild(tags);
    c.addEventListener("click", function () { open(e); });
    c.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); open(e); } });
    c.addEventListener("dragstart", function (ev) { ev.dataTransfer.setData("text/plain", e.id); ev.dataTransfer.effectAllowed = "move"; c.classList.add("is-drag"); });
    c.addEventListener("dragend", function () { c.classList.remove("is-drag"); });
    return c;
  }
  function column(cdef, rows) {
    var body = E("div", { class: "kb__body" });
    rows.forEach(function (e) { body.appendChild(card(e)); });
    if (!rows.length) body.appendChild(E("div", { class: "kb__empty", text: cdef.id === "new" ? "Nothing new. Enquiries appear here the moment a guest sends them." : "—" }));
    var colEl = E("section", { class: "kb__col kb__col--" + cdef.id, "aria-label": cdef.label }, [
      E("header", { class: "kb__h", title: cdef.hint }, [E("h3", { text: cdef.label }), E("span", { class: "kb__n", text: String(rows.length) })]), body]);
    colEl.addEventListener("dragover", function (ev) { ev.preventDefault(); ev.dataTransfer.dropEffect = "move"; colEl.classList.add("is-over"); });
    colEl.addEventListener("dragleave", function () { colEl.classList.remove("is-over"); });
    colEl.addEventListener("drop", function (ev) { ev.preventDefault(); colEl.classList.remove("is-over"); var id = ev.dataTransfer.getData("text/plain"), e = entries.filter(function (x) { return x.id === id; })[0]; if (e) move(e, cdef.id).then(A.render); });
    return colEl;
  }

  A.register({ id: "inbox", group: "Books", label: "Enquiries", icon: "inbox", order: -1, badge: function () { var n = fresh().length; return n || ""; }, render: function (host) {
    var showArch = A.lsGet("cv:inbox:arch", false);
    host.appendChild(E("div", { class: "pagehead" }, [E("div", {}, [E("h2", { text: "Enquiries" }), E("p", { text: "Every enquiry from the website lands in New. Drag it along as you deal with it — or open it and use Move to." })]),
      E("div", { class: "acts" }, [
        E("button", { class: "btn btn--ghost btn--sm", type: "button", text: showArch ? "Hide archived" : "Show archived", onclick: function () { A.lsSet("cv:inbox:arch", !showArch); A.render(); } }),
        E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Refresh", onclick: function () { load(true).then(A.render); } })])]));
    if (!A.signedIn()) { host.appendChild(E("div", { class: "note note--warn", text: "Sign in to see the enquiries." })); return; }
    if (error) host.appendChild(E("div", { class: "note note--bad", text: "The enquiries could not be reached: " + error }));
    var board = E("div", { class: "kb" });
    var cols = COLS.slice(); if (showArch) cols.push({ id: "archived", label: "Archived", hint: "Off the board." });
    cols.forEach(function (cdef) { board.appendChild(column(cdef, entries.filter(function (e) { return col(e) === cdef.id; }))); });
    host.appendChild(board);
    host.appendChild(E("p", { class: "small mute", text: (loadedAt ? "Checked " + ago(new Date(loadedAt).toISOString()) + ". " : "") + "Booked cards carry their booking reference; anything a guest asked to have quoted is tagged To quote." }));
    var before = JSON.stringify(entries.map(function (e) { return e.id + col(e); }));
    load(true).then(function () { if (A.route().id === "inbox" && $("#modal").hidden && JSON.stringify(entries.map(function (e) { return e.id + col(e); })) !== before) A.render(); });
  } });

  /* the overview shows what is waiting */
  function overviewCard() {
    var n = fresh(), counts = {}; entries.forEach(function (e) { var c = col(e); counts[c] = (counts[c] || 0) + 1; });
    var c = E("div", { class: "card" }, [E("div", { class: "card__h" }, [E("div", {}, [E("h2", { text: "Enquiries" }), E("p", { text: n.length ? n.length + " new from the website" : "Nothing new from the website" })]), E("a", { class: "btn btn--ghost btn--sm", href: "#inbox", text: "Open the board" })])]);
    c.appendChild(E("div", { class: "kb__mini" }, COLS.map(function (cd) { return E("a", { href: "#inbox", class: "kb__mini__c" + (cd.id === "new" && n.length ? " on" : "") }, [E("b", { text: String(counts[cd.id] || 0) }), E("span", { text: cd.label })]); })));
    if (n.length) c.appendChild(E("div", { class: "list" }, n.slice(0, 4).map(function (e) { return E("div", { class: "list__i" }, [E("div", {}, [E("a", { href: "#inbox", text: (e.name || "—") + (e.excursionTitle ? " · " + e.excursionTitle : "") }), E("div", { class: "s", text: (e.date ? B.fmtDate(e.date) + " · " : "") + (e.guests ? e.guests + " guests · " : "") + ago(e.at) })]), E("span", { class: "badge badge--warn", text: "New" })]); })));
    return c;
  }
  // keep the badge honest while the admin is open
  setInterval(function () { if (document.visibilityState === "visible" && A.signedIn()) load(false).then(function () { if (A.route().id === "inbox" && $("#modal").hidden) A.render(); }); }, 120000);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") load(true); });
  window.Inbox = { load: load, fresh: fresh, overviewCard: overviewCard, entries: function () { return entries; }, col: col };
})(window.Admin);
