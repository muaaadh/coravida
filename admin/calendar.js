/* ==========================================================================
   CORAVIDA — the calendar.
   One vessel, one month at a time. A confirmed booking takes its day (or its
   half of it); a block takes the whole day; an enquiry only pencils it in.
   Click a day, or drag across days, then decide in the panel: block, unblock,
   book. Nothing here can double-book — the books refuse it.
   ========================================================================== */
(function (A) {
  "use strict";
  var E = A.E, $ = A.$, $$ = A.$$, esc = A.esc, svg = A.svg, toast = A.toast, B = window.Books;
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var view = null;                       // "YYYY-MM" being shown
  var sel = null;                        // { a: "YYYY-MM-DD", b: "YYYY-MM-DD" } inclusive, a <= b
  var anchor = null;                     // first click of a pair
  var dragging = false, dragFrom = null, dragMoved = false;
  var rangeMode = false, shiftHeld = false;   // "now tap the last day" — the explicit way on a phone
  var reason = "maintenance", note = "";

  var ym = function (d) { return d.slice(0, 7); };
  var first = function (m) { return m + "-01"; };
  var monthLabel = function (m) { var p = m.split("-"); return MONTHS[+p[1] - 1] + " " + p[0]; };
  var shiftMonth = function (m, n) { var p = m.split("-"), d = new Date(+p[0], +p[1] - 1 + n, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
  var daysIn = function (m) { var p = m.split("-"); return new Date(+p[0], +p[1], 0).getDate(); };
  var dowOf = function (d) { return (B.parse(d).getDay() + 6) % 7; };   // Monday = 0
  var short = function (d) { var x = B.parse(d); return x.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); };
  var range = function (a, b) { var out = []; for (var d = a; d <= b; d = B.addDays(d, 1)) out.push(d); return out; };
  var firstName = function (b) { return String(B.nameOf(b)).split(/\s+/)[0]; };
  var VALID_M = /^\d{4}-(0[1-9]|1[0-2])$/;

  function select(a, b) {
    sel = a ? { a: a < b ? a : b, b: a < b ? b : a } : null; anchor = a ? a : null; rangeMode = false; paint(); drawPanel();
    if (sel && window.innerWidth <= 1100) { var c = gridEl.querySelector('[data-date="' + sel.b + '"]'); if (c && c.scrollIntoView) c.scrollIntoView({ block: "center", behavior: "smooth" }); }
  }

  /* ---------------------------------------------------------------- grid */
  var gridEl = null, headEl = null, panelEl = null, sheetEl = null;
  function drawGrid() {
    gridEl.innerHTML = "";
    var m = view, n = daysIn(m), lead = dowOf(first(m)), t = B.today();
    var cells = [];
    for (var i = 0; i < lead; i++) gridEl.appendChild(E("div", { class: "day day--pad", "aria-hidden": "true" }));
    for (var d = 1; d <= n; d++) {
      var date = m + "-" + String(d).padStart(2, "0"), o = B.occupancy(date);
      var c = E("button", { type: "button", class: "day is-" + o.state + (date < t ? " is-past" : "") + (date === t ? " is-today" : ""), "data-date": date, tabindex: "-1", "aria-label": short(date) + ", " + describe(o), "aria-pressed": "false" });
      c.appendChild(E("span", { class: "day__n", text: String(d) }));
      var bars = E("span", { class: "day__bars" });
      if (o.clash.length) bars.appendChild(E("span", { class: "dbar dbar--clash", text: "Double-booked" }));
      else if (o.blocks.length) bars.appendChild(E("span", { class: "dbar dbar--block", text: B.reasonLabel(o.blocks[0].reason) }));
      else {
        if (o.am && o.am === o.pm) bars.appendChild(E("span", { class: "dbar dbar--day", text: firstName(o.am) }));
        else {
          if (o.am) bars.appendChild(E("span", { class: "dbar dbar--am" }, [E("i", { text: "AM" }), firstName(o.am)]));
          if (o.pm) bars.appendChild(E("span", { class: "dbar dbar--pm" }, [E("i", { text: "PM" }), firstName(o.pm)]));
        }
        var room = o.booked ? 1 : 2, shown = o.enquiries.slice(0, room);
        shown.forEach(function (q, i) { bars.appendChild(E("span", { class: "dbar dbar--enq", text: firstName(q) + (i === shown.length - 1 && o.enquiries.length > room ? " +" + (o.enquiries.length - room) : "") })); });
      }
      c.appendChild(bars);
      gridEl.appendChild(c); cells.push(c);
    }
    for (var k = lead + n; k < 42; k++) gridEl.appendChild(E("div", { class: "day day--pad", "aria-hidden": "true" }));   // six rows, always
    // roving focus: the selected day, else today if shown, else the first
    var focusDate = (sel && ym(sel.a) === m) ? sel.a : ym(t) === m ? t : first(m);
    var f = gridEl.querySelector('[data-date="' + focusDate + '"]'); if (f) f.tabIndex = 0;
    paint();
  }
  function describe(o) {
    if (o.state === "clash") return "double-booked — " + [o.am || o.pm].concat(o.clash).map(B.nameOf).join(" and ");
    if (o.state === "blocked") return "blocked, " + B.reasonLabel(o.blocks[0].reason);
    if (o.state === "full") return o.am === o.pm ? "booked all day by " + B.nameOf(o.am) : "booked morning and afternoon";
    if (o.state === "part") return (o.am ? "morning" : "afternoon") + " booked by " + B.nameOf(o.am || o.pm) + ", other half free";
    if (o.state === "pending") return o.enquiries.length + " enquiry, not yet confirmed";
    return "available";
  }
  function paint() {
    $$(".day[data-date]", gridEl).forEach(function (c) {
      var d = c.getAttribute("data-date"), on = sel && d >= sel.a && d <= sel.b;
      c.classList.toggle("is-sel", !!on);
      c.classList.toggle("is-sel-a", !!on && d === sel.a);
      c.classList.toggle("is-sel-b", !!on && d === sel.b);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (sel && ym(sel.a) === view) { var f = gridEl.querySelector('[data-date="' + sel.a + '"]'); if (f) { $$(".day[tabindex='0']", gridEl).forEach(function (x) { x.tabIndex = -1; }); f.tabIndex = 0; } }
    if (typeof history.replaceState === "function" && location.hash.indexOf("#calendar") === 0 && location.hash !== "#calendar/" + view) history.replaceState(null, "", "#calendar/" + view);
    headEl.querySelector(".cal__m").textContent = monthLabel(view);
    var mi = headEl.querySelector("input[type=month]"); if (mi) mi.value = view; else { var j = headEl.querySelector(".cal__jump"); if (j) { j.classList.add("is-static"); } }
  }

  /* ---------------------------------------------------------------- panel */
  function drawPanel() {
    var host = panelEl; host.innerHTML = "";
    document.body.classList.toggle("cal-open", !!sel);
    if (!sel) {
      var t0 = B.today(), agenda = E("div", { class: "cal__agenda" });
      for (var i = 0; i < 7; i++) (function (d) {
        var o = B.occupancy(d), b = o.am || o.pm;
        var txt = o.state === "blocked" ? "Blocked · " + B.reasonLabel(o.blocks[0].reason) : o.state === "full" ? (o.am === o.pm ? (o.am.customer.name || o.am.ref) + " · full day" : "Morning " + firstName(o.am) + " · afternoon " + firstName(o.pm)) : o.state === "part" ? (o.am ? "Morning " : "Afternoon ") + (b.customer.name || b.ref) + " · " + (o.am ? "afternoon" : "morning") + " free" : o.state === "pending" ? "Free · " + o.enquiries.length + " enquir" + (o.enquiries.length > 1 ? "ies" : "y") : "Free";
        agenda.appendChild(E("button", { type: "button", class: "cal__ag cal__ag--" + o.state, onclick: function () { if (ym(d) !== view) { view = ym(d); drawGrid(); } select(d, d); } }, [E("b", { text: i === 0 ? "Today" : i === 1 ? "Tomorrow" : short(d) }), E("span", { text: txt })]));
      })(B.addDays(t0, i));
      host.appendChild(E("div", { class: "cal__hint" }, [
        E("h3", { text: "Pick a day" }),
        E("p", { class: "body", text: "Click a day to see it. Drag across days to choose a range. Then block it, free it, or add a booking." }),
        E("h3", { text: "The next seven days", style: "margin-top:1.1rem" }), agenda,
        legend()
      ]));
      return;
    }
    var days = range(sel.a, sel.b), one = days.length === 1, t = B.today();
    var os = days.map(B.occupancy);
    var nBlocked = os.filter(function (o) { return o.blocks.length; }).length, nBooked = os.filter(function (o) { return o.booked; }).length;
    var nPast = days.filter(function (d) { return d < t; }).length, nFree = os.filter(function (o) { return o.date >= t && (o.state === "free" || o.state === "pending"); }).length;
    var past = nPast === days.length;
    if (rangeMode) {
      host.appendChild(E("div", { class: "cal__selh" }, [E("div", {}, [E("h3", { text: "Now tap the last day" }), E("p", { class: "sub", text: "The range starts on " + short(sel.a) + "." })]), E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Cancel", onclick: function () { rangeMode = false; drawPanel(); } })]));
      return;
    }
    host.appendChild(E("div", { class: "cal__selh" }, [
      E("div", {}, [E("h3", { text: one ? short(sel.a) : short(sel.a) + " – " + short(sel.b) }), E("p", { class: "sub", text: one ? describeLong(os[0]) : days.length + " days · " + [nBooked ? nBooked + " booked" : "", nBlocked ? nBlocked + " blocked" : "", nFree ? nFree + " free" : "", nPast ? nPast + " passed" : ""].filter(Boolean).join(", ") })]),
      E("div", { class: "acts", style: "flex-wrap:nowrap" }, [one && !past ? E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Select a range", onclick: function () { rangeMode = true; drawPanel(); } }) : null, A.iconBtn("x", "Clear selection", function () { select(null); })])
    ]));
    // bookings on the selected days
    var bks = [], clashes = [];
    os.forEach(function (o) { [o.am, o.pm].forEach(function (b) { if (b && bks.indexOf(b) < 0) bks.push(b); }); o.clash.forEach(function (b) { if (bks.indexOf(b) < 0) { bks.push(b); clashes.push(b); } }); o.enquiries.forEach(function (q) { if (bks.indexOf(q) < 0) bks.push(q); }); });
    if (clashes.length) host.appendChild(E("div", { class: "note note--bad", text: "Double-booked: two confirmed bookings hold the same time. Open one and move it to another day, or cancel it." }));
    var lists = E("div", { class: "cal__lists" });
    if (bks.length) lists.appendChild(E("div", { class: "cal__list" }, bks.map(function (b) {
      return E("a", { class: "cal__bk cal__bk--" + b.status + (clashes.indexOf(b) > -1 ? " cal__bk--clash" : ""), href: "#bookings/" + b.id }, [
        E("span", { class: "cal__bk__dot" }),
        E("span", {}, [E("b", { text: B.nameOf(b) }), E("span", { class: "s", text: (one ? "" : B.fmtDate(b.date) + " · ") + (b.excursionTitle || "Charter") + " · " + B.slotLabel(b.slot || "day").toLowerCase() + " · " + b.guests + " guests" + (b.status === "enquiry" ? " · enquiry, not confirmed" : clashes.indexOf(b) > -1 ? " · clashes" : "") })]),
        E("span", { class: "chev", html: svg("chev") })
      ]);
    })));
    // blocks on the selected days
    var bls = []; os.forEach(function (o) { o.blocks.forEach(function (b) { if (bls.indexOf(b) < 0) bls.push(b); }); });
    if (bls.length) lists.appendChild(E("div", { class: "cal__list" }, bls.map(function (b) {
      return E("div", { class: "cal__bk cal__bk--block" }, [E("span", { class: "cal__bk__dot" }), E("span", {}, [E("b", { text: "Blocked · " + B.reasonLabel(b.reason) }), E("span", { class: "s", text: (b.from === b.to ? B.fmtDate(b.from) : B.fmtDate(b.from) + " – " + B.fmtDate(b.to)) + (b.note ? " · " + b.note : "") })])]);
    })));
    // actions
    var acts = E("div", { class: "cal__acts" });
    var future = days.filter(function (d) { return d >= t; }), from = future[0], to = future[future.length - 1];
    var blockable = future.filter(function (d) { var o = B.occupancy(d); return !o.booked && !o.blocks.length; });
    var stayBooked = future.filter(function (d) { return B.occupancy(d).booked; });
    var futBlocked = future.filter(function (d) { return B.occupancy(d).blocks.length; }).length;
    var undoable = function (done, msg) { toast(msg, "ok", { label: "Undo", run: function () { B.undo(done); if (A.route().id === "calendar") refresh(); else A.render(); } }); };
    if (past) acts.appendChild(E("p", { class: "note", text: one ? "This day has passed — shown for the record." : "These days have passed — shown for the record." }));
    else {
      if (days.length > future.length) acts.appendChild(E("p", { class: "sub", text: (days.length - future.length) + " of these days " + (days.length - future.length === 1 ? "has" : "have") + " passed and will not change." }));
      if (futBlocked) acts.appendChild(E("button", { class: "btn btn--ghost", type: "button", text: futBlocked === future.length ? (one ? "Unblock this day" : "Unblock these " + future.length + " days") : "Unblock the " + futBlocked + " blocked day" + (futBlocked > 1 ? "s" : ""), onclick: function () {
        var done = B.unblock(from, to);
        undoable(done, one ? "Unblocked " + short(sel.a) + "." : "Unblocked " + futBlocked + " day" + (futBlocked > 1 ? "s" : "") + "."); refresh();
      } }));
      if (blockable.length) {
        var rid = "blk-" + Math.random().toString(36).slice(2, 7);
        var form = E("div", { class: "cal__block", role: "group", "aria-label": "Block days" }, [
          E("div", { class: "field" }, [E("label", { for: rid + "r", text: "Why" }), (function () { var s = E("select", { id: rid + "r" }); B.REASONS.forEach(function (r) { s.appendChild(E("option", { value: r[0], text: r[1], selected: r[0] === reason })); }); s.addEventListener("change", function () { reason = s.value; }); return s; })()]),
          E("div", { class: "field" }, [E("label", { for: rid + "n", text: "Note (optional)" }), (function () { var i = E("input", { id: rid + "n", value: note, placeholder: "e.g. engine service" }); i.addEventListener("input", function () { note = i.value; }); return i; })()]),
          E("button", { class: "btn", type: "button", text: one ? "Block this day" : "Block " + blockable.length + (blockable.length === future.length ? " days" : " free day" + (blockable.length > 1 ? "s" : "")), onclick: function () {
            // consecutive free days become one block, so the panel shows one card
            var runs = []; blockable.forEach(function (d) { var r = runs[runs.length - 1]; if (r && B.addDays(r.to, 1) === d) r.to = d; else runs.push({ from: d, to: d }); });
            var done = B.joinDone(runs.map(function (r) { return B.block(r.from, r.to, reason, note, true); })); B.save(); note = "";
            undoable(done, (one ? short(sel.a) : blockable.length + " day" + (blockable.length > 1 ? "s" : "")) + " blocked — no booking can land there."); refresh();
          } }),
          stayBooked.length ? E("ul", { class: "cal__skip" }, stayBooked.map(function (d) { var o = B.occupancy(d), b = o.am || o.pm; return E("li", { text: short(d) + " · " + B.nameOf(b) + " stays booked" }); })) : null
        ]);
        acts.appendChild(form);
      } else if (!futBlocked && nBooked) acts.appendChild(E("p", { class: "sub", text: one ? "Booked — a booked day cannot be blocked. Cancel or move the booking first." : "Every day here is booked — booked days cannot be blocked." }));
      if (one && nBlocked && !os[0].booked) acts.appendChild(E("p", { class: "sub", text: "Blocked — unblock it to take a booking." }));
      if (one && !nBlocked && !os[0].full && !os[0].clash.length) acts.appendChild(E("button", { class: "btn btn--go", type: "button", text: os[0].booked ? "Book the free " + (os[0].am ? "afternoon" : "morning") : "New booking on this day", onclick: function () {
        var o = os[0], p = { date: sel.a }; if (o.am) p.slot = "pm"; else if (o.pm) p.slot = "am";
        B.newBooking(p, function (b) { toast("Booking " + b.ref + " saved" + (b.status === "enquiry" ? " as an enquiry." : " — the day is taken."), "ok"); refresh(); });
      } }));
    }
    host.appendChild(acts);
    host.appendChild(lists);
  }
  function describeLong(o) {
    if (o.state === "clash") return "Double-booked — two confirmed bookings hold the same time. Move or cancel one.";
    if (o.state === "blocked") return "Blocked — " + B.reasonLabel(o.blocks[0].reason) + (o.blocks[0].note ? " · " + o.blocks[0].note : "");
    if (o.state === "full") return o.am === o.pm ? "Booked, full day" : "Booked, morning and afternoon";
    if (o.state === "part") return "Booked " + (o.am ? "morning" : "afternoon") + " — " + (o.am ? "afternoon" : "morning") + " still free";
    if (o.state === "pending") return "Available — " + o.enquiries.length + (o.enquiries.length > 1 ? " enquiries" : " enquiry") + " waiting";
    return "Available";
  }
  function legend() {
    var l = E("div", { class: "cal__legend" }, [["free", "Available"], ["full", "Booked"], ["part", "Half day booked"], ["pending", "Enquiry"], ["blocked", "Blocked"]].map(function (x) { return E("span", {}, [E("i", { class: "lg lg--" + x[0] }), x[1]]); }));
    l.appendChild(E("span", { class: "mute lg-note lg-note--wide", text: "Half days are marked AM or PM" }));
    l.appendChild(E("span", { class: "mute lg-note lg-note--narrow", text: "Left half = morning · right half = afternoon" }));
    return l;
  }
  function refresh() { drawGrid(); drawPanel(); A.renderNav(); if (sel) { var f = gridEl.querySelector('[data-date="' + sel.a + '"]'); if (f && document.activeElement === document.body) f.focus({ preventScroll: true }); } }

  /* ---------------------------------------------------------------- input */
  function wire() {
    gridEl.addEventListener("mousedown", function (e) {
      var c = e.target.closest(".day[data-date]"); if (!c || e.button !== 0) return;
      e.preventDefault(); dragging = true; dragMoved = false; dragFrom = c.getAttribute("data-date"); shiftHeld = e.shiftKey;
    });
    gridEl.addEventListener("mouseover", function (e) {
      if (!dragging) return; var c = e.target.closest(".day[data-date]"); if (!c) return;
      var d = c.getAttribute("data-date"); if (d !== dragFrom || dragMoved) { dragMoved = true; sel = { a: d < dragFrom ? d : dragFrom, b: d < dragFrom ? dragFrom : d }; anchor = sel.a; paint(); }
    });
    if (!wire.docBound) document.addEventListener("mouseup", function () {
      if (!dragging) return; dragging = false;
      if (dragMoved) select(sel.a, sel.b); else if (shiftHeld) shiftTap(dragFrom); else tap(dragFrom);
      dragFrom = null; dragMoved = false; shiftHeld = false;
    }); wire.docBound = true;
    // touch: a tap is a click; no drag (the page needs to scroll)
    gridEl.addEventListener("click", function (e) {
      if (e.detail === 0) { var c = e.target.closest(".day[data-date]"); if (c) tap(c.getAttribute("data-date")); }   // keyboard activation
    });
    gridEl.addEventListener("keydown", function (e) {
      var c = e.target.closest(".day[data-date]"); if (!c) return;
      var d = c.getAttribute("data-date"), n = null;
      if (e.key === "ArrowLeft") n = B.addDays(d, -1); else if (e.key === "ArrowRight") n = B.addDays(d, 1);
      else if (e.key === "ArrowUp") n = B.addDays(d, -7); else if (e.key === "ArrowDown") n = B.addDays(d, 7);
      else if (e.key === "Escape") { select(null); return; }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (e.shiftKey) shiftTap(d); else tap(d); return; }
      if (!n) return; e.preventDefault();
      if (ym(n) !== view) { view = ym(n); drawGrid(); }
      var f = gridEl.querySelector('[data-date="' + n + '"]'); if (f) { $$(".day[tabindex='0']", gridEl).forEach(function (x) { x.tabIndex = -1; }); f.tabIndex = 0; f.focus(); }
    });
    headEl.querySelector("[data-prev]").addEventListener("click", function () { view = shiftMonth(view, -1); drawGrid(); });
    headEl.querySelector("[data-next]").addEventListener("click", function () { view = shiftMonth(view, 1); drawGrid(); });
    headEl.querySelector("[data-today]").addEventListener("click", function () { view = ym(B.today()); drawGrid(); });
  }
  /* a tap moves the selection; a second tap on the same day clears it; a range
     is a drag with the mouse, shift+click, or "Select a range" then a tap */
  function tap(d) {
    if (rangeMode && sel) { rangeMode = false; return select(sel.a, d); }
    if (sel && sel.a === sel.b && d === sel.a) return select(null);
    select(d, d);
  }
  function shiftTap(d) { if (sel) select(anchor || sel.a, d); else select(d, d); }

  /* ---------------------------------------------------------------- section */
  A.register({ id: "calendar", group: "Books", label: "Calendar", icon: "cal", order: 0, render: function (host, arg) {
    if (!view) view = ym(B.today());
    if (arg && VALID_M.test(arg)) view = arg; else if (arg) history.replaceState(null, "", "#calendar");
    rangeMode = false;
    var wrap = E("div", { class: "cal" });
    headEl = E("div", { class: "cal__head" }, [
      E("div", { class: "cal__nav" }, [A.iconBtn("chevl", "Previous month", null, "btn--ghost"), E("label", { class: "cal__jump", title: "Jump to a month" }, [E("h2", { class: "cal__m" }), (function () { var i = E("input", { type: "month", "aria-label": "Jump to a month" }); if (i.type !== "month") return E("span", { hidden: true }); i.addEventListener("change", function () { if (VALID_M.test(i.value)) { view = i.value; drawGrid(); } }); return i; })(), E("span", { class: "cal__jump__i", html: svg("down"), "aria-hidden": "true" })]), A.iconBtn("chev", "Next month", null, "btn--ghost")]),
      E("div", { class: "acts" }, [E("span", { class: "booksSync badge" }), E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Today" }), E("button", { class: "btn btn--go btn--sm", type: "button", text: "New booking", onclick: function () { B.newBooking(sel && sel.a === sel.b ? { date: sel.a } : null, function (b) { toast("Booking " + b.ref + " saved.", "ok"); refresh(); }); } })])
    ]);
    headEl.querySelectorAll(".btn--icon")[0].setAttribute("data-prev", ""); headEl.querySelectorAll(".btn--icon")[1].setAttribute("data-next", "");
    headEl.querySelector(".btn--ghost.btn--sm").setAttribute("data-today", "");
    gridEl = E("div", { class: "cal__grid", "aria-label": "Availability, one button per day" });
    var dow = E("div", { class: "cal__dow" }, DOW.map(function (d) { return E("span", { text: d }); }));
    panelEl = E("div", { class: "cal__panel" });
    sheetEl = E("aside", { class: "cal__side" }, [panelEl]);
    wrap.appendChild(E("div", { class: "cal__main card" }, [headEl, dow, gridEl, E("div", { class: "cal__foot" }, [legend()])]));
    wrap.appendChild(sheetEl);
    host.appendChild(wrap);
    wire(); drawGrid(); drawPanel(); B.sync();
  } });
  window.Calendar = { select: select, refresh: refresh };
})(window.Admin);
