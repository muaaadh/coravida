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
             bookings: [], invoices: [], payments: [], expenses: [], blocks: [] };
  }
  /* dates are local calendar days, never UTC: the Maldives is UTC+5, and
     toISOString() would hand back yesterday */
  var iso = function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  var parse = function (s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
  var today = function () { return iso(new Date()); };
  var addDays = function (s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  var daysBetween = function (a, b) { return Math.round((parse(b) - parse(a)) / 86400000); };
  /* a record is never deleted, only marked — so a deletion made on one
     device survives a merge with another */
  var L = function (k) { return (S[k] || []).filter(function (x) { return !x.deleted; }); };
  function remove(k, id) { var x = byId(S[k], id); if (x) { x.deleted = true; stamp(x); } }
  var round2 = function (n) { return Math.round((Number(n) || 0) * 100) / 100; };
  function money(n, dp) { var cur = (S && S.settings.currency) || "USD"; var v = Number(n) || 0; return (v < 0 ? "−" : "") + cur + " " + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: dp == null ? 2 : dp, maximumFractionDigits: dp == null ? 2 : dp }); }
  function fmtDate(s) { if (!s) return "—"; var d = new Date(s + "T00:00:00"); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  function monthKey(s) { return String(s).slice(0, 7); }
  var stamp = function (o) { o.updated = new Date().toISOString(); return o; };
  var nameOf = function (b) { return (b && b.customer && b.customer.name) || (b && b.ref) || "Booking"; };

  function cache() { A.lsSet(KEY, { data: S, sha: sha, dirty: !!saveT || saving || !!failed, localOnly: localOnly, at: Date.now() }); }
  var LISTS = ["bookings", "invoices", "payments", "expenses", "blocks", "log"];
  /* every change is written down: what, by which device, when — and merged
     like everything else, so both devices see the whole story */
  function device() { return A.lsGet("cv:device", "") || (/iPhone|iPad|Android|Mobile/i.test(navigator.userAgent) ? "Phone" : "Computer"); }
  function logIt(kind, act, text, link, ref) {
    (S.log = S.log || []).push({ id: A.uid(), at: new Date().toISOString(), who: device(), kind: kind, act: act, text: text, link: link || "", ref: ref || "", updated: new Date().toISOString() });
  }
  /* a one-line account of what an edit changed */
  function diffOf(before, after) {
    var out = [], F = { date: "date", slot: "time", guests: "guests", price: "price", status: "status", excursionTitle: "excursion", notes: "notes" };
    Object.keys(F).forEach(function (k) { var a = before[k], b = after[k]; if (String(a == null ? "" : a) !== String(b == null ? "" : b)) out.push(F[k] + " " + (k === "date" ? fmtDate(a) + " → " + fmtDate(b) : k === "slot" ? slotLabel(a || "day") + " → " + slotLabel(b || "day") : k === "notes" ? "changed" : (a == null ? "—" : a) + " → " + (b == null ? "—" : b))); });
    ["name", "email", "phone", "staying"].forEach(function (k) { if (String((before.customer || {})[k] || "") !== String((after.customer || {})[k] || "")) out.push(k + " changed"); });
    var ad = function (x) { return (x.addons || []).map(function (a) { return a.t; }).sort().join(", "); }; if (ad(before) !== ad(after)) out.push("add-ons " + (ad(after) || "none"));
    return out.join(", ");
  }
  /* books written by an older build may lack a list; never let that throw */
  function shape(x) {
    x = x && typeof x === "object" ? x : blank(); x.settings = Object.assign(blank().settings, x.settings || {});
    LISTS.forEach(function (k) { if (!Array.isArray(x[k])) x[k] = []; });
    x.bookings.forEach(function (b) { b.customer = b.customer || {}; b.addons = b.addons || []; });
    x.invoices.forEach(function (i) { i.customer = i.customer || {}; i.lines = i.lines || []; });
    return x;
  }
  function load() {
    var c = A.lsGet(KEY, null);
    S = shape(c && c.data ? c.data : blank()); sha = c ? c.sha : null;
    if (!A.token()) { localOnly = true; return Promise.resolve(); }
    var s = A.settings();
    return A.gh.read(s.booksRepo, s.booksPath, BRANCH).then(function (r) {
      localOnly = false; remote = true;
      if (r.missing) { sha = null; return save(true); }   // first run: create the file
      var R = shape(JSON.parse(r.text));
      // a device that worked without a token keeps what it did; otherwise the file wins
      var hadLocal = c && (c.dirty || c.localOnly) && LISTS.some(function (k) { return (c.data[k] || []).length; });
      S = hadLocal ? merge(R, S) : R; sha = r.sha; lastSaved = new Date(); loadedAt = Date.now();
      if (hadLocal) return save(true).then(clashCheck);
      cache(); clashCheck(); publishAvailability();
    }).catch(function (e) { localOnly = true; toast("Books: " + e.message + " Working on this device only.", "err"); });
  }
  /* after any merge: a slot two confirmed bookings both hold is the one thing
     the office must hear about at once */
  function clashCheck() {
    var seen = {}, n = 0;
    L("bookings").forEach(function (b) { if (!takes(b) || !b.date) return; var o = occupancy(b.date); if (o.clash.length && !seen[b.date]) { seen[b.date] = 1; n += o.clash.length; } });
    if (n) toast("Double-booked: " + Object.keys(seen).map(fmtDate).join(", ") + " — open the calendar and move one of them.", "err");
    return n;
  }
  /* union by id, the newer record wins — so two devices can both add things */
  function merge(a, b) {
    var out = shape(JSON.parse(JSON.stringify(a))); b = shape(b);
    // settings travel as one thing: whichever side saved them last wins
    out.settings = ((b.settings.updated || "") >= (a.settings.updated || "")) ? Object.assign({}, a.settings, b.settings) : Object.assign({}, b.settings, a.settings);
    ["bookings", "invoices", "payments", "expenses", "blocks"].forEach(function (k) {
      var by = {}; (a[k] || []).forEach(function (x) { by[x.id] = x; });
      (b[k] || []).forEach(function (x) { if (!by[x.id] || (x.updated || "") > (by[x.id].updated || "")) by[x.id] = x; });
      out[k] = Object.keys(by).map(function (i) { return by[i]; });
    });
    out.settings.nextInvoice = Math.max(a.settings.nextInvoice || 1, b.settings.nextInvoice || 1);
    out.settings.nextBooking = Math.max(a.settings.nextBooking || 1, b.settings.nextBooking || 1);
    return out;
  }
  var retries = 0;
  function save(now) {
    cache();
    clearTimeout(saveT); saveT = null;
    if (localOnly) { drawSync(); return Promise.resolve(); }
    if (!now) { saveT = setTimeout(function () { save(true); }, 1200); drawSync(); return Promise.resolve(); }
    var s = A.settings(); saving = true; drawSync();
    var cut = new Date(Date.now() - 90 * 86400000).toISOString();
    ["bookings", "invoices", "payments", "expenses", "blocks"].forEach(function (k) { if (S[k]) S[k] = S[k].filter(function (x) { return !x.deleted || (x.updated || "") > cut; }); });
    // the file must stay well under GitHub's 1 MB read limit; older log lines live on in the commit history
    if (S.log && S.log.length > 3000) S.log = S.log.slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }).slice(0, 3000);
    return A.gh.putText(s.booksRepo, s.booksPath, JSON.stringify(S, null, 2) + "\n", "Books: " + new Date().toISOString().slice(0, 16).replace("T", " "), sha, BRANCH)
      .then(function (j) { sha = j.content.sha; saving = false; failed = ""; retries = 0; lastSaved = new Date(); loadedAt = Date.now(); cache(); drawSync(); publishAvailability(); })
      .catch(function (e) {
        saving = false;
        if ((e.status === 409 || e.status === 422) && retries < 3) {   // someone else saved: merge and try again
          retries++;
          return A.gh.read(s.booksRepo, s.booksPath, BRANCH).then(function (r) { S = merge(JSON.parse(r.text), S); sha = r.sha; A.render(); clashCheck(); return save(true); });
        }
        retries = 0;
        failed = e.message; toast("Books did not save: " + e.message, "err"); cache(); drawSync();
      });
  }
  /* The website's calendar asks which days are gone. Only dates and halves
     travel — never a name. Two copies: the inbox function gets it at once (the
     calendar reads that live), and the static file in the site repo is the
     fallback, committed only when the set actually changed. */
  var pubT = null, web = { state: "", at: null, err: "" };
  function availUrl() { var c = (window.Admin.C.draft || window.Admin.C.baseline) || {}, ep = c.brand && c.brand.form && c.brand.form.endpoint || ""; return /\/api\/enquire\/?$/.test(ep) ? ep.replace(/\/api\/enquire\/?$/, "/api/availability") : ""; }
  function publishAvailability() {
    if (localOnly) { web.state = "local"; drawSync(); return; }
    var list = availability(today().slice(0, 7) + "-01", 430), text = JSON.stringify({ taken: list }) + "\n";
    web.state = "sending"; drawSync();
    var live = availUrl() ? fetch(availUrl(), { method: "POST", headers: { Authorization: "Bearer " + A.token(), "Content-Type": "application/json" }, body: JSON.stringify({ taken: list }) })
      .then(function (r) { return r.json(); }).then(function (j) { if (!j.ok) throw new Error(j.error || "refused"); web.state = "ok"; web.at = new Date(); web.err = ""; drawSync(); })
      .catch(function (e) { web.state = "error"; web.err = e.message; drawSync(); }) : Promise.resolve();
    clearTimeout(pubT);
    pubStatic = function () {
      pubT = null; pubStatic = null;
      if (A.lsGet("cv:books:avail", "") === text) return;
      var s = A.settings();
      A.gh.read(s.repo, "content/availability.json").then(function (r) {
        if (r.text === text) { A.lsSet("cv:books:avail", text); return; }
        return A.gh.putText(s.repo, "content/availability.json", text, "Availability: " + list.length + " day" + (list.length === 1 ? "" : "s") + " taken (books)", r.sha).then(function () { A.lsSet("cv:books:avail", text); });
      }).catch(function (e) { if (!availUrl()) toast("Could not send availability to the website: " + e.message, "err"); });
    };
    pubT = setTimeout(pubStatic, 2500);
    return live;
  }
  var pubStatic = null;
  /* what the website currently knows, for the calendar's header */
  function webBadge() {
    var b = E("span", { class: "badge webSync" }); setTimeout(drawSync, 0); return b;
  }
  var loadedAt = 0;
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") { if (saveT) save(true); if (pubT && pubStatic) { clearTimeout(pubT); pubStatic(); } return; }
    if (failed && !saving) { save(true); return; }
    if (localOnly || saving || saveT || !loadedAt || Date.now() - loadedAt < 60000) return;
    var s = A.settings();
    A.gh.read(s.booksRepo, s.booksPath, BRANCH).then(function (r) {
      if (r.missing || r.sha === sha) return;
      S = merge(JSON.parse(r.text), S); sha = r.sha; loadedAt = Date.now(); cache(); A.render(); toast("Books refreshed from the other device.", "ok"); clashCheck();
    }).catch(function () {});
  });
  window.addEventListener("pagehide", function () { if (saveT) save(true); if (pubT && pubStatic) { clearTimeout(pubT); pubStatic(); } });
  function drawSync() {
    $$(".webSync").forEach(function (n) {
      var st = localOnly ? "local" : web.state;
      n.className = "webSync badge " + (st === "ok" ? "badge--ok" : st === "sending" ? "badge--info" : st === "error" || st === "local" ? "badge--bad" : "");
      n.textContent = st === "local" ? "Website not updated — connect first" : st === "sending" ? "Updating the website…" : st === "ok" ? "Website up to date" : st === "error" ? "Website not updated" : "Website: unknown";
      n.title = st === "error" ? web.err : st === "local" ? "Bookings and blocks made without a GitHub token stay on this device; the website cannot see them." : st === "ok" && web.at ? "Sent " + web.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    });
    $$(".booksSync").forEach(function (n) {
      n.className = "booksSync badge " + (localOnly ? "badge--warn" : failed ? "badge--bad" : saving || saveT ? "badge--info" : "badge--ok");
      n.textContent = localOnly ? "On this device only" : failed ? "Not saved" : saving ? "Saving…" : saveT ? "Unsaved" : lastSaved ? "Saved " + lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Synced";
      n.title = localOnly ? "Add a GitHub token in Settings to keep the books in your private repository." : failed || "";
    });
  }
  function syncBadge() { var b = E("span", { class: "booksSync badge" }); setTimeout(drawSync, 0); return b; }

  /* ---------------------------------------------------------------- derived */
  var byId = function (arr, id) { return (arr || []).filter(function (x) { return x.id === id; })[0]; };

  /* ---------------------------------------------------------------- the day
     One vessel, so a day holds one full-day charter, or a morning half-day
     and an afternoon half-day. A booking takes a slot; a block takes the
     whole day; an enquiry takes nothing until it is confirmed. */
  var SLOTS = [["day", "Full day"], ["am", "Morning"], ["pm", "Afternoon"]];
  var REASONS = [["maintenance", "Maintenance"], ["weather", "Weather"], ["private", "Private use"], ["crew", "Crew off"], ["other", "Other"]];
  var slotLabel = function (k) { return (SLOTS.filter(function (x) { return x[0] === k; })[0] || SLOTS[0])[1]; };
  var reasonLabel = function (k) { return (REASONS.filter(function (x) { return x[0] === k; })[0] || REASONS[4])[1]; };
  /* the slot an excursion naturally takes: full days take the day, half days
     take the morning unless they leave after midday */
  function slotFor(v) {
    if (!v) return "day";
    if (!/half|evening|sunset|afternoon|morning/i.test(v.kind || "")) return "day";
    var h = parseInt(String(v.departs || "").slice(0, 2), 10);
    return /evening|sunset|afternoon/i.test(v.kind) || (isFinite(h) && h >= 12) ? "pm" : "am";
  }
  var blocksOn = function (d) { return L("blocks").filter(function (b) { return b.from <= d && d <= b.to; }); };
  var takes = function (b) { return b.status === "confirmed" || b.status === "completed"; };
  function occupancy(d) {
    var o = { date: d, am: null, pm: null, enquiries: [], clash: [], blocks: blocksOn(d) };
    L("bookings").forEach(function (b) {
      if (b.date !== d || b.status === "cancelled") return;
      if (!takes(b)) { o.enquiries.push(b); return; }
      var s = b.slot || "day", hit = false;
      if ((s === "day" || s === "am") && o.am) hit = true;
      if ((s === "day" || s === "pm") && o.pm) hit = true;
      if (hit) { o.clash.push(b); return; }   // two confirmed on one slot — only a merge can do this, and it must show
      if (s === "day" || s === "am") o.am = b;
      if (s === "day" || s === "pm") o.pm = b;
    });
    o.booked = !!(o.am || o.pm); o.full = !!(o.am && o.pm) || o.blocks.length > 0;
    o.state = o.clash.length ? "clash" : o.blocks.length ? "blocked" : o.am && o.pm ? "full" : o.booked ? "part" : o.enquiries.length ? "pending" : "free";
    return o;
  }
  /* why this booking cannot take its day, or null */
  function conflict(b) {
    if (!b.date) return null;
    var o = occupancy(b.date), s = b.slot || "day";
    var other = function (x) { return x && x.id !== b.id ? x : null; };
    if (o.blocks.length) return "the day is blocked (" + reasonLabel(o.blocks[0].reason) + (o.blocks[0].note ? " — " + o.blocks[0].note : "") + ")";
    var hit = s === "day" ? (other(o.am) || other(o.pm)) : s === "am" ? other(o.am) : other(o.pm);
    if (hit) return (slotLabel(hit.slot || "day") === "Full day" ? "the day" : "the " + slotLabel(hit.slot).toLowerCase()) + " is already booked by " + nameOf(hit);
    return null;
  }
  /* both return { added: [ids], removed: [ids] } — exactly what an undo reverses */
  function block(from, to, reason, note, quiet) {
    if (to < from) { var t = from; from = to; to = t; }
    var done = unblock(from, to, true), rec = stamp({ id: A.uid(), from: from, to: to, reason: reason || "other", note: note || "" });
    (S.blocks = S.blocks || []).push(rec); done.added.push(rec.id);
    logIt("block", "blocked", (from === to ? fmtDate(from) : fmtDate(from) + " – " + fmtDate(to)) + " · " + reasonLabel(rec.reason) + (rec.note ? " · " + rec.note : ""), "#calendar/" + from.slice(0, 7));
    if (!quiet) save();
    return done;
  }
  /* take a range out of whatever blocks cover it, splitting them */
  function unblock(from, to, quiet) {
    if (to < from) { var t = from; from = to; to = t; }
    var done = { added: [], removed: [] };
    var hit = 0;
    L("blocks").forEach(function (b) {
      if (b.to < from || b.from > to) return; hit++;
      if (b.from < from) { var l = stamp({ id: A.uid(), from: b.from, to: addDays(from, -1), reason: b.reason, note: b.note }); S.blocks.push(l); done.added.push(l.id); }
      if (b.to > to) { var r = stamp({ id: A.uid(), from: addDays(to, 1), to: b.to, reason: b.reason, note: b.note }); S.blocks.push(r); done.added.push(r.id); }
      remove("blocks", b.id); done.removed.push(b.id);
    });
    if (hit && !quiet) logIt("block", "unblocked", (from === to ? fmtDate(from) : fmtDate(from) + " – " + fmtDate(to)) + " freed", "#calendar/" + from.slice(0, 7));
    if (!quiet) save();
    return done;
  }
  /* undo: tombstone what the action added, bring back what it removed — and nothing else */
  function undo(done) {
    (done.added || []).forEach(function (id) { var x = byId(S.blocks, id); if (x) { x.deleted = true; stamp(x); } });
    (done.removed || []).forEach(function (id) { var x = byId(S.blocks, id); if (x) { delete x.deleted; stamp(x); } });
    logIt("block", "undone", "Undo — the last block change was reversed", "#calendar");
    save();
  }
  var joinDone = function (list) { return { added: [].concat.apply([], list.map(function (d) { return d.added; })), removed: [].concat.apply([], list.map(function (d) { return d.removed; })) }; }
  /* what the public site may know: which days are gone, nothing else */
  function availability(from, days) {
    var out = [];
    for (var i = 0, d = from; i < days; i++, d = addDays(d, 1)) { var o = occupancy(d); if (o.full || o.clash.length) out.push(d); else if (o.booked) out.push(d + ":" + (o.am ? "pm" : "am")); }
    return out;   // "2026-10-20" = taken; "2026-10-21:pm" = only the afternoon is left
  }
  function bookingTotal(b) { return round2((Number(b.price) || 0) + (b.addons || []).reduce(function (t, a) { return t + (Number(a.p) || 0); }, 0)); }
  function invTotals(inv) {
    var sub = round2((inv.lines || []).reduce(function (t, l) { return t + (Number(l.qty) || 0) * (Number(l.unit) || 0); }, 0));
    var tax = round2(sub * (Number(inv.tgst) || 0) / 100), total = round2(sub + tax);
    var paid = round2(L("payments").filter(function (p) { return p.invoiceId === inv.id; }).reduce(function (t, p) { return t + (Number(p.amount) || 0); }, 0));
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
    var upcoming = L("bookings").filter(function (b) { return b.date >= t && b.status !== "cancelled" && b.status !== "completed"; }).length;
    var out = 0, unpaid = 0;
    L("invoices").forEach(function (i) { var x = invTotals(i); if (x.balance > 0) { out += x.balance; unpaid++; } });
    var rev = L("invoices").filter(function (i) { return monthKey(i.date) === m; }).reduce(function (s, i) { return s + invTotals(i).sub; }, 0);
    var exp = L("expenses").filter(function (e) { return monthKey(e.date) === m; }).reduce(function (s, e) { return s + (Number(e.amount) || 0); }, 0);
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
  function head(host, title, p, extra) { host.appendChild(E("div", { class: "pagehead" }, [E("div", {}, [E("h2", { text: title }), p ? E("p", { text: p }) : null]), E("div", { class: "acts" }, [syncBadge(), extra || null])])); connectBanner(host); }
  /* without a token nothing leaves this browser — say so where it matters */
  function connectBanner(host) {
    if (!localOnly) return;
    host.appendChild(E("div", { class: "note note--bad connect" }, [
      E("div", {}, [E("b", { text: "Not connected — this device only." }), " ", "Bookings, blocked days and enquiries made here are not saved to the books, and the website's calendar will not show them, until a GitHub token is added."]),
      E("a", { class: "btn btn--sm", href: "#settings", text: "Connect in Settings" })
    ]));
  }
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
    var avail = E("p", { class: "field__help" });
    var slotF = fld("Time of day", b, "slot", { type: "select", options: SLOTS, onchange: function () { showAvail(); } });
    function showAvail() {
      if (!b.date) { avail.textContent = ""; return; }
      var why = conflict(b), o = occupancy(b.date);
      avail.className = "field__help " + (why ? "is-bad" : "is-ok");
      avail.textContent = why ? "Not available — " + why + "." : o.booked ? "Available — the " + (o.am ? "afternoon" : "morning") + " is still free that day." : "Available.";
      var conf = b.status === "confirmed" || b.status === "completed";
      if (why && conf) avail.textContent += " Save it as an enquiry, or pick another day.";
      if (b.date < today()) avail.textContent = "That day has passed." + (why ? " " + avail.textContent : "");
    }
    var dateF = fld("Date", b, "date", { type: "date", required: true, onchange: showAvail });
    dateF.appendChild(avail);
    node.appendChild(E("div", { class: "fg fg3" }, [
      dateF,
      fld("Excursion", b, "excursion", { type: "select", options: (cv.voyages || []).map(function (v) { return [v.slug, v.title]; }).concat([["custom", "Custom charter"]]), onchange: function () { autoPrice(); var v = (cv.voyages || []).filter(function (x) { return x.slug === b.excursion; })[0]; b.slot = slotFor(v); slotF._input.value = b.slot; showAvail(); } }),
      fld("Guests", b, "guests", { type: "number", min: 1, step: 1, required: true, onchange: autoPrice })
    ]));
    node.appendChild(E("div", { class: "fg fg2" }, [slotF, fld("Status", b, "status", { type: "select", options: STATUS, onchange: showAvail })]));
    setTimeout(showAvail, 0);
    node._check = function () { var why = conflict(b); if (why && (b.status === "confirmed" || b.status === "completed")) { toast("Cannot confirm: " + why + ".", "err"); return false; } return true; };
    priceF = fld("Charter price", b, "price", { type: "number", min: 0, prefix: R.currency, placeholder: "quote by hand", help: "Fills in automatically for a party of " + R.pax + "; any other number is quoted by hand." });
    node.appendChild(priceF);
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
  function newBooking(preset, after) {
    var cv = content(), R = cv.rates || { pax: 7 };
    var v0 = (cv.voyages || [])[0];
    var b = { id: A.uid(), ref: "", status: "enquiry", date: today(), slot: slotFor(v0), excursion: v0 ? v0.slug : "custom", excursionTitle: v0 ? v0.title : "Custom charter", guests: R.pax, price: v0 ? v0.price : null, customer: {}, addons: [], notes: "", created: new Date().toISOString() };
    if (preset) Object.assign(b, preset);
    var node = bookingForm(b);
    A.dialog({ title: "New booking", node: node, wide: true, actions: [["Cancel", "btn--ghost", null], ["Save booking", "btn--go", "ok"]], validate: function () { return validate(node) && node._check(); } }).then(function (r) {
      if (r !== "ok") return;
      b.ref = "B-" + String(S.settings.nextBooking++).padStart(4, "0");
      S.bookings.push(stamp(b)); logIt("booking", "created", b.ref + " · " + nameOf(b) + " · " + fmtDate(b.date) + " · " + (b.excursionTitle || "Custom") + " · " + b.status, "#bookings/" + b.id, b.ref); save();
      if (after) after(b); else { A.go("bookings/" + b.id); toast("Booking " + b.ref + " saved.", "ok"); }
    });
  }
  function editBooking(b) {
    var copy = JSON.parse(JSON.stringify(b)), node = bookingForm(copy);
    A.dialog({ title: "Edit " + b.ref, node: node, wide: true, actions: [["Cancel", "btn--ghost", null], ["Save", "btn--go", "ok"]], validate: function () { return validate(node) && node._check(); } }).then(function (r) {
      if (r !== "ok") return;
      var live = byId(L("bookings"), b.id) || b;   // the books may have been refreshed while the dialog was open
      var what = diffOf(live, copy);
      Object.assign(live, copy); stamp(live); logIt("booking", "edited", live.ref + " · " + nameOf(live) + (what ? " — " + what : ""), "#bookings/" + live.id, live.ref); save(); A.render(); toast("Saved.", "ok");
    });
  }
  A.register({ id: "bookings", group: "Books", label: "Bookings", icon: "cal", badge: function () { var n = S ? L("bookings").filter(function (b) { return b.status === "enquiry" && b.date >= today(); }).length : 0; return n || ""; }, render: function (host, arg) {
    if (arg) { var b = byId(L("bookings"), arg); if (!b) { host.appendChild(E("div", { class: "note note--bad", html: "No such booking. <a href='#bookings'>Back.</a>" })); return; } return showBooking(host, b); }
    var view = A.lsGet("cv:books:bk", "upcoming");
    head(host, "Bookings", "Every enquiry and charter. Confirm it, invoice it, and mark it done.", E("button", { class: "btn btn--go", type: "button", text: "New booking", onclick: newBooking }));
    var card = E("div", { class: "card" });
    var q = "", search = E("input", { placeholder: "Search name, email, reference…" });
    var body = E("div");
    function draw() {
      body.innerHTML = "";
      var t = today();
      var rows = L("bookings").filter(function (b) {
        if (view === "upcoming") return b.date >= t && b.status !== "cancelled";
        if (view === "past") return b.date < t || b.status === "completed";
        if (view === "cancelled") return b.status === "cancelled";
        return true;
      }).filter(function (b) { if (!q) return true; var s = (b.ref + " " + custLine(b.customer) + " " + (b.excursionTitle || "")).toLowerCase(); return s.indexOf(q) > -1; })
        .sort(function (a, b) { return view === "past" ? (b.date < a.date ? -1 : 1) : (a.date < b.date ? -1 : 1); });
      if (!rows.length) return body.appendChild(empty("No bookings here", view === "upcoming" ? "New enquiries arrive by WhatsApp or email — add them here to track them." : "Nothing in this view.", view === "upcoming" ? E("button", { class: "btn btn--go", type: "button", text: "New booking", onclick: newBooking }) : null));
      body.appendChild(table([["Date"], ["Ref"], ["Customer"], ["Excursion"], ["Guests", "r"], ["Total", "r"], ["Status"], ["Invoice"]], rows.map(function (b) {
        var inv = L("invoices").filter(function (i) { return i.bookingId === b.id; });
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
    var invs = L("invoices").filter(function (i) { return i.bookingId === b.id; });
    var acts = E("div", { class: "acts" }, [syncBadge(),
      E("button", { class: "btn btn--ghost", type: "button", text: "Edit", onclick: function () { editBooking(b); } }),
      b.status === "enquiry" ? (function () { var why = conflict(Object.assign({}, b, { status: "confirmed" })); return E("button", { class: "btn", type: "button", text: "Confirm", disabled: !!why, title: why ? "Cannot confirm — " + why : "", onclick: function () { b.status = "confirmed"; stamp(b); logIt("booking", "confirmed", b.ref + " · " + nameOf(b) + " · " + fmtDate(b.date) + " " + slotLabel(b.slot || "day").toLowerCase(), "#bookings/" + b.id, b.ref); save(); A.render(); toast(b.ref + " confirmed — " + fmtDate(b.date) + " is now taken.", "ok"); } }); })() : null,
      b.status === "confirmed" && b.date <= today() ? E("button", { class: "btn", type: "button", text: "Mark completed", onclick: function () { b.status = "completed"; stamp(b); logIt("booking", "completed", b.ref + " · " + nameOf(b) + " · " + fmtDate(b.date), "#bookings/" + b.id, b.ref); save(); A.render(); } }) : null,
      E("button", { class: "btn btn--go", type: "button", text: "Create invoice", onclick: function () { newInvoice(b); } }),
      b.status !== "cancelled" ? E("button", { class: "btn btn--bad btn--sm", type: "button", text: "Cancel booking", onclick: function () { A.confirm("Cancel " + b.ref + "?", "The booking stays in the books, marked cancelled.", "Cancel booking", true).then(function (ok) { if (ok) { b.status = "cancelled"; stamp(b); logIt("booking", "cancelled", b.ref + " · " + nameOf(b) + " · " + fmtDate(b.date) + " — the day is free again", "#bookings/" + b.id, b.ref); save(); A.render(); } }); } }) : null
    ]);
    var why0 = b.status === "enquiry" ? conflict(Object.assign({}, b, { status: "confirmed" })) : null;
    host.appendChild(E("div", { class: "pagehead" }, [E("div", {}, [E("h2", {}, [b.customer.name || "Booking", " ", bookingBadge(b)]), E("p", { text: (b.excursionTitle || "Custom charter") + " · " + fmtDate(b.date) + " · " + slotLabel(b.slot || "day").toLowerCase() + " · " + b.guests + " guests" })]), acts]));
    if (why0) host.appendChild(E("div", { class: "note note--warn", text: "Cannot be confirmed as it stands — " + why0 + ". Move it to another day, or the other half of the day, and it can be confirmed." }));
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
    if (window.History) { var hc = E("div", { class: "card" }, [E("h3", { text: "History" })]), hb = E("div", { class: "hist" }); window.History.forRef(b.ref, hb); hc.appendChild(hb); host.appendChild(hc); }
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
      if (b && b.status === "enquiry") { if (!conflict(Object.assign({}, b, { status: "confirmed" }))) { b.status = "confirmed"; stamp(b); } else toast("The booking stays an enquiry — " + conflict(Object.assign({}, b, { status: "confirmed" })) + ".", "err"); }
      S.invoices.push(stamp(inv)); logIt("invoice", "created", inv.no + " · " + (inv.customer.name || "") + " · " + money(invTotals(inv).total) + (b ? " · for " + b.ref : ""), "#invoices/" + inv.id, b ? b.ref : inv.no); save(); A.go("invoices/" + inv.id); toast("Invoice " + inv.no + " created.", "ok");
    });
  }
  function recordPayment(inv) {
    var open = L("invoices").filter(function (i) { return invTotals(i).balance > 0; });
    if (!inv && !open.length) return toast("Every invoice is paid.", "ok");
    var p = { id: A.uid(), invoiceId: inv ? inv.id : open[0].id, date: today(), amount: invTotals(inv || open[0]).balance, method: "bank", ref: "" };
    var node = E("div", { class: "fg" });
    var amt;
    node.appendChild(fld("Invoice", p, "invoiceId", { type: "select", options: (inv ? [inv] : open).map(function (i) { return [i.id, i.no + " · " + (i.customer.name || "") + " · " + money(invTotals(i).balance) + " due"]; }), onchange: function (v) { p.amount = invTotals(byId(L("invoices"), v)).balance; amt._input.value = p.amount; } }));
    amt = fld("Amount received", p, "amount", { type: "number", min: 0, step: 0.01, required: true, prefix: S.settings.currency });
    node.appendChild(E("div", { class: "fg fg3" }, [fld("Date", p, "date", { type: "date", required: true }), amt, fld("Method", p, "method", { type: "select", options: METHODS })]));
    node.appendChild(fld("Reference", p, "ref", { placeholder: "Transfer reference, receipt number" }));
    A.dialog({ title: "Record a payment", node: node, actions: [["Cancel", "btn--ghost", null], ["Record", "btn--go", "ok"]], validate: function () { return validate(node) && Number(p.amount) > 0; } }).then(function (r) {
      if (r !== "ok") return;
      S.payments.push(stamp(p)); var pi = byId(L("invoices"), p.invoiceId) || {}; logIt("payment", "received", money(p.amount) + " on " + (pi.no || "?") + " · " + (pi.customer && pi.customer.name || "") + " · " + p.method, "#invoices/" + p.invoiceId, pi.no); save(); A.render(); toast("Payment recorded.", "ok");
    });
  }
  A.register({ id: "invoices", group: "Books", label: "Invoices", icon: "inv", badge: function () { return S ? (L("invoices").filter(function (i) { return invStatus(i)[0] === "overdue"; }).length || "") : ""; }, render: function (host, arg) {
    if (arg) { var inv = byId(L("invoices"), arg); if (!inv) { host.appendChild(E("div", { class: "note note--bad", html: "No such invoice. <a href='#invoices'>Back.</a>" })); return; } return showInvoice(host, inv); }
    var view = A.lsGet("cv:books:inv", "open");
    head(host, "Invoices", "Charter invoices with T-GST. Create one from a booking, or blank.", E("button", { class: "btn btn--go", type: "button", text: "New invoice", onclick: function () { newInvoice(null); } }));
    var card = E("div", { class: "card" });
    var rows = L("invoices").filter(function (i) { var st = invStatus(i)[0]; return view === "all" || (view === "open" ? st !== "paid" : st === view); }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    card.appendChild(E("div", { class: "filters" }, [seg([["open", "Open"], ["overdue", "Overdue"], ["paid", "Paid"], ["all", "All"]], view, function (v) { A.lsSet("cv:books:inv", v); A.render(); }),
      E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Export CSV", onclick: function () { csv("coravida-invoices.csv", [["No", "Date", "Due", "Customer", "Email", "Subtotal", "T-GST", "Total", "Paid", "Balance", "Status"]].concat(L("invoices").map(function (i) { var x = invTotals(i); return [i.no, i.date, i.due, i.customer.name, i.customer.email, x.sub, x.tax, x.total, x.paid, x.balance, invStatus(i)[1]]; }))); } })]));
    card.appendChild(rows.length ? table([["No"], ["Date"], ["Customer"], ["Total", "r"], ["Paid", "r"], ["Balance", "r"], ["Due"], ["Status"]], rows.map(function (i) { var x = invTotals(i); return { item: i, cells: [E("span", { class: "t", text: i.no }), fmtDate(i.date), i.customer.name || "—", money(x.total), money(x.paid), money(x.balance), fmtDate(i.due), badge(invStatus(i))] }; }), function (i) { A.go("invoices/" + i.id); }, true)
      : empty("No invoices " + (view === "all" ? "yet" : "in this view"), "Open a booking and press Create invoice, or start a blank one."));
    host.appendChild(card);
  } });
  function showInvoice(host, inv) {
    var x = invTotals(inv), st = invStatus(inv), cv = content(), B = cv.brand || {}, bk = byId(L("bookings"), inv.bookingId);
    host.appendChild(E("div", { class: "crumb noprint", html: "<a href='#invoices'>Invoices</a> › " + esc(inv.no) }));
    host.appendChild(E("div", { class: "pagehead noprint" }, [E("div", {}, [E("h2", {}, [inv.no + " ", badge(st)]), E("p", { text: (inv.customer.name || "") + (bk ? " · booking " + bk.ref : "") })]),
      E("div", { class: "acts" }, [syncBadge(),
        x.balance > 0 ? E("button", { class: "btn btn--go", type: "button", text: "Record payment", onclick: function () { recordPayment(inv); } }) : null,
        E("button", { class: "btn btn--ghost", type: "button", html: svg("print") + " Print / PDF", onclick: function () { window.print(); } }),
        x.paid === 0 ? E("button", { class: "btn btn--bad btn--sm", type: "button", text: "Delete", onclick: function () { A.confirm("Delete " + inv.no + "?", "It has no payments against it. The number will not be reused.", "Delete", true).then(function (ok) { if (ok) { remove("invoices", inv.id); logIt("invoice", "deleted", inv.no + " · " + (inv.customer.name || ""), "", inv.no); save(); A.go("invoices"); } }); } }) : null
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
    var pays = L("payments").filter(function (p) { return p.invoiceId === inv.id; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (pays.length) host.appendChild(E("div", { class: "card noprint" }, [E("h3", { text: "Payments" }), table([["Date"], ["Method"], ["Reference"], ["Amount", "r"], [""]], pays.map(function (p) { return { item: p, cells: [fmtDate(p.date), (METHODS.filter(function (m) { return m[0] === p.method; })[0] || [])[1] || p.method, p.ref || "—", money(p.amount), A.iconBtn("trash", "Remove payment", function () { A.confirm("Remove this payment?", money(p.amount) + " on " + fmtDate(p.date) + ".", "Remove", true).then(function (ok) { if (ok) { remove("payments", p.id); logIt("payment", "removed", money(p.amount) + " on " + inv.no + " · " + fmtDate(p.date), "#invoices/" + inv.id, inv.no); save(); A.render(); } }); })] }; }))]));
  }

  /* ---------------------------------------------------------------- payments */
  A.register({ id: "payments", group: "Books", label: "Payments", icon: "cash", render: function (host) {
    head(host, "Payments received", "Money in, against invoices.", E("button", { class: "btn btn--go", type: "button", text: "Record payment", onclick: function () { recordPayment(null); } }));
    var rows = L("payments").slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var card = E("div", { class: "card" });
    card.appendChild(E("div", { class: "filters" }, [E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Export CSV", onclick: function () { csv("coravida-payments.csv", [["Date", "Invoice", "Customer", "Method", "Reference", "Amount"]].concat(L("payments").map(function (p) { var i = byId(L("invoices"), p.invoiceId) || {}; return [p.date, i.no, i.customer && i.customer.name, p.method, p.ref, p.amount]; }))); } })]));
    card.appendChild(rows.length ? table([["Date"], ["Invoice"], ["Customer"], ["Method"], ["Reference"], ["Amount", "r"]], rows.map(function (p) { var i = byId(L("invoices"), p.invoiceId) || { no: "?", customer: {} }; return { item: p, cells: [fmtDate(p.date), E("a", { href: "#invoices/" + i.id, text: i.no }), i.customer.name || "—", (METHODS.filter(function (m) { return m[0] === p.method; })[0] || [])[1] || p.method, p.ref || "—", money(p.amount)] }; }), null, true)
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
    head(host, "Expenses", "Fuel, crew, marina, food, maintenance — what it costs to run the day.", E("button", { class: "btn btn--go", type: "button", text: "Add expense", onclick: function () { var x = { id: A.uid(), date: today(), category: "fuel", amount: null, desc: "", paidBy: "bank" }; expenseForm(x, "Add expense", function () { S.expenses.push(stamp(x)); logIt("expense", "added", money(x.amount) + " · " + x.desc + " · " + x.category, "#expenses"); save(); A.render(); }); } }));
    var months = {}; L("expenses").forEach(function (e) { months[monthKey(e.date)] = 1; });
    var mopts = [["all", "All months"]].concat(Object.keys(months).sort().reverse().map(function (k) { return [k, new Date(k + "-01T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" })]; }));
    var sel = E("select", {}); mopts.forEach(function (o) { sel.appendChild(E("option", { value: o[0], text: o[1], selected: o[0] === m })); });
    sel.addEventListener("change", function () { A.lsSet("cv:books:exm", sel.value); A.render(); });
    var rows = L("expenses").filter(function (e) { return m === "all" || monthKey(e.date) === m; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var total = rows.reduce(function (t, e) { return t + (Number(e.amount) || 0); }, 0);
    var card = E("div", { class: "card" });
    card.appendChild(E("div", { class: "filters" }, [E("div", { class: "field", style: "min-width:200px" }, [sel]), E("span", { class: "badge", text: "Total " + money(total) }),
      E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Export CSV", onclick: function () { csv("coravida-expenses.csv", [["Date", "Category", "Description", "Paid from", "Amount"]].concat(L("expenses").map(function (e) { return [e.date, e.category, e.desc, e.paidBy, e.amount]; }))); } })]));
    card.appendChild(rows.length ? table([["Date"], ["Category"], ["What for"], ["Paid from"], ["Amount", "r"], [""]], rows.map(function (e) { return { item: e, cells: [fmtDate(e.date), (CATS.filter(function (c) { return c[0] === e.category; })[0] || [])[1] || e.category, E("span", { class: "t", text: e.desc }), e.paidBy, money(e.amount),
      E("span", { class: "acts" }, [A.iconBtn("chev", "Edit", function () { var c = JSON.parse(JSON.stringify(e)); expenseForm(c, "Edit expense", function () { Object.assign(e, c); stamp(e); logIt("expense", "edited", money(e.amount) + " · " + e.desc, "#expenses"); save(); A.render(); }); }), A.iconBtn("trash", "Remove", function () { A.confirm("Remove this expense?", e.desc + " — " + money(e.amount), "Remove", true).then(function (ok) { if (ok) { remove("expenses", e.id); logIt("expense", "removed", money(e.amount) + " · " + e.desc, "#expenses"); save(); A.render(); } }); })])] }; }), null, true)
      : empty("No expenses " + (m === "all" ? "yet" : "this month"), "Add fuel, crew and marina costs as they happen and the reports do the rest."));
    host.appendChild(card);
  } });

  /* ---------------------------------------------------------------- reports */
  A.register({ id: "reports", group: "Books", label: "Reports", icon: "chart", render: function (host) {
    var per = A.lsGet("cv:books:per", "month"), t = today(), y = t.slice(0, 4), m = t.slice(0, 7);
    var lm = parse(t.slice(0, 7) + "-01"); lm.setMonth(lm.getMonth() - 1); var lmk = iso(lm).slice(0, 7);
    var inR = function (d) { return per === "all" || (per === "month" ? monthKey(d) === m : per === "last" ? monthKey(d) === lmk : d.slice(0, 4) === y); };
    var inv = L("invoices").filter(function (i) { return inR(i.date); }), pay = L("payments").filter(function (p) { return inR(p.date); }), exp = L("expenses").filter(function (e) { return inR(e.date); });
    var sub = inv.reduce(function (s, i) { return s + invTotals(i).sub; }, 0), tax = inv.reduce(function (s, i) { return s + invTotals(i).tax; }, 0);
    var rec = pay.reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0), spent = exp.reduce(function (s, e) { return s + (Number(e.amount) || 0); }, 0);
    var out = L("invoices").reduce(function (s, i) { return s + Math.max(0, invTotals(i).balance); }, 0);
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
    var months = [], d = parse(t.slice(0, 7) + "-01"); d.setMonth(d.getMonth() - 11);
    for (var i = 0; i < 12; i++) { months.push(iso(d).slice(0, 7)); d.setMonth(d.getMonth() + 1); }
    var series = months.map(function (mk) { return { k: mk, rev: L("invoices").filter(function (x) { return monthKey(x.date) === mk; }).reduce(function (s, x) { return s + invTotals(x).sub; }, 0), exp: L("expenses").filter(function (x) { return monthKey(x.date) === mk; }).reduce(function (s, x) { return s + (Number(x.amount) || 0); }, 0) }; });
    var max = Math.max(1, Math.max.apply(null, series.map(function (s) { return Math.max(s.rev, s.exp); })));
    var bars = E("div", { class: "bars" });
    series.forEach(function (s) { bars.appendChild(E("div", { class: "bar", title: s.k + " · invoiced " + money(s.rev, 0) + " · expenses " + money(s.exp, 0) }, [E("i", { style: "height:" + (s.rev / max * 100) + "%" }), E("i", { class: "x", style: "height:" + (s.exp / max * 100) + "%" }), E("span", { text: new Date(s.k + "-01T00:00:00").toLocaleDateString("en-GB", { month: "short" }) })])); });
    host.appendChild(E("div", { class: "card" }, [E("h3", { text: "Twelve months" }), bars, E("div", { class: "legend", html: "<span><i></i>Invoiced</span><span><i class='x'></i>Expenses</span>" })]));
    var g = E("div", { class: "grid2" });
    var byCat = {}; exp.forEach(function (e) { byCat[e.category] = (byCat[e.category] || 0) + (Number(e.amount) || 0); });
    var catRows = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; }).map(function (c) { return { item: c, cells: [(CATS.filter(function (x) { return x[0] === c; })[0] || [c])[1], money(byCat[c]), spent ? Math.round(byCat[c] / spent * 100) + "%" : "—"] }; });
    g.appendChild(E("div", { class: "card" }, [E("h3", { text: "Expenses by category" }), catRows.length ? table([["Category"], ["Amount", "r"], ["Share", "r"]], catRows) : E("p", { class: "small mute", text: "No expenses in this period." })]));
    var byEx = {}; L("bookings").filter(function (b) { return inR(b.date) && b.status !== "cancelled"; }).forEach(function (b) { var key = b.excursionTitle || "Custom"; byEx[key] = byEx[key] || { n: 0, v: 0 }; byEx[key].n++; byEx[key].v += bookingTotal(b); });
    var exRows = Object.keys(byEx).sort(function (a, b) { return byEx[b].v - byEx[a].v; }).map(function (k) { return { item: k, cells: [k, String(byEx[k].n), money(byEx[k].v, 0)] }; });
    g.appendChild(E("div", { class: "card" }, [E("h3", { text: "Charters by excursion" }), exRows.length ? table([["Excursion"], ["Charters", "r"], ["Value", "r"]], exRows) : E("p", { class: "small mute", text: "No charters in this period." })]));
    host.appendChild(g);
  } });

  /* ---------------------------------------------------------------- overview + settings cards */
  function overviewCard() {
    var t = today();
    var next = L("bookings").filter(function (b) { return b.date >= t && b.status !== "cancelled" && b.status !== "completed"; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }).slice(0, 6);
    var card = E("div", { class: "card" }, [E("div", { class: "card__h" }, [E("div", {}, [E("h2", { text: "Next charters" }), E("p", { text: localOnly ? "Books are on this device only until a token is added." : "Kept in your private books repository." })]), E("a", { class: "btn btn--ghost btn--sm", href: "#calendar", text: "Open calendar" })])]);
    var strip = E("div", { class: "strip" });
    for (var i = 0; i < 14; i++) (function (d) {
      var o = occupancy(d), x = parse(d);
      strip.appendChild(E("a", { class: "strip__d strip__d--" + o.state, href: "#calendar/" + d.slice(0, 7), title: fmtDate(d) + " — " + (o.state === "blocked" ? "blocked" : o.state === "full" ? "booked" : o.state === "part" ? "half day booked" : o.state === "pending" ? "enquiry waiting" : "free") }, [E("span", { text: x.toLocaleDateString("en-GB", { weekday: "narrow" }) }), E("b", { text: String(x.getDate()) })]));
    })(addDays(t, i));
    card.appendChild(E("div", {}, [E("p", { class: "kpi__k", text: "The next two weeks" }), strip]));
    if (!next.length) card.appendChild(E("p", { class: "small mute", text: "Nothing booked from today." }));
    else card.appendChild(E("div", { class: "list" }, next.map(function (b) { return E("div", { class: "list__i" }, [E("div", {}, [E("a", { href: "#bookings/" + b.id, text: fmtDate(b.date) + " · " + (b.customer.name || "—") }), E("div", { class: "s", text: (b.excursionTitle || "Custom") + " · " + b.guests + " guests" })]), bookingBadge(b)]); })));
    var recent = L("log").slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }).slice(0, 5);
    if (recent.length) card.appendChild(E("div", {}, [E("p", { class: "kpi__k", text: "Latest changes" }), E("div", { class: "list" }, recent.map(function (e) { return E("div", { class: "list__i" }, [E("div", {}, [E(e.link ? "a" : "span", { href: e.link || null, text: e.text }), E("div", { class: "s", text: e.act + " · " + e.who + " · " + new Date(e.at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) })])]); })), E("a", { class: "small", href: "#history", text: "All history →" })]));
    var over = L("invoices").filter(function (i) { return invStatus(i)[0] === "overdue"; });
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
    var dev = { name: A.lsGet("cv:device", "") };
    card.appendChild(fld("This device is called", dev, "name", { placeholder: device(), help: "Written next to every change in History, so the office knows which phone or laptop did what.", onchange: function (v) { A.lsSet("cv:device", String(v || "").trim()); } }));
    card.appendChild(E("div", { class: "acts acts--between" }, [
      E("div", { class: "acts" }, [
        E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Download backup", onclick: function () { var a = E("a", { href: "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(S, null, 2)), download: "coravida-books-" + today() + ".json" }); document.body.appendChild(a); a.click(); a.remove(); } }),
        E("label", { class: "btn btn--ghost btn--sm" }, ["Restore backup", E("input", { type: "file", accept: "application/json", hidden: true, onchange: function (e) { var f = e.target.files[0]; if (!f) return; f.text().then(function (txt) { var j = JSON.parse(txt); if (!j || !j.bookings) throw new Error("not a books file"); return A.confirm("Restore this backup?", "It replaces everything in the books with the file's contents.", "Restore", true).then(function (ok) { if (ok) { S = shape(j); LISTS.forEach(function (k) { S[k].forEach(function (x) { delete x.deleted; stamp(x); }); }); S.settings.updated = new Date().toISOString(); logIt("books", "restored", "Backup file restored: " + L("bookings").length + " bookings, " + L("invoices").length + " invoices", "#history"); save(true); A.render(); } }); }).catch(function (x) { toast("Could not restore: " + x.message, "err"); }); } })]),
        E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Load sample data", onclick: function () { A.confirm("Load sample data?", "Adds a few example bookings, invoices and expenses so you can see how the books work. Clear them again from here.", "Load").then(function (ok) { if (ok) { sample(); logIt("books", "sample", "Sample data loaded", "#history"); save(); A.render(); toast("Sample data loaded.", "ok"); } }); } })
      ]),
      E("button", { class: "btn btn--bad btn--sm", type: "button", text: "Clear all books", onclick: function () { A.confirm("Clear every booking, invoice, payment and expense?", "Settings stay. Download a backup first if in doubt.", "Clear everything", true).then(function (ok) { if (ok) { var n = L("bookings").length; ["bookings", "invoices", "payments", "expenses", "blocks"].forEach(function (k) { (S[k] || []).forEach(function (x) { x.deleted = true; stamp(x); }); }); S.settings.nextInvoice = 1; S.settings.nextBooking = 1; logIt("books", "cleared", "Everything cleared (" + n + " bookings) — earlier versions remain on GitHub", "#history"); save(); A.render(); } }); } })
    ]));
    card.appendChild(E("button", { class: "btn btn--go", type: "button", text: "Save books settings", onclick: function () { st.updated = new Date().toISOString(); logIt("settings", "saved", "T-GST " + st.tgst + "% · " + st.currency + " · invoices " + st.prefix + "-", "#settings"); save(); toast("Saved.", "ok"); } }));
    return card;
  }
  function sample() {
    var cv = content(), V = cv.voyages || [], t = today();
    var names = [["Anna & Lukas Weber", "anna.weber@example.de", "+49 170 555 0192", "Kurumba Maldives"], ["The Petrov family", "d.petrov@example.ru", "+7 916 555 0134", "Velassaru"], ["Chen Wei", "chen.wei@example.cn", "+86 139 5555 0187", "Hulhumalé"], ["Sophie Laurent", "sophie@example.fr", "+33 6 55 55 01 44", "Adaaran Hudhuranfushi"], ["James & Priya Okafor", "okafor@example.co.uk", "+44 7700 900123", "Anantara Dhigu"], ["Mateo Rossi", "mateo.rossi@example.it", "+39 333 555 0166", "Hulhumalé"]];
    var offs = [-40, -24, -9, 3, 12, 26], done = 0;
    names.forEach(function (n, i) {
      var v = V[i % V.length] || { slug: "custom", title: "Custom charter", price: 1200 };
      var b = { id: A.uid() + i, ref: "B-" + String(S.settings.nextBooking++).padStart(4, "0"), status: offs[i] < 0 ? "completed" : i === 5 ? "enquiry" : "confirmed", date: addDays(t, offs[i]), slot: slotFor(v), excursion: v.slug, excursionTitle: v.title, guests: i === 2 ? 4 : 7, price: i === 2 ? 800 : v.price,
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
    S.blocks = S.blocks || [];
    S.blocks.push(stamp({ id: A.uid() + "k1", from: addDays(t, 8), to: addDays(t, 9), reason: "maintenance", note: "Engine service, Hulhumalé" }));
    S.blocks.push(stamp({ id: A.uid() + "k2", from: addDays(t, 19), to: addDays(t, 19), reason: "private", note: "" }));
    [[-38, "fuel", 640, "Diesel, 800 L"], [-30, "crew", 1500, "Crew wages, month"], [-22, "provisions", 210, "Lunch and fruit for the Petrov charter"], [-15, "marina", 850, "Berth, month"], [-7, "maintenance", 420, "Impeller and oil change"], [-3, "fuel", 590, "Diesel, 740 L"], [-1, "equipment", 160, "Two snorkel sets, child sizes"], [0, "marketing", 120, "Instagram promotion"]].forEach(function (e, i) {
      S.expenses.push(stamp({ id: A.uid() + "e" + i, date: addDays(t, e[0]), category: e[1], amount: e[2], desc: e[3], paidBy: e[1] === "provisions" ? "cash" : "bank" }));
    });
  }

  return { load: load, save: save, summary: summary, money: money, overviewCard: overviewCard, settingsCard: settingsCard, data: function () { return S; },
           live: L, today: today, addDays: addDays, daysBetween: daysBetween, fmtDate: fmtDate, iso: iso, parse: parse,
           occupancy: occupancy, conflict: conflict, block: block, unblock: unblock, availability: availability, blocksOn: blocksOn,
           SLOTS: SLOTS, REASONS: REASONS, slotLabel: slotLabel, reasonLabel: reasonLabel, slotFor: slotFor, newBooking: newBooking, editBooking: editBooking, sync: drawSync, undo: undo, joinDone: joinDone, nameOf: nameOf, clashCheck: clashCheck, logIt: logIt, device: device, invTotals: invTotals, shape: shape, setAll: function (x) { S = shape(x); }, webBadge: webBadge, connectBanner: connectBanner, localOnly: function () { return localOnly; }, publishAvailability: publishAvailability };
})(window.Admin);
