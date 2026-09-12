/* ==========================================================================
   CORAVIDA — books.  The accounting a one-vessel charter company needs and
   nothing it does not: bookings, invoices with T-GST, payments received,
   expenses, and the handful of figures that come out of them. No journal,
   no chart of accounts — the accountant gets a CSV.

   Stored as one JSON file in a private GitHub repository (Settings), cached
   in this browser so it opens instantly and survives a bad connection.
   ========================================================================== */
window.Books = (function (A) {
  "use strict";
  var E = A.E, $ = A.$, $$ = A.$$, esc = A.esc, svg = A.svg, toast = A.toast;
  var KEY = "cv:books";
  var CATS = [["fuel", "Fuel"], ["crew", "Crew"], ["marina", "Marina & port"], ["provisions", "Food & drink"], ["maintenance", "Maintenance"], ["equipment", "Equipment"], ["marketing", "Marketing"], ["licences", "Licences & insurance"], ["other", "Other"]];
  var METHODS = [["bank", "Bank transfer"], ["cash", "Cash"], ["card", "Card"], ["other", "Other"]];
  var STATUS = [["enquiry", "Enquiry"], ["confirmed", "Confirmed"], ["completed", "Completed"], ["cancelled", "Cancelled"]];

  /* ---------------------------------------------------------------- data */
  var S = null, sha = null, remote = false, saveT = null, saving = false, lastSaved = null, localOnly = true, failed = "";
  var BRANCH = "main";   // the books repository's own branch, whatever the site's is
  function blank() {
    return { v: 1, settings: { currency: "USD", tgst: 17, prefix: "CV", nextInvoice: 1, nextBooking: 1, bank: "", footer: "Thank you for sailing with Coravida. A fifty percent deposit confirms a booking; the balance is due seven days before departure." },
             bookings: [], invoices: [], payments: [], expenses: [] };
  }
  var today = function () { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  var addDays = function (s, n) { var d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  var round2 = function (n) { return Math.round((Number(n) || 0) * 100) / 100; };
  function money(n, dp) { var cur = (S && S.settings.currency) || "USD"; var v = Number(n) || 0; return (v < 0 ? "−" : "") + cur + " " + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: dp == null ? 2 : dp, maximumFractionDigits: dp == null ? 2 : dp }); }
  function fmtDate(s) { if (!s) return "—"; var d = new Date(s + "T00:00:00"); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  function monthKey(s) { return String(s).slice(0, 7); }
  var stamp = function (o) { o.updated = new Date().toISOString(); return o; };

  function cache() { A.lsSet(KEY, { data: S, sha: sha, dirty: !!saveT || saving || !!failed, at: Date.now() }); }
  function load() {
    var c = A.lsGet(KEY, null);
    S = c && c.data ? c.data : blank(); sha = c ? c.sha : null;
    if (!A.token()) { localOnly = true; return Promise.resolve(); }
    var s = A.settings();
    return A.gh.read(s.booksRepo, s.booksPath, BRANCH).then(function (r) {
      localOnly = false; remote = true;
      if (r.missing) { sha = null; return save(true); }   // first run: create the file
      var R = JSON.parse(r.text);
      S = (c && c.dirty) ? merge(R, S) : R; sha = r.sha; lastSaved = new Date();
      if (c && c.dirty) return save(true);
      cache();
    }).catch(function (e) { localOnly = true; toast("Books: " + e.message + " Working on this device only.", "err"); });
  }
  /* union by id, the newer record wins — so two devices can both add things */
  function merge(a, b) {
    var out = JSON.parse(JSON.stringify(a)); out.settings = Object.assign({}, a.settings, b.settings);
    ["bookings", "invoices", "payments", "expenses"].forEach(function (k) {
      var by = {}; (a[k] || []).forEach(function (x) { by[x.id] = x; });
      (b[k] || []).forEach(function (x) { if (!by[x.id] || (x.updated || "") > (by[x.id].updated || "")) by[x.id] = x; });
      out[k] = Object.keys(by).map(function (i) { return by[i]; });
    });
    out.settings.nextInvoice = Math.max(a.settings.nextInvoice || 1, b.settings.nextInvoice || 1);
    out.settings.nextBooking = Math.max(a.settings.nextBooking || 1, b.settings.nextBooking || 1);
    return out;
  }
  function save(now) {
    cache();
    clearTimeout(saveT); saveT = null;
    if (localOnly) { drawSync(); return Promise.resolve(); }
    if (!now) { saveT = setTimeout(function () { save(true); }, 1200); drawSync(); return Promise.resolve(); }
    var s = A.settings(); saving = true; drawSync();
    return A.gh.putText(s.booksRepo, s.booksPath, JSON.stringify(S, null, 2) + "\n", "Books: " + new Date().toISOString().slice(0, 16).replace("T", " "), sha, BRANCH)
      .then(function (j) { sha = j.content.sha; saving = false; failed = ""; lastSaved = new Date(); cache(); drawSync(); })
      .catch(function (e) {
        saving = false;
        if (e.status === 409 || e.status === 422) {   // someone else saved: merge and retry once
          return A.gh.read(s.booksRepo, s.booksPath, BRANCH).then(function (r) { S = merge(JSON.parse(r.text), S); sha = r.sha; A.render(); return save(true); });
        }
        failed = e.message; toast("Books did not save: " + e.message, "err"); cache(); drawSync();
      });
  }
  function drawSync() {
    $$(".booksSync").forEach(function (n) {
      n.className = "booksSync badge " + (localOnly ? "badge--warn" : failed ? "badge--bad" : saving || saveT ? "badge--info" : "badge--ok");
      n.textContent = localOnly ? "On this device only" : failed ? "Not saved" : saving ? "Saving…" : saveT ? "Unsaved" : lastSaved ? "Saved " + lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Synced";
      n.title = localOnly ? "Add a GitHub token in Settings to keep the books in your private repository." : failed || "";
    });
  }
  function syncBadge() { var b = E("span", { class: "booksSync badge" }); setTimeout(drawSync, 0); return b; }

  /* ---------------------------------------------------------------- derived */
  var byId = function (arr, id) { return (arr || []).filter(function (x) { return x.id === id; })[0]; };
  function bookingTotal(b) { return round2((Number(b.price) || 0) + (b.addons || []).reduce(function (t, a) { return t + (Number(a.p) || 0); }, 0)); }
  function invTotals(inv) {
    var sub = round2((inv.lines || []).reduce(function (t, l) { return t + (Number(l.qty) || 0) * (Number(l.unit) || 0); }, 0));
    var tax = round2(sub * (Number(inv.tgst) || 0) / 100), total = round2(sub + tax);
    var paid = round2(S.payments.filter(function (p) { return p.invoiceId === inv.id; }).reduce(function (t, p) { return t + (Number(p.amount) || 0); }, 0));
    return { sub: sub, tax: tax, total: total, paid: paid, balance: round2(total - paid) };
  }
  function invStatus(inv) {
    var t = invTotals(inv);
    if (t.total > 0 && t.balance <= 0) return ["paid", "Paid", "ok"];
    if (t.paid > 0) return ["part", "Part paid", "info"];
    if (inv.due && inv.due < today()) return ["overdue", "Overdue", "bad"];
    return ["unpaid", "Unpaid", "warn"];
  }
  function content() { return A.C.draft || A.C.baseline || { voyages: [], addons: [], rates: { pax: 7, currency: "USD" } }; }
  function summary() {
    var t = today(), m = monthKey(t);
    var upcoming = S.bookings.filter(function (b) { return b.date >= t && b.status !== "cancelled" && b.status !== "completed"; }).length;
    var out = 0, unpaid = 0;
    S.invoices.forEach(function (i) { var x = invTotals(i); if (x.balance > 0) { out += x.balance; unpaid++; } });
    var rev = S.invoices.filter(function (i) { return monthKey(i.date) === m; }).reduce(function (s, i) { return s + invTotals(i).sub; }, 0);
    var exp = S.expenses.filter(function (e) { return monthKey(e.date) === m; }).reduce(function (s, e) { return s + (Number(e.amount) || 0); }, 0);
    return { upcoming: upcoming, outstanding: round2(out), unpaid: unpaid, month: { revenue: round2(rev), expenses: round2(exp) } };
  }

  /* ---------------------------------------------------------------- ui bits */
  function fld(label, obj, key, opts) {
    opts = opts || {};
    var id = "b-" + Math.random().toString(36).slice(2, 8), wrap = E("div", { class: "field" }), lab = E("label", { for: id, text: label });
    var input;
    if (opts.type === "select") { input = E("select", { id: id }); (opts.options || []).forEach(function (o) { input.appendChild(E("option", { value: o[0], text: o[1], selected: String(obj[key]) === String(o[0]) })); }); }
    else if (opts.type === "textarea") { input = E("textarea", { id: id, placeholder: opts.placeholder || "" }); input.value = obj[key] == null ? "" : obj[key]; }
    else { input = E("input", { id: id, type: opts.type || "text", placeholder: opts.placeholder || "", step: opts.step, min: opts.min, autocomplete: "off", inputmode: opts.type === "number" ? "decimal" : null }); input.value = obj[key] == null ? "" : obj[key]; }
    input.addEventListener("input", function () { obj[key] = opts.type === "number" ? (input.value === "" ? null : Number(input.value)) : input.value; if (opts.onchange) opts.onchange(obj[key], input); });
    input.addEventListener("change", function () { if (opts.onchange) opts.onchange(obj[key], input); });
    wrap.appendChild(lab); wrap.appendChild(opts.prefix ? E("div", { class: "money-in" }, [E("i", { text: opts.prefix }), input]) : input);
    if (opts.help) wrap.appendChild(E("p", { class: "field__help", text: opts.help }));
    wrap._input = input; wrap._required = !!opts.required;
    return wrap;
  }
  function validate(node) {
    var ok = true;
    $$(".field", node).forEach(function (w) { if (!w._required) return; var v = String(w._input.value || "").trim(); w.classList.toggle("is-bad", !v); if (!v) ok = false; });
    if (!ok) toast("Fill in the highlighted fields.", "err");
    return ok;
  }
  function badge(st) { return E("span", { class: "badge badge--" + st[2], text: st[1] }); }
  var bookingBadge = function (b) { return badge({ enquiry: ["", "Enquiry", "info"], confirmed: ["", "Confirmed", "ok"], completed: ["", "Completed", "navy"], cancelled: ["", "Cancelled", "bad"] }[b.status] || ["", b.status, ""]); };
  function table(cols, rows, onRow, wide) {
    var t = E("table", { class: "tbl" }), tr = E("tr");
    cols.forEach(function (c) { tr.appendChild(E("th", { text: c[0], class: c[1] || "" })); });
    t.appendChild(E("thead", {}, [tr]));
    var tb = E("tbody");
    rows.forEach(function (r) {
      var row = E("tr", { class: onRow ? "is-link" : "" });
      r.cells.forEach(function (c, i) { var td = E("td", { class: cols[i][1] || "" }); if (typeof c === "string") td.textContent = c; else if (c) td.appendChild(c); row.appendChild(td); });
      if (onRow) row.addEventListener("click", function (e) { if (e.target.closest("button,a")) return; onRow(r.item); });
      tb.appendChild(row);
    });
    t.appendChild(tb);
    return E("div", { class: "tblw" + (wide ? " tblw--wide" : "") }, [t]);
  }
  function empty(h, p, btn) { return E("div", { class: "empty" }, [E("h3", { text: h }), E("p", { text: p }), btn || null]); }
  function seg(opts, cur, on) { var s = E("div", { class: "seg" }); opts.forEach(function (o) { s.appendChild(E("button", { type: "button", class: o[0] === cur ? "on" : "", text: o[1], onclick: function () { on(o[0]); } })); }); return s; }
  function head(host, title, p, extra) { host.appendChild(E("div", { class: "pagehead" }, [E("div", {}, [E("h2", { text: title }), p ? E("p", { text: p }) : null]), E("div", { class: "acts" }, [syncBadge(), extra || null])])); }
  function csv(name, rows) {
    var text = rows.map(function (r) { return r.map(function (c) { c = String(c == null ? "" : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(","); }).join("\n");
    var a = E("a", { href: "data:text/csv;charset=utf-8," + encodeURIComponent("﻿" + text), download: name }); document.body.appendChild(a); a.click(); a.remove();
  }
  var custLine = function (c) { return c ? [c.name, c.email, c.phone].filter(Boolean).join(" · ") : ""; };

  /* ---------------------------------------------------------------- bookings */
  function bookingForm(b) {
    var cv = content(), R = cv.rates || { pax: 7, currency: "USD" };
    b.customer = b.customer || {}; b.addons = b.addons || [];
    var node = E("div", { class: "fg" });
    var priceF;
    function autoPrice() {
      var v = (cv.voyages || []).filter(function (x) { return x.slug === b.excursion; })[0];
      b.excursionTitle = v ? v.title : "Custom charter";
      var pkg = (cv.voyages || []).map(function (x) { return x.price; });
      if (v && Number(b.guests) === Number(R.pax) && v.price != null) { b.price = v.price; priceF._input.value = v.price; }
      else if (b.price != null && pkg.indexOf(Number(b.price)) > -1) { b.price = null; priceF._input.value = ""; }   // the package price only holds at the quoted party size
    }
    node.appendChild(E("div", { class: "fg fg2" }, [
      fld("Customer name", b.customer, "name", { required: true }), fld("Email", b.customer, "email", { type: "email" }),
      fld("Telephone / WhatsApp", b.customer, "phone"), fld("Staying at", b.customer, "staying", { placeholder: "Resort, guesthouse or hotel" })
    ]));
    node.appendChild(E("div", { class: "fg fg3" }, [
      fld("Date", b, "date", { type: "date", required: true }),
      fld("Excursion", b, "excursion", { type: "select", options: (cv.voyages || []).map(function (v) { return [v.slug, v.title]; }).concat([["custom", "Custom charter"]]), onchange: autoPrice }),
      fld("Guests", b, "guests", { type: "number", min: 1, step: 1, required: true, onchange: autoPrice })
    ]));
    priceF = fld("Charter price", b, "price", { type: "number", min: 0, prefix: R.currency, placeholder: "quote by hand", help: "Fills in automatically for a party of " + R.pax + "; any other number is quoted by hand." });
    node.appendChild(E("div", { class: "fg fg2" }, [priceF, fld("Status", b, "status", { type: "select", options: STATUS })]));
    var addons = E("div", { class: "field" }, [E("label", { text: "Add-ons" })]);
    (cv.addons || []).forEach(function (a) {
      var on = b.addons.some(function (x) { return x.id === a.id; });
      var inp = E("input", { type: "checkbox", checked: on });
      inp.addEventListener("change", function () { b.addons = b.addons.filter(function (x) { return x.id !== a.id; }); if (inp.checked) b.addons.push({ id: a.id, t: a.t, p: a.p }); });
      addons.appendChild(E("label", { class: "check" }, [inp, a.t + " — " + money(a.p, 0)]));
    });
    node.appendChild(addons);
    node.appendChild(fld("Notes", b, "notes", { type: "textarea", placeholder: "Diet, occasion, pickup, anything the crew should know" }));
    return node;
  }
  function newBooking() {
    var cv = content(), R = cv.rates || { pax: 7 };
    var v0 = (cv.voyages || [])[0];
    var b = { id: A.uid(), ref: "", status: "enquiry", date: today(), excursion: v0 ? v0.slug : "custom", excursionTitle: v0 ? v0.title : "Custom charter", guests: R.pax, price: v0 ? v0.price : null, customer: {}, addons: [], notes: "", created: new Date().toISOString() };
    var node = bookingForm(b);
    A.dialog({ title: "New booking", node: node, wide: true, actions: [["Cancel", "btn--ghost", null], ["Save booking", "btn--go", "ok"]], validate: function () { return validate(node); } }).then(function (r) {
      if (r !== "ok") return;
      b.ref = "B-" + String(S.settings.nextBooking++).padStart(4, "0");
      S.bookings.push(stamp(b)); save(); A.go("bookings/" + b.id); toast("Booking " + b.ref + " saved.", "ok");
    });
  }
  function editBooking(b) {
    var copy = JSON.parse(JSON.stringify(b)), node = bookingForm(copy);
    A.dialog({ title: "Edit " + b.ref, node: node, wide: true, actions: [["Cancel", "btn--ghost", null], ["Save", "btn--go", "ok"]], validate: function () { return validate(node); } }).then(function (r) {
      if (r !== "ok") return;
      Object.assign(b, copy); stamp(b); save(); A.render(); toast("Saved.", "ok");
    });
  }
  A.register({ id: "bookings", group: "Books", label: "Bookings", icon: "cal", badge: function () { var n = S ? S.bookings.filter(function (b) { return b.status === "enquiry" && b.date >= today(); }).length : 0; return n || ""; }, render: function (host, arg) {
    if (arg) { var b = byId(S.bookings, arg); if (!b) { host.appendChild(E("div", { class: "note note--bad", html: "No such booking. <a href='#bookings'>Back.</a>" })); return; } return showBooking(host, b); }
    var view = A.lsGet("cv:books:bk", "upcoming");
    head(host, "Bookings", "Every enquiry and charter. Confirm it, invoice it, and mark it done.", E("button", { class: "btn btn--go", type: "button", text: "New booking", onclick: newBooking }));
    var card = E("div", { class: "card" });
    var q = "", search = E("input", { placeholder: "Search name, email, reference…" });
    var body = E("div");
    function draw() {
      body.innerHTML = "";
      var t = today();
      var rows = S.bookings.filter(function (b) {
        if (view === "upcoming") return b.date >= t && b.status !== "cancelled";
        if (view === "past") return b.date < t || b.status === "completed";
        if (view === "cancelled") return b.status === "cancelled";
        return true;
      }).filter(function (b) { if (!q) return true; var s = (b.ref + " " + custLine(b.customer) + " " + (b.excursionTitle || "")).toLowerCase(); return s.indexOf(q) > -1; })
        .sort(function (a, b) { return view === "past" ? (b.date < a.date ? -1 : 1) : (a.date < b.date ? -1 : 1); });
      if (!rows.length) return body.appendChild(empty("No bookings here", view === "upcoming" ? "New enquiries arrive by WhatsApp or email — add them here to track them." : "Nothing in this view.", view === "upcoming" ? E("button", { class: "btn btn--go", type: "button", text: "New booking", onclick: newBooking }) : null));
      body.appendChild(table([["Date"], ["Ref"], ["Customer"], ["Excursion"], ["Guests", "r"], ["Total", "r"], ["Status"], ["Invoice"]], rows.map(function (b) {
        var inv = S.invoices.filter(function (i) { return i.bookingId === b.id; });
        return { item: b, cells: [fmtDate(b.date), E("span", { class: "s", text: b.ref }), E("span", { class: "t", text: b.customer.name || "—" }), b.excursionTitle || "—", String(b.guests || ""), b.price == null ? E("span", { class: "mute", text: "to quote" }) : money(bookingTotal(b), 0), bookingBadge(b),
          inv.length ? E("span", {}, inv.map(function (i) { return E("a", { href: "#invoices/" + i.id, text: i.no, style: "margin-right:.4rem" }); })) : E("span", { class: "mute", text: "—" })] };
      }), function (b) { A.go("bookings/" + b.id); }, true));
    }
    search.addEventListener("input", function () { q = search.value.trim().toLowerCase(); draw(); });
    card.appendChild(E("div", { class: "filters" }, [seg([["upcoming", "Upcoming"], ["past", "Past"], ["all", "All"], ["cancelled", "Cancelled"]], view, function (v) { view = v; A.lsSet("cv:books:bk", v); A.render(); }), E("div", { class: "search" }, [search])]));
    card.appendChild(body); draw(); host.appendChild(card);
  } });
  function showBooking(host, b) {
    host.appendChild(E("div", { class: "crumb", html: "<a href='#bookings'>Bookings</a> › " + esc(b.ref) }));
    var invs = S.invoices.filter(function (i) { return i.bookingId === b.id; });
    var acts = E("div", { class: "acts" }, [syncBadge(),
      E("button", { class: "btn btn--ghost", type: "button", text: "Edit", onclick: function () { editBooking(b); } }),
      b.status === "enquiry" ? E("button", { class: "btn", type: "button", text: "Confirm", onclick: function () { b.status = "confirmed"; stamp(b); save(); A.render(); } }) : null,
      b.status === "confirmed" && b.date <= today() ? E("button", { class: "btn", type: "button", text: "Mark completed", onclick: function () { b.status = "completed"; stamp(b); save(); A.render(); } }) : null,
      E("button", { class: "btn btn--go", type: "button", text: "Create invoice", onclick: function () { newInvoice(b); } }),
      b.status !== "cancelled" ? E("button", { class: "btn btn--bad btn--sm", type: "button", text: "Cancel booking", onclick: function () { A.confirm("Cancel " + b.ref + "?", "The booking stays in the books, marked cancelled.", "Cancel booking", true).then(function (ok) { if (ok) { b.status = "cancelled"; stamp(b); save(); A.render(); } }); } }) : null
    ]);
    host.appendChild(E("div", { class: "pagehead" }, [E("div", {}, [E("h2", {}, [b.customer.name || "Booking", " ", bookingBadge(b)]), E("p", { text: (b.excursionTitle || "Custom charter") + " · " + fmtDate(b.date) + " · " + b.guests + " guests" })]), acts]));
    var g = E("div", { class: "grid2" });
    var dl = function (pairs) { var d = E("dl", { class: "tot", style: "max-width:none;justify-content:start;grid-template-columns:140px 1fr" }); pairs.forEach(function (p) { if (p[1] == null || p[1] === "") return; d.appendChild(E("dt", { text: p[0] })); var dd = E("dd", { style: "text-align:left" }); if (typeof p[1] === "string") dd.textContent = p[1]; else dd.appendChild(p[1]); d.appendChild(dd); }); return d; };
    g.appendChild(E("div", { class: "card" }, [E("h3", { text: "Customer" }), dl([["Name", b.customer.name], ["Email", b.customer.email ? E("a", { href: "mailto:" + b.customer.email, text: b.customer.email }) : null], ["Telephone", b.customer.phone ? E("a", { href: "https://wa.me/" + String(b.customer.phone).replace(/[^\d]/g, ""), target: "_blank", rel: "noopener", text: b.customer.phone }) : null], ["Staying at", b.customer.staying], ["Notes", b.notes]])]));
    var lines = [["Charter", b.price == null ? "to quote" : money(b.price, 0)]].concat((b.addons || []).map(function (a) { return [a.t, money(a.p, 0)]; }));
    var tot = E("dl", { class: "tot", style: "margin-left:0;max-width:none" });
    lines.forEach(function (l) { tot.appendChild(E("dt", { text: l[0] })); tot.appendChild(E("dd", { text: l[1] })); });
    tot.appendChild(E("dt", { class: "big", text: "Total, before T-GST" })); tot.appendChild(E("dd", { class: "big", text: money(bookingTotal(b), 0) }));
    g.appendChild(E("div", { class: "card" }, [E("h3", { text: "Price" }), tot,
      invs.length ? E("div", { class: "list" }, invs.map(function (i) { var x = invTotals(i), st = invStatus(i); return E("div", { class: "list__i" }, [E("div", {}, [E("a", { href: "#invoices/" + i.id, text: i.no }), E("div", { class: "s", text: fmtDate(i.date) + " · " + money(x.total) })]), badge(st)]); })) : E("p", { class: "small mute", text: "Not invoiced yet." })]));
    host.appendChild(g);
  }

  /* ---------------------------------------------------------------- invoices */
  function nextNo() { return (S.settings.prefix || "CV") + "-" + String(S.settings.nextInvoice).padStart(4, "0"); }
  function newInvoice(b) {
    var inv = { id: A.uid(), no: "", bookingId: b ? b.id : null, date: today(), due: b ? (b.date > today() ? (addDays(b.date, -7) > today() ? addDays(b.date, -7) : today()) : addDays(today(), 7)) : addDays(today(), 7),
      customer: b ? JSON.parse(JSON.stringify(b.customer)) : {}, lines: [], tgst: S.settings.tgst, notes: "", created: new Date().toISOString() };
    var mode = { v: "full" };
    function buildLines() {
      if (!b) { inv.lines = inv.lines.length ? inv.lines : [{ d: "", qty: 1, unit: 0 }]; return; }
      var d = [(b.excursionTitle || "Charter"), fmtDate(b.date), b.guests + " guests", (content().brand || {}).vessel].filter(Boolean).join(" · ");
      var total = bookingTotal(b);
      if (mode.v === "deposit") inv.lines = [{ d: "Deposit, 50% — " + d, qty: 1, unit: round2(total / 2) }];
      else if (mode.v === "balance") inv.lines = [{ d: "Balance, 50% — " + d, qty: 1, unit: round2(total / 2) }];
      else inv.lines = [{ d: d, qty: 1, unit: Number(b.price) || 0 }].concat((b.addons || []).map(function (a) { return { d: a.t, qty: 1, unit: Number(a.p) || 0 }; }));
    }
    buildLines();
    var node = E("div", { class: "fg" });
    if (b) node.appendChild(fld("What to invoice", mode, "v", { type: "select", options: [["full", "The full charter — " + money(bookingTotal(b), 0) + " before T-GST"], ["deposit", "Deposit, 50% to confirm"], ["balance", "Balance, the remaining 50%"]], onchange: function () { buildLines(); drawLines(); } }));
    node.appendChild(E("div", { class: "fg fg3" }, [fld("Invoice date", inv, "date", { type: "date", required: true }), fld("Due", inv, "due", { type: "date", required: true }), fld("T-GST %", inv, "tgst", { type: "number", min: 0, step: 0.5 })]));
    if (!b) node.appendChild(E("div", { class: "fg fg2" }, [fld("Customer name", inv.customer, "name", { required: true }), fld("Email", inv.customer, "email", { type: "email" })]));
    var linesBox = E("div", { class: "rows" });
    function drawLines() {
      linesBox.innerHTML = "";
      inv.lines.forEach(function (l, i) {
        linesBox.appendChild(E("div", { class: "row" }, [E("div", { class: "row__body", style: "grid-template-columns:1fr 70px 120px" }, [fld("Description", l, "d", { required: true }), fld("Qty", l, "qty", { type: "number", min: 0, step: 1 }), fld("Unit", l, "unit", { type: "number", min: 0, step: 0.01 })]),
          E("div", { class: "row__tools" }, [A.iconBtn("trash", "Remove line", function () { inv.lines.splice(i, 1); drawLines(); })])]));
      });
      linesBox.appendChild(E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Add a line", onclick: function () { inv.lines.push({ d: "", qty: 1, unit: 0 }); drawLines(); } }));
    }
    drawLines(); node.appendChild(E("div", { class: "field" }, [E("label", { text: "Lines" }), linesBox]));
    node.appendChild(fld("Note on the invoice", inv, "notes", { type: "textarea", placeholder: "Optional" }));
    A.dialog({ title: "New invoice " + nextNo(), node: node, wide: true, actions: [["Cancel", "btn--ghost", null], ["Create", "btn--go", "ok"]], validate: function () { if (!inv.lines.length) { toast("Add at least one line.", "err"); return false; } return validate(node); } }).then(function (r) {
      if (r !== "ok") return;
      inv.no = nextNo(); S.settings.nextInvoice++;
      if (b && b.status === "enquiry") { b.status = "confirmed"; stamp(b); }
      S.invoices.push(stamp(inv)); save(); A.go("invoices/" + inv.id); toast("Invoice " + inv.no + " created.", "ok");
    });
  }
  function recordPayment(inv) {
    var open = S.invoices.filter(function (i) { return invTotals(i).balance > 0; });
    if (!inv && !open.length) return toast("Every invoice is paid.", "ok");
    var p = { id: A.uid(), invoiceId: inv ? inv.id : open[0].id, date: today(), amount: invTotals(inv || open[0]).balance, method: "bank", ref: "" };
    var node = E("div", { class: "fg" });
    var amt;
    node.appendChild(fld("Invoice", p, "invoiceId", { type: "select", options: (inv ? [inv] : open).map(function (i) { return [i.id, i.no + " · " + (i.customer.name || "") + " · " + money(invTotals(i).balance) + " due"]; }), onchange: function (v) { p.amount = invTotals(byId(S.invoices, v)).balance; amt._input.value = p.amount; } }));
    amt = fld("Amount received", p, "amount", { type: "number", min: 0, step: 0.01, required: true, prefix: S.settings.currency });
    node.appendChild(E("div", { class: "fg fg3" }, [fld("Date", p, "date", { type: "date", required: true }), amt, fld("Method", p, "method", { type: "select", options: METHODS })]));
    node.appendChild(fld("Reference", p, "ref", { placeholder: "Transfer reference, receipt number" }));
    A.dialog({ title: "Record a payment", node: node, actions: [["Cancel", "btn--ghost", null], ["Record", "btn--go", "ok"]], validate: function () { return validate(node) && Number(p.amount) > 0; } }).then(function (r) {
      if (r !== "ok") return;
      S.payments.push(stamp(p)); save(); A.render(); toast("Payment recorded.", "ok");
    });
  }
  A.register({ id: "invoices", group: "Books", label: "Invoices", icon: "inv", badge: function () { return S ? (S.invoices.filter(function (i) { return invStatus(i)[0] === "overdue"; }).length || "") : ""; }, render: function (host, arg) {
    if (arg) { var inv = byId(S.invoices, arg); if (!inv) { host.appendChild(E("div", { class: "note note--bad", html: "No such invoice. <a href='#invoices'>Back.</a>" })); return; } return showInvoice(host, inv); }
    var view = A.lsGet("cv:books:inv", "open");
    head(host, "Invoices", "Charter invoices with T-GST. Create one from a booking, or blank.", E("button", { class: "btn btn--go", type: "button", text: "New invoice", onclick: function () { newInvoice(null); } }));
    var card = E("div", { class: "card" });
    var rows = S.invoices.filter(function (i) { var st = invStatus(i)[0]; return view === "all" || (view === "open" ? st !== "paid" : st === view); }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    card.appendChild(E("div", { class: "filters" }, [seg([["open", "Open"], ["overdue", "Overdue"], ["paid", "Paid"], ["all", "All"]], view, function (v) { A.lsSet("cv:books:inv", v); A.render(); }),
      E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Export CSV", onclick: function () { csv("coravida-invoices.csv", [["No", "Date", "Due", "Customer", "Email", "Subtotal", "T-GST", "Total", "Paid", "Balance", "Status"]].concat(S.invoices.map(function (i) { var x = invTotals(i); return [i.no, i.date, i.due, i.customer.name, i.customer.email, x.sub, x.tax, x.total, x.paid, x.balance, invStatus(i)[1]]; }))); } })]));
    card.appendChild(rows.length ? table([["No"], ["Date"], ["Customer"], ["Total", "r"], ["Paid", "r"], ["Balance", "r"], ["Due"], ["Status"]], rows.map(function (i) { var x = invTotals(i); return { item: i, cells: [E("span", { class: "t", text: i.no }), fmtDate(i.date), i.customer.name || "—", money(x.total), money(x.paid), money(x.balance), fmtDate(i.due), badge(invStatus(i))] }; }), function (i) { A.go("invoices/" + i.id); }, true)
      : empty("No invoices " + (view === "all" ? "yet" : "in this view"), "Open a booking and press Create invoice, or start a blank one."));
    host.appendChild(card);
  } });
  function showInvoice(host, inv) {
    var x = invTotals(inv), st = invStatus(inv), cv = content(), B = cv.brand || {}, bk = byId(S.bookings, inv.bookingId);
    host.appendChild(E("div", { class: "crumb noprint", html: "<a href='#invoices'>Invoices</a> › " + esc(inv.no) }));
    host.appendChild(E("div", { class: "pagehead noprint" }, [E("div", {}, [E("h2", {}, [inv.no + " ", badge(st)]), E("p", { text: (inv.customer.name || "") + (bk ? " · booking " + bk.ref : "") })]),
      E("div", { class: "acts" }, [syncBadge(),
        x.balance > 0 ? E("button", { class: "btn btn--go", type: "button", text: "Record payment", onclick: function () { recordPayment(inv); } }) : null,
        E("button", { class: "btn btn--ghost", type: "button", html: svg("print") + " Print / PDF", onclick: function () { window.print(); } }),
        x.paid === 0 ? E("button", { class: "btn btn--bad btn--sm", type: "button", text: "Delete", onclick: function () { A.confirm("Delete " + inv.no + "?", "It has no payments against it. The number will not be reused.", "Delete", true).then(function (ok) { if (ok) { S.invoices = S.invoices.filter(function (i) { return i.id !== inv.id; }); save(); A.go("invoices"); } }); } }) : null
      ])]));
    var paper = E("div", { class: "paper" });
    paper.appendChild(E("div", { class: "paper__top" }, [
      E("div", { class: "paper__brand" }, [E("img", { src: "../assets/img/logo-mark.webp", alt: "" }), E("div", {}, [E("strong", { text: B.name || "Coravida" }), E("span", { text: (B.legal || "") + (B.address ? " · " + B.address.join(", ") : "") }), E("br"), E("span", { text: [B.phone, B.email].filter(Boolean).join(" · ") })])]),
      E("div", { class: "paper__meta" }, [E("strong", { text: "Invoice " + inv.no }), "Date " + fmtDate(inv.date), E("br"), "Due " + fmtDate(inv.due)])
    ]));
    paper.appendChild(E("div", { class: "paper__cols" }, [
      E("div", {}, [E("div", { class: "k", text: "Invoiced to" }), E("div", { text: inv.customer.name || "—" }), inv.customer.email ? E("div", { class: "body", text: inv.customer.email }) : null, inv.customer.phone ? E("div", { class: "body", text: inv.customer.phone }) : null, inv.customer.staying ? E("div", { class: "body", text: inv.customer.staying }) : null]),
      E("div", {}, [E("div", { class: "k", text: "Charter" }), bk ? E("div", { text: (bk.excursionTitle || "Charter") + " · " + fmtDate(bk.date) }) : E("div", { text: "—" }), bk ? E("div", { class: "body", text: bk.guests + " guests · " + (B.vessel || "") }) : null])
    ]));
    var t = E("table", { class: "tbl" }, [E("thead", {}, [E("tr", {}, [E("th", { text: "Description" }), E("th", { text: "Qty", class: "r" }), E("th", { text: "Unit", class: "r" }), E("th", { text: "Amount", class: "r" })])])]);
    var tb = E("tbody");
    inv.lines.forEach(function (l) { tb.appendChild(E("tr", {}, [E("td", { text: l.d }), E("td", { class: "r", text: String(l.qty) }), E("td", { class: "r", text: money(l.unit) }), E("td", { class: "r", text: money(round2(l.qty * l.unit)) })])); });
    t.appendChild(tb); paper.appendChild(t);
    var tot = E("dl", { class: "tot", style: "margin-top:1.2rem" });
    [["Subtotal", money(x.sub)], ["T-GST " + inv.tgst + "%", money(x.tax)], ["Total", money(x.total), "big"]].concat(x.paid ? [["Paid", "− " + money(x.paid)], ["Balance due", money(x.balance), "big"]] : []).forEach(function (r) { tot.appendChild(E("dt", { class: r[2] || "", text: r[0] })); tot.appendChild(E("dd", { class: r[2] || "", text: r[1] })); });
    paper.appendChild(tot);
    var foot = [inv.notes, S.settings.bank ? "Payment by bank transfer:\n" + S.settings.bank : "", S.settings.footer].filter(Boolean).join("\n\n");
    if (foot) paper.appendChild(E("div", { class: "paper__foot", text: foot }));
    host.appendChild(paper);
    var pays = S.payments.filter(function (p) { return p.invoiceId === inv.id; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (pays.length) host.appendChild(E("div", { class: "card noprint" }, [E("h3", { text: "Payments" }), table([["Date"], ["Method"], ["Reference"], ["Amount", "r"], [""]], pays.map(function (p) { return { item: p, cells: [fmtDate(p.date), (METHODS.filter(function (m) { return m[0] === p.method; })[0] || [])[1] || p.method, p.ref || "—", money(p.amount), A.iconBtn("trash", "Remove payment", function () { A.confirm("Remove this payment?", money(p.amount) + " on " + fmtDate(p.date) + ".", "Remove", true).then(function (ok) { if (ok) { S.payments = S.payments.filter(function (q) { return q.id !== p.id; }); save(); A.render(); } }); })] }; }))]));
  }

  /* ---------------------------------------------------------------- payments */
  A.register({ id: "payments", group: "Books", label: "Payments", icon: "cash", render: function (host) {
    head(host, "Payments received", "Money in, against invoices.", E("button", { class: "btn btn--go", type: "button", text: "Record payment", onclick: function () { recordPayment(null); } }));
    var rows = S.payments.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var card = E("div", { class: "card" });
    card.appendChild(E("div", { class: "filters" }, [E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Export CSV", onclick: function () { csv("coravida-payments.csv", [["Date", "Invoice", "Customer", "Method", "Reference", "Amount"]].concat(S.payments.map(function (p) { var i = byId(S.invoices, p.invoiceId) || {}; return [p.date, i.no, i.customer && i.customer.name, p.method, p.ref, p.amount]; }))); } })]));
    card.appendChild(rows.length ? table([["Date"], ["Invoice"], ["Customer"], ["Method"], ["Reference"], ["Amount", "r"]], rows.map(function (p) { var i = byId(S.invoices, p.invoiceId) || { no: "?", customer: {} }; return { item: p, cells: [fmtDate(p.date), E("a", { href: "#invoices/" + i.id, text: i.no }), i.customer.name || "—", (METHODS.filter(function (m) { return m[0] === p.method; })[0] || [])[1] || p.method, p.ref || "—", money(p.amount)] }; }), null, true)
      : empty("Nothing received yet", "Record a payment from an invoice, or here."));
    host.appendChild(card);
  } });

  /* ---------------------------------------------------------------- expenses */
  function expenseForm(x, title, onok) {
    var node = E("div", { class: "fg" });
    node.appendChild(E("div", { class: "fg fg3" }, [fld("Date", x, "date", { type: "date", required: true }), fld("Category", x, "category", { type: "select", options: CATS }), fld("Amount", x, "amount", { type: "number", min: 0, step: 0.01, required: true, prefix: S.settings.currency })]));
    node.appendChild(E("div", { class: "fg fg2" }, [fld("What for", x, "desc", { required: true, placeholder: "Diesel, 400 L at Hulhumalé" }), fld("Paid from", x, "paidBy", { type: "select", options: [["bank", "Bank"], ["cash", "Cash"], ["card", "Card"]] })]));
    A.dialog({ title: title, node: node, actions: [["Cancel", "btn--ghost", null], ["Save", "btn--go", "ok"]], validate: function () { return validate(node) && Number(x.amount) > 0; } }).then(function (r) { if (r === "ok") onok(); });
  }
  A.register({ id: "expenses", group: "Books", label: "Expenses", icon: "card", render: function (host) {
    var m = A.lsGet("cv:books:exm", "all");
    head(host, "Expenses", "Fuel, crew, marina, food, maintenance — what it costs to run the day.", E("button", { class: "btn btn--go", type: "button", text: "Add expense", onclick: function () { var x = { id: A.uid(), date: today(), category: "fuel", amount: null, desc: "", paidBy: "bank" }; expenseForm(x, "Add expense", function () { S.expenses.push(stamp(x)); save(); A.render(); }); } }));
    var months = {}; S.expenses.forEach(function (e) { months[monthKey(e.date)] = 1; });
    var mopts = [["all", "All months"]].concat(Object.keys(months).sort().reverse().map(function (k) { return [k, new Date(k + "-01T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" })]; }));
    var sel = E("select", {}); mopts.forEach(function (o) { sel.appendChild(E("option", { value: o[0], text: o[1], selected: o[0] === m })); });
    sel.addEventListener("change", function () { A.lsSet("cv:books:exm", sel.value); A.render(); });
    var rows = S.expenses.filter(function (e) { return m === "all" || monthKey(e.date) === m; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var total = rows.reduce(function (t, e) { return t + (Number(e.amount) || 0); }, 0);
    var card = E("div", { class: "card" });
    card.appendChild(E("div", { class: "filters" }, [E("div", { class: "field", style: "min-width:200px" }, [sel]), E("span", { class: "badge", text: "Total " + money(total) }),
      E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Export CSV", onclick: function () { csv("coravida-expenses.csv", [["Date", "Category", "Description", "Paid from", "Amount"]].concat(S.expenses.map(function (e) { return [e.date, e.category, e.desc, e.paidBy, e.amount]; }))); } })]));
    card.appendChild(rows.length ? table([["Date"], ["Category"], ["What for"], ["Paid from"], ["Amount", "r"], [""]], rows.map(function (e) { return { item: e, cells: [fmtDate(e.date), (CATS.filter(function (c) { return c[0] === e.category; })[0] || [])[1] || e.category, E("span", { class: "t", text: e.desc }), e.paidBy, money(e.amount),
      E("span", { class: "acts" }, [A.iconBtn("chev", "Edit", function () { var c = JSON.parse(JSON.stringify(e)); expenseForm(c, "Edit expense", function () { Object.assign(e, c); stamp(e); save(); A.render(); }); }), A.iconBtn("trash", "Remove", function () { A.confirm("Remove this expense?", e.desc + " — " + money(e.amount), "Remove", true).then(function (ok) { if (ok) { S.expenses = S.expenses.filter(function (q) { return q.id !== e.id; }); save(); A.render(); } }); })])] }; }), null, true)
      : empty("No expenses " + (m === "all" ? "yet" : "this month"), "Add fuel, crew and marina costs as they happen and the reports do the rest."));
    host.appendChild(card);
  } });

  /* ---------------------------------------------------------------- reports */
  A.register({ id: "reports", group: "Books", label: "Reports", icon: "chart", render: function (host) {
    var per = A.lsGet("cv:books:per", "month"), t = today(), y = t.slice(0, 4), m = t.slice(0, 7);
    var lm = new Date(t.slice(0, 7) + "-01T00:00:00"); lm.setMonth(lm.getMonth() - 1); var lmk = lm.toISOString().slice(0, 7);
    var inR = function (d) { return per === "all" || (per === "month" ? monthKey(d) === m : per === "last" ? monthKey(d) === lmk : d.slice(0, 4) === y); };
    var inv = S.invoices.filter(function (i) { return inR(i.date); }), pay = S.payments.filter(function (p) { return inR(p.date); }), exp = S.expenses.filter(function (e) { return inR(e.date); });
    var sub = inv.reduce(function (s, i) { return s + invTotals(i).sub; }, 0), tax = inv.reduce(function (s, i) { return s + invTotals(i).tax; }, 0);
    var rec = pay.reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0), spent = exp.reduce(function (s, e) { return s + (Number(e.amount) || 0); }, 0);
    var out = S.invoices.reduce(function (s, i) { return s + Math.max(0, invTotals(i).balance); }, 0);
    head(host, "Reports", "The figures that matter, for the period you choose. Everything is before T-GST unless it says otherwise.", seg([["month", "This month"], ["last", "Last month"], ["year", "This year"], ["all", "All time"]], per, function (v) { A.lsSet("cv:books:per", v); A.render(); }));
    var k = E("div", { class: "kpis" });
    k.appendChild(A.kpi("Invoiced", money(sub, 0), inv.length + " invoice" + (inv.length === 1 ? "" : "s")));
    k.appendChild(A.kpi("T-GST collected", money(tax, 0), "to remit to MIRA"));
    k.appendChild(A.kpi("Received", money(rec, 0), pay.length + " payment" + (pay.length === 1 ? "" : "s")));
    k.appendChild(A.kpi("Expenses", money(spent, 0), exp.length + " item" + (exp.length === 1 ? "" : "s")));
    k.appendChild(A.kpi("Net", money(sub - spent, 0), "invoiced less expenses"));
    k.appendChild(A.kpi("Outstanding now", money(out, 0), "across all open invoices"));
    host.appendChild(k);
    // twelve months, revenue vs expenses
    var months = [], d = new Date(t.slice(0, 7) + "-01T00:00:00"); d.setMonth(d.getMonth() - 11);
    for (var i = 0; i < 12; i++) { months.push(d.toISOString().slice(0, 7)); d.setMonth(d.getMonth() + 1); }
    var series = months.map(function (mk) { return { k: mk, rev: S.invoices.filter(function (x) { return monthKey(x.date) === mk; }).reduce(function (s, x) { return s + invTotals(x).sub; }, 0), exp: S.expenses.filter(function (x) { return monthKey(x.date) === mk; }).reduce(function (s, x) { return s + (Number(x.amount) || 0); }, 0) }; });
    var max = Math.max(1, Math.max.apply(null, series.map(function (s) { return Math.max(s.rev, s.exp); })));
    var bars = E("div", { class: "bars" });
    series.forEach(function (s) { bars.appendChild(E("div", { class: "bar", title: s.k + " · invoiced " + money(s.rev, 0) + " · expenses " + money(s.exp, 0) }, [E("i", { style: "height:" + (s.rev / max * 100) + "%" }), E("i", { class: "x", style: "height:" + (s.exp / max * 100) + "%" }), E("span", { text: new Date(s.k + "-01T00:00:00").toLocaleDateString("en-GB", { month: "short" }) })])); });
    host.appendChild(E("div", { class: "card" }, [E("h3", { text: "Twelve months" }), bars, E("div", { class: "legend", html: "<span><i></i>Invoiced</span><span><i class='x'></i>Expenses</span>" })]));
    var g = E("div", { class: "grid2" });
    var byCat = {}; exp.forEach(function (e) { byCat[e.category] = (byCat[e.category] || 0) + (Number(e.amount) || 0); });
    var catRows = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; }).map(function (c) { return { item: c, cells: [(CATS.filter(function (x) { return x[0] === c; })[0] || [c])[1], money(byCat[c]), spent ? Math.round(byCat[c] / spent * 100) + "%" : "—"] }; });
    g.appendChild(E("div", { class: "card" }, [E("h3", { text: "Expenses by category" }), catRows.length ? table([["Category"], ["Amount", "r"], ["Share", "r"]], catRows) : E("p", { class: "small mute", text: "No expenses in this period." })]));
    var byEx = {}; S.bookings.filter(function (b) { return inR(b.date) && b.status !== "cancelled"; }).forEach(function (b) { var key = b.excursionTitle || "Custom"; byEx[key] = byEx[key] || { n: 0, v: 0 }; byEx[key].n++; byEx[key].v += bookingTotal(b); });
    var exRows = Object.keys(byEx).sort(function (a, b) { return byEx[b].v - byEx[a].v; }).map(function (k) { return { item: k, cells: [k, String(byEx[k].n), money(byEx[k].v, 0)] }; });
    g.appendChild(E("div", { class: "card" }, [E("h3", { text: "Charters by excursion" }), exRows.length ? table([["Excursion"], ["Charters", "r"], ["Value", "r"]], exRows) : E("p", { class: "small mute", text: "No charters in this period." })]));
    host.appendChild(g);
  } });

  /* ---------------------------------------------------------------- overview + settings cards */
  function overviewCard() {
    var t = today();
    var next = S.bookings.filter(function (b) { return b.date >= t && b.status !== "cancelled" && b.status !== "completed"; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }).slice(0, 6);
    var card = E("div", { class: "card" }, [E("div", { class: "card__h" }, [E("div", {}, [E("h2", { text: "Next charters" }), E("p", { text: localOnly ? "Books are on this device only until a token is added." : "Kept in your private books repository." })]), E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "New booking", onclick: newBooking })])]);
    if (!next.length) card.appendChild(E("p", { class: "small mute", text: "Nothing booked from today." }));
    else card.appendChild(E("div", { class: "list" }, next.map(function (b) { return E("div", { class: "list__i" }, [E("div", {}, [E("a", { href: "#bookings/" + b.id, text: fmtDate(b.date) + " · " + (b.customer.name || "—") }), E("div", { class: "s", text: (b.excursionTitle || "Custom") + " · " + b.guests + " guests" })]), bookingBadge(b)]); })));
    var over = S.invoices.filter(function (i) { return invStatus(i)[0] === "overdue"; });
    if (over.length) card.appendChild(E("div", { class: "note note--warn", html: over.length + " overdue invoice" + (over.length > 1 ? "s" : "") + " — <a href='#invoices'>see them</a>." }));
    return card;
  }
  function settingsCard() {
    var st = S.settings;
    var card = E("div", { class: "card" }, [E("div", { class: "card__h" }, [E("div", {}, [E("h2", { text: "Books" }), E("p", { text: "Tax, numbering and what prints on an invoice." })]), syncBadge()])]);
    card.appendChild(E("div", { class: "fg fg3" }, [fld("T-GST %", st, "tgst", { type: "number", min: 0, step: 0.5, help: "Tourism GST, 17% since July 2025." }), fld("Currency", st, "currency", { type: "select", options: [["USD", "USD"], ["EUR", "EUR"], ["MVR", "MVR"]] }), fld("Invoice prefix", st, "prefix")]));
    card.appendChild(E("div", { class: "fg fg2" }, [fld("Next invoice number", st, "nextInvoice", { type: "number", min: 1, step: 1 }), fld("Next booking number", st, "nextBooking", { type: "number", min: 1, step: 1 })]));
    card.appendChild(fld("Bank details (printed on invoices)", st, "bank", { type: "textarea", placeholder: "Bank of Maldives\nCoravida Marine Services Pvt Ltd\nUSD account 7730 000 123 456\nSWIFT MALBMVMV" }));
    card.appendChild(fld("Footer line", st, "footer", { type: "textarea" }));
    card.appendChild(E("div", { class: "acts acts--between" }, [
      E("div", { class: "acts" }, [
        E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Download backup", onclick: function () { var a = E("a", { href: "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(S, null, 2)), download: "coravida-books-" + today() + ".json" }); document.body.appendChild(a); a.click(); a.remove(); } }),
        E("label", { class: "btn btn--ghost btn--sm" }, ["Restore backup", E("input", { type: "file", accept: "application/json", hidden: true, onchange: function (e) { var f = e.target.files[0]; if (!f) return; f.text().then(function (txt) { var j = JSON.parse(txt); if (!j || !j.bookings) throw new Error("not a books file"); return A.confirm("Restore this backup?", "It replaces everything in the books with the file's contents.", "Restore", true).then(function (ok) { if (ok) { S = j; save(true); A.render(); } }); }).catch(function (x) { toast("Could not restore: " + x.message, "err"); }); } })]),
        E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Load sample data", onclick: function () { A.confirm("Load sample data?", "Adds a few example bookings, invoices and expenses so you can see how the books work. Clear them again from here.", "Load").then(function (ok) { if (ok) { sample(); save(); A.render(); toast("Sample data loaded.", "ok"); } }); } })
      ]),
      E("button", { class: "btn btn--bad btn--sm", type: "button", text: "Clear all books", onclick: function () { A.confirm("Clear every booking, invoice, payment and expense?", "Settings stay. Download a backup first if in doubt.", "Clear everything", true).then(function (ok) { if (ok) { var s2 = S.settings; S = blank(); S.settings = s2; save(); A.render(); } }); } })
    ]));
    card.appendChild(E("button", { class: "btn btn--go", type: "button", text: "Save books settings", onclick: function () { save(); toast("Saved.", "ok"); } }));
    return card;
  }
  function sample() {
    var cv = content(), V = cv.voyages || [], t = today();
    var names = [["Anna & Lukas Weber", "anna.weber@example.de", "+49 170 555 0192", "Kurumba Maldives"], ["The Petrov family", "d.petrov@example.ru", "+7 916 555 0134", "Velassaru"], ["Chen Wei", "chen.wei@example.cn", "+86 139 5555 0187", "Hulhumalé"], ["Sophie Laurent", "sophie@example.fr", "+33 6 55 55 01 44", "Adaaran Hudhuranfushi"], ["James & Priya Okafor", "okafor@example.co.uk", "+44 7700 900123", "Anantara Dhigu"], ["Mateo Rossi", "mateo.rossi@example.it", "+39 333 555 0166", "Hulhumalé"]];
    var offs = [-40, -24, -9, 3, 12, 26], done = 0;
    names.forEach(function (n, i) {
      var v = V[i % V.length] || { slug: "custom", title: "Custom charter", price: 1200 };
      var b = { id: A.uid() + i, ref: "B-" + String(S.settings.nextBooking++).padStart(4, "0"), status: offs[i] < 0 ? "completed" : i === 5 ? "enquiry" : "confirmed", date: addDays(t, offs[i]), excursion: v.slug, excursionTitle: v.title, guests: i === 2 ? 4 : 7, price: i === 2 ? 800 : v.price,
        customer: { name: n[0], email: n[1], phone: n[2], staying: n[3] }, addons: i % 2 ? [{ id: "floating-breakfast", t: "Floating breakfast", p: 180 }] : [], notes: i === 3 ? "Anniversary — a cake aboard would be welcome." : "", created: new Date().toISOString() };
      S.bookings.push(stamp(b));
      if (i < 5) {
        var inv = { id: A.uid() + "i" + i, no: nextNo(), bookingId: b.id, date: addDays(b.date, -14), due: addDays(b.date, -7), customer: b.customer, lines: [{ d: b.excursionTitle + " · " + fmtDate(b.date) + " · " + b.guests + " guests", qty: 1, unit: b.price }].concat(b.addons.map(function (a) { return { d: a.t, qty: 1, unit: a.p }; })), tgst: S.settings.tgst, notes: "", created: new Date().toISOString() };
        S.settings.nextInvoice++; S.invoices.push(stamp(inv));
        var x = invTotals(inv);
        if (i < 3) S.payments.push(stamp({ id: A.uid() + "p" + i, invoiceId: inv.id, date: addDays(inv.date, 2), amount: x.total, method: i === 1 ? "card" : "bank", ref: "TRF-" + (48210 + i) }));
        else if (i === 3) S.payments.push(stamp({ id: A.uid() + "p" + i, invoiceId: inv.id, date: addDays(inv.date, 1), amount: round2(x.total / 2), method: "bank", ref: "Deposit" }));
      }
    });
    [[-38, "fuel", 640, "Diesel, 800 L"], [-30, "crew", 1500, "Crew wages, month"], [-22, "provisions", 210, "Lunch and fruit for the Petrov charter"], [-15, "marina", 850, "Berth, month"], [-7, "maintenance", 420, "Impeller and oil change"], [-3, "fuel", 590, "Diesel, 740 L"], [-1, "equipment", 160, "Two snorkel sets, child sizes"], [0, "marketing", 120, "Instagram promotion"]].forEach(function (e, i) {
      S.expenses.push(stamp({ id: A.uid() + "e" + i, date: addDays(t, e[0]), category: e[1], amount: e[2], desc: e[3], paidBy: e[1] === "provisions" ? "cash" : "bank" }));
    });
  }

  return { load: load, save: save, summary: summary, money: money, overviewCard: overviewCard, settingsCard: settingsCard, data: function () { return S; } };
})(window.Admin);
