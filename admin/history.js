/* ==========================================================================
   CORAVIDA — history.
   The log the books write on every change: who, when, what.
   ========================================================================== */
(function (A) {
  "use strict";
  var E = A.E, $ = A.$, $$ = A.$$, esc = A.esc, svg = A.svg, toast = A.toast, B = window.Books;
  var KINDS = [["all", "Everything"], ["booking", "Bookings"], ["block", "Calendar"], ["money", "Money"], ["books", "Books & settings"]];
  var when = function (iso) { var d = new Date(iso); return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };
  var dayOf = function (iso) { var d = new Date(iso); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  var dayLabel = function (k) { var t = B.today(); return k === t ? "Today" : k === B.addDays(t, -1) ? "Yesterday" : B.parse(k).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); };
  var inKind = function (e, k) { return k === "all" || (k === "money" ? /invoice|payment|expense/.test(e.kind) : k === "books" ? /books|settings/.test(e.kind) : e.kind === k); };
  var ACT = { created: "info", edited: "", confirmed: "ok", completed: "navy", cancelled: "bad", blocked: "warn", unblocked: "ok", undone: "", received: "ok", removed: "bad", deleted: "bad", added: "info", saved: "", restored: "warn", cleared: "bad", sample: "" };

  /* a list of entries, newest first, grouped by day */
  function list(entries, host, opts) {
    opts = opts || {};
    host.innerHTML = "";
    if (!entries.length) { host.appendChild(E("p", { class: "small mute", text: opts.empty || "Nothing recorded yet." })); return; }
    var groups = {}, order = [];
    entries.forEach(function (e) { var k = dayOf(e.at); if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(e); });
    order.forEach(function (k) {
      host.appendChild(E("h4", { class: "hist__day", text: dayLabel(k) }));
      groups[k].forEach(function (e) {
        var row = E(e.link ? "a" : "div", { class: "hist__row", href: e.link || null }, [
          E("span", { class: "hist__t", text: when(e.at) }),
          E("span", { class: "badge badge--" + (ACT[e.act] || ""), text: e.act }),
          E("span", { class: "hist__x" }, [E("b", { text: e.text || "" }), E("span", { class: "s", text: e.who ? " · " + e.who : "" })])
        ]);
        host.appendChild(row);
      });
    });
  }

  A.register({ id: "history", group: "Books", label: "History", icon: "clock", order: 9, render: function (host) {
    var kind = A.lsGet("cv:hist:k", "all"), q = "";
    host.appendChild(E("div", { class: "pagehead" }, [E("div", {}, [E("h2", { text: "History" }), E("p", { text: "Every change to the books, by whom and when." })]), E("span", { class: "booksSync badge" })]));
    var card = E("div", { class: "card" }), body = E("div", { class: "hist" });
    var search = E("input", { placeholder: "Search a name, a reference, a date…" });
    var seg = E("div", { class: "seg" }); KINDS.forEach(function (k) { seg.appendChild(E("button", { type: "button", class: k[0] === kind ? "on" : "", text: k[1], onclick: function () { kind = k[0]; A.lsSet("cv:hist:k", kind); $$("button", seg).forEach(function (b, i) { b.classList.toggle("on", KINDS[i][0] === kind); }); draw(); } })); });
    function draw() {
      var all = B.live("log").slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; })
        .filter(function (e) { return inKind(e, kind); })
        .filter(function (e) { if (!q) return true; return ((e.text || "") + " " + (e.ref || "") + " " + (e.who || "") + " " + e.act).toLowerCase().indexOf(q) > -1; });
      list(all.slice(0, 400), body, { empty: q ? "Nothing matches." : "Nothing recorded yet — changes appear here as they are made." });
      if (all.length > 400) body.appendChild(E("p", { class: "small mute", text: "Showing the latest 400 of " + all.length + "." }));
    }
    search.addEventListener("input", function () { q = search.value.trim().toLowerCase(); draw(); });
    card.appendChild(E("div", { class: "filters" }, [seg, E("div", { class: "search" }, [search]), E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Export CSV", onclick: function () {
      var rows = [["When", "Device", "Kind", "Action", "What", "Ref"]].concat(B.live("log").map(function (e) { return [e.at, e.who, e.kind, e.act, e.text, e.ref]; }));
      var text = rows.map(function (r) { return r.map(function (c) { c = String(c == null ? "" : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(","); }).join("\n");
      var a = E("a", { href: "data:text/csv;charset=utf-8," + encodeURIComponent("﻿" + text), download: "coravida-history.csv" }); document.body.appendChild(a); a.click(); a.remove();
    } })]));
    card.appendChild(body); draw(); host.appendChild(card);
    host.appendChild(versions());
    B.sync();
  } });

  /* where the record itself lives */
  function versions() {
    return E("div", { class: "card" }, [E("h2", { text: "Where this is kept" }),
      E("p", { class: "body", text: "The books live in the Coravida database, shared by every device the moment something changes. Nothing is ever deleted outright — a removed record is only marked, so it stays in this history — and Settings offers a full backup file at any time." })]);
  }
  /* the story of one booking, for its page */
  window.History = { forRef: function (ref, host) {
    var entries = B.live("log").filter(function (e) { return e.ref === ref; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    list(entries, host, { empty: "No changes recorded for this booking yet." });
  } };
})(window.Admin);
