/* ==========================================================================
   CORAVIDA — the inbox.
   What guests send through the website's enquiry and contact forms lands in
   a small function on Vercel (see brand.form.endpoint) and is read from
   here. An enquiry becomes a booking with one press; the rest is a reply.
   ========================================================================== */
(function (A) {
  "use strict";
  var E = A.E, $ = A.$, $$ = A.$$, esc = A.esc, svg = A.svg, toast = A.toast, B = window.Books;
  var entries = A.lsGet("cv:inbox", []), loadedAt = 0, loading = false, error = "";

  function url() {
    var c = A.C.draft || A.C.baseline, ep = c && c.brand && c.brand.form && c.brand.form.endpoint || "";
    return /\/api\/enquire\/?$/.test(ep) ? ep.replace(/\/api\/enquire\/?$/, "/api/inbox") : "";
  }
  function headers() { return { Authorization: "Bearer " + A.token(), "Content-Type": "application/json" }; }
  function load(force) {
    if (!A.token() || !url()) return Promise.resolve(entries);
    if (loading || (!force && Date.now() - loadedAt < 20000)) return Promise.resolve(entries);
    loading = true;
    return fetch(url(), { headers: headers(), cache: "no-store" }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || ("HTTP " + r.status)); return j.entries; }); })
      .then(function (list) { entries = list; error = ""; loadedAt = Date.now(); A.lsSet("cv:inbox", entries); A.renderNav(); return entries; })
      .catch(function (e) { error = e.message; return entries; })
      .then(function (x) { loading = false; return x; });
  }
  function update(id, patch) {
    return fetch(url(), { method: "POST", headers: headers(), body: JSON.stringify(Object.assign({ id: id, by: B.device() }, patch)) })
      .then(function (r) { return r.json(); }).then(function (j) { if (!j.ok) throw new Error(j.error || "Could not update"); var i = entries.findIndex(function (e) { return e.id === id; }); if (i > -1) entries[i] = j.entry; A.lsSet("cv:inbox", entries); A.renderNav(); return j.entry; });
  }
  function del(id) {
    return fetch(url(), { method: "DELETE", headers: headers(), body: JSON.stringify({ id: id }) }).then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) throw new Error(j.error || "Could not delete"); entries = entries.filter(function (e) { return e.id !== id; }); A.lsSet("cv:inbox", entries); A.renderNav(); });
  }
  var fresh = function () { return entries.filter(function (e) { return e.status === "new"; }); };
  var ago = function (iso) { var s = (Date.now() - new Date(iso)) / 1000; return s < 90 ? "just now" : s < 5400 ? Math.round(s / 60) + " min ago" : s < 172800 ? Math.round(s / 3600) + " h ago" : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); };
  var LANGS = { en: "English", ru: "Russian", zh: "Chinese", de: "German" };

  /* the guest's words become a booking; the books do the rest */
  function toBooking(e) {
    var cv = (A.C.draft || A.C.baseline) || {}, v = (cv.voyages || []).filter(function (x) { return x.slug === e.excursion; })[0];
    var wants = String(e.extras || e.extra || "").toLowerCase();
    var addons = (cv.addons || []).filter(function (a) { return wants.indexOf(String(a.t).toLowerCase()) > -1 || wants.indexOf(a.id) > -1; }).map(function (a) { return { id: a.id, t: a.t, p: a.p }; });
    var notes = [e.notes, e.message, e.alt ? "Alternative date " + B.fmtDate(e.alt) : "", e.pickup ? "Departure " + e.pickup : "", "From the website (" + (LANGS[e.lang] || e.lang || "") + ")"].filter(Boolean).join("\n");
    var preset = { customer: { name: e.name || "", email: e.email || "", phone: e.phone || "", staying: e.staying || "" }, guests: Number(e.guests) || (cv.rates && cv.rates.pax) || 7, notes: notes, status: "enquiry", source: "web", inboxId: e.id };
    if (e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) preset.date = e.date;
    if (v) { preset.excursion = v.slug; preset.excursionTitle = v.title; preset.slot = B.slotFor(v); preset.price = Number(preset.guests) === Number(cv.rates && cv.rates.pax) ? v.price : null; }
    if (addons.length) preset.addons = addons;
    B.newBooking(preset, function (b) {
      update(e.id, { status: "handled", bookingRef: b.ref }).then(function () { B.logIt("booking", "from web", b.ref + " · " + B.nameOf(b) + " — made from a website enquiry", "#bookings/" + b.id, b.ref); B.save(); toast("Booking " + b.ref + " made from the enquiry.", "ok"); A.go("bookings/" + b.id); }).catch(function (x) { toast(x.message, "err"); });
    });
  }

  function replyLinks(e) {
    var acts = E("div", { class: "acts" });
    if (e.phone) acts.appendChild(E("a", { class: "btn btn--ghost btn--sm", href: "https://wa.me/" + String(e.phone).replace(/[^\d]/g, "") + "?text=" + encodeURIComponent("Hello " + (e.name || "").split(" ")[0] + ", this is Coravida — thank you for your enquiry" + (e.date ? " for " + B.fmtDate(e.date) : "") + "."), target: "_blank", rel: "noopener", text: "WhatsApp" }));
    if (e.email) acts.appendChild(E("a", { class: "btn btn--ghost btn--sm", href: "mailto:" + e.email + "?subject=" + encodeURIComponent("Your Coravida enquiry" + (e.date ? " — " + B.fmtDate(e.date) : "")), text: "Email" }));
    if (e.phone) acts.appendChild(E("a", { class: "btn btn--ghost btn--sm", href: "tel:" + String(e.phone).replace(/[^\d+]/g, ""), text: "Call" }));
    return acts;
  }
  function card(e) {
    var st = e.status || "new", kind = e.kind === "contact" ? "Message" : "Enquiry";
    var dl = E("div", { class: "inb__dl" });
    [["Excursion", e.excursionTitle || e.excursion], ["Date", e.date ? B.fmtDate(e.date) : ""], ["Alternative", e.alt ? B.fmtDate(e.alt) : ""], ["Guests", e.guests], ["Add-ons", e.extras || e.extra], ["Departure", e.pickup], ["Staying at", e.staying], ["Subject", e.kind === "contact" ? e.subject : ""], ["Quoted", e.total], ["Language", LANGS[e.lang] || e.lang]].forEach(function (p) { if (p[1]) dl.appendChild(E("div", { class: "inb__kv" }, [E("span", { class: "k", text: p[0] }), E("span", { class: "v", text: String(p[1]) })])); });
    var c = E("article", { class: "inb inb--" + st }, [
      E("div", { class: "inb__h" }, [
        E("div", {}, [E("h3", {}, [E("span", { class: "badge " + (e.kind === "contact" ? "badge--info" : "badge--navy"), text: kind }), " ", e.name || "—"]), E("p", { class: "sub", text: [e.email, e.phone].filter(Boolean).join(" · ") })]),
        E("div", { class: "inb__when" }, [E("span", { class: "badge " + (st === "new" ? "badge--warn" : st === "handled" ? "badge--ok" : ""), text: st === "new" ? "New" : st === "handled" ? "Handled" + (e.bookingRef ? " · " + e.bookingRef : "") : "Archived" }), E("time", { datetime: e.at, title: new Date(e.at).toLocaleString(), text: ago(e.at) })])
      ]),
      dl.childNodes.length ? dl : null,
      (e.message || e.notes) ? E("p", { class: "inb__msg", text: e.message || e.notes }) : null,
      E("div", { class: "inb__acts" }, [
        replyLinks(e),
        E("div", { class: "acts" }, [
          e.kind !== "contact" && st !== "handled" ? E("button", { class: "btn btn--go btn--sm", type: "button", text: "Make a booking", onclick: function () { toBooking(e); } }) : null,
          e.bookingRef ? E("a", { class: "btn btn--ghost btn--sm", href: (function () { var b = B.live("bookings").filter(function (x) { return x.ref === e.bookingRef; })[0]; return b ? "#bookings/" + b.id : "#bookings"; })(), text: "Open " + e.bookingRef }) : null,
          st === "new" ? E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Mark handled", onclick: function () { update(e.id, { status: "handled" }).then(A.render).catch(function (x) { toast(x.message, "err"); }); } }) : null,
          st !== "archived" ? E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Archive", onclick: function () { update(e.id, { status: "archived" }).then(A.render).catch(function (x) { toast(x.message, "err"); }); } }) : E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Restore", onclick: function () { update(e.id, { status: "new" }).then(A.render).catch(function (x) { toast(x.message, "err"); }); } }),
          A.iconBtn("trash", "Delete for good", function () { A.confirm("Delete this " + kind.toLowerCase() + "?", "It is removed from the inbox for good. The books keep any booking made from it.", "Delete", true).then(function (ok) { if (ok) del(e.id).then(A.render).catch(function (x) { toast(x.message, "err"); }); }); })
        ])
      ])
    ]);
    return c;
  }

  A.register({ id: "inbox", group: "Books", label: "Inbox", icon: "inbox", order: -1, badge: function () { var n = fresh().length; return n || ""; }, render: function (host) {
    var view = A.lsGet("cv:inbox:v", "new");
    host.appendChild(E("div", { class: "pagehead" }, [E("div", {}, [E("h2", { text: "Inbox" }), E("p", { text: "What guests send through the website. Make a booking from an enquiry in one press, or reply." })]),
      E("div", { class: "acts" }, [E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Refresh", onclick: function () { load(true).then(A.render); } })])]));
    if (!A.token()) { host.appendChild(E("div", { class: "note note--warn", html: "Add a GitHub token in <a href='#settings'>Settings</a> to read the inbox — the same token unlocks the books." })); return; }
    if (!url()) { host.appendChild(E("div", { class: "note note--warn", html: "No inbox address — set the form endpoint under <a href='#brand'>Brand & contact</a>." })); return; }
    var card0 = E("div", { class: "card" });
    var seg = E("div", { class: "seg" }); [["new", "New"], ["handled", "Handled"], ["archived", "Archived"], ["all", "All"]].forEach(function (k) { seg.appendChild(E("button", { type: "button", class: k[0] === view ? "on" : "", text: k[1], onclick: function () { A.lsSet("cv:inbox:v", k[0]); A.render(); } })); });
    card0.appendChild(E("div", { class: "filters" }, [seg, E("span", { class: "small mute", text: loadedAt ? "Checked " + ago(new Date(loadedAt).toISOString()) : "" })]));
    var list = E("div", { class: "inb__list" });
    function draw() {
      list.innerHTML = "";
      if (error) list.appendChild(E("div", { class: "note note--bad", text: "The inbox could not be reached: " + error }));
      var rows = entries.filter(function (e) { return view === "all" || (e.status || "new") === view; });
      if (!rows.length) list.appendChild(E("div", { class: "empty" }, [E("h3", { text: view === "new" ? "Nothing new" : "Nothing here" }), E("p", { text: view === "new" ? "New enquiries from the website appear here the moment a guest sends them." : "" })]));
      rows.forEach(function (e) { list.appendChild(card(e)); });
    }
    draw(); card0.appendChild(list); host.appendChild(card0);
    load(true).then(function () { if (A.route().id === "inbox") { draw(); $(".filters .mute", card0).textContent = "Checked just now"; } });
  } });

  /* the overview shows what is waiting */
  function overviewCard() {
    var n = fresh();
    var c = E("div", { class: "card" }, [E("div", { class: "card__h" }, [E("div", {}, [E("h2", { text: "Inbox" }), E("p", { text: n.length ? n.length + " new from the website" : "Nothing new from the website" })]), E("a", { class: "btn btn--ghost btn--sm", href: "#inbox", text: "Open inbox" })])]);
    if (n.length) c.appendChild(E("div", { class: "list" }, n.slice(0, 4).map(function (e) { return E("div", { class: "list__i" }, [E("div", {}, [E("a", { href: "#inbox", text: (e.name || "—") + (e.excursionTitle ? " · " + e.excursionTitle : "") }), E("div", { class: "s", text: (e.date ? B.fmtDate(e.date) + " · " : "") + (e.guests ? e.guests + " guests · " : "") + ago(e.at) })]), E("span", { class: "badge badge--warn", text: "New" })]); })));
    return c;
  }
  // keep the badge honest while the admin is open
  setInterval(function () { if (document.visibilityState === "visible" && A.token()) load(false).then(function () { if (A.route().id === "inbox") A.render(); }); }, 60000);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") load(true); });
  window.Inbox = { load: load, fresh: fresh, overviewCard: overviewCard, entries: function () { return entries; } };
})(window.Admin);
