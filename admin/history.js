/* ==========================================================================
   CORAVIDA — history.
   Two records of everything: the log the books write on every change (who,
   when, what), and the versions GitHub keeps — one commit per save — any of
   which can be looked at or put back.
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
    host.appendChild(E("div", { class: "pagehead" }, [E("div", {}, [E("h2", { text: "History" }), E("p", { text: "Every change to the books, by whom and when — and every earlier version, kept on GitHub." })]), E("span", { class: "booksSync badge" })]));
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

  /* the GitHub side: one commit per save */
  function versions() {
    var card = E("div", { class: "card" }), body = E("div");
    card.appendChild(E("div", { class: "card__h" }, [E("div", {}, [E("h2", { text: "Earlier versions" }), E("p", { text: "The books are saved to your private repository on every change. Any version can be looked at, or put back." })])]));
    card.appendChild(body);
    if (!A.token()) { body.appendChild(E("div", { class: "note note--warn", html: "Add a GitHub token in <a href='#settings'>Settings</a> to see the versions kept on GitHub." })); return card; }
    var s = A.settings();
    body.appendChild(E("p", { class: "small mute", text: "Loading versions…" }));
    A.gh.commits(s.booksRepo, s.booksPath, 40).then(function (cs) {
      body.innerHTML = "";
      if (!cs.length) return body.appendChild(E("p", { class: "small mute", text: "No versions yet." }));
      var lst = E("div", { class: "list" });
      cs.forEach(function (c, i) {
        var d = new Date(c.commit.author.date), msg = c.commit.message.split("\n")[0];
        lst.appendChild(E("div", { class: "list__i" }, [
          E("div", {}, [E("b", { style: "font-weight:500", text: d.toLocaleString([], { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + (i === 0 ? " · current" : "") }), E("div", { class: "s", text: msg + " · " + c.sha.slice(0, 7) })]),
          E("div", { class: "acts" }, [
            E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Look", onclick: function () { peek(c); } }),
            i ? E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Put back", onclick: function () { putBack(c); } }) : null
          ])
        ]));
      });
      body.appendChild(lst);
      body.appendChild(E("p", { class: "small mute", html: "Older still: the full history is in the repository — <a href='https://github.com/" + esc(s.owner) + "/" + esc(s.booksRepo) + "/commits/main/" + esc(s.booksPath) + "' target='_blank' rel='noopener'>see it on GitHub ↗</a>." }));
    }).catch(function (e) { body.innerHTML = ""; body.appendChild(E("div", { class: "note note--bad", text: e.message })); });
    return card;
  }
  function fetchVersion(c) { var s = A.settings(); return A.gh.read(s.booksRepo, s.booksPath, c.sha).then(function (r) { return B.shape(JSON.parse(r.text)); }); }
  function peek(c) {
    fetchVersion(c).then(function (v) {
      var live = function (k) { return (v[k] || []).filter(function (x) { return !x.deleted; }); };
      var node = E("div", {}, [
        E("p", { class: "body", text: "Saved " + new Date(c.commit.author.date).toLocaleString() + " from this version:" }),
        E("ul", { class: "cal__skip" }, [
          E("li", { text: live("bookings").length + " bookings (" + live("bookings").filter(function (b) { return b.status === "confirmed"; }).length + " confirmed)" }),
          E("li", { text: live("invoices").length + " invoices, " + live("payments").length + " payments, " + live("expenses").length + " expenses" }),
          E("li", { text: live("blocks").length + " blocked periods on the calendar" }),
          E("li", { text: "T-GST " + v.settings.tgst + "% · next invoice " + v.settings.prefix + "-" + String(v.settings.nextInvoice).padStart(4, "0") })
        ]),
        E("p", { class: "small mute", text: "Put back replaces the books with this version; the version you have now stays on GitHub too, so nothing is ever lost." })
      ]);
      A.dialog({ title: "Version " + c.sha.slice(0, 7), node: node, actions: [["Close", "btn--ghost", null], ["Put back this version", "btn--go", "ok"]] }).then(function (r) { if (r === "ok") putBack(c); });
    }).catch(function (e) { toast(e.message, "err"); });
  }
  function putBack(c) {
    A.confirm("Put back the version from " + new Date(c.commit.author.date).toLocaleString() + "?", "The books go back to exactly what they were then. The current version stays on GitHub, so this can be undone the same way.", "Put back", true).then(function (ok) {
      if (!ok) return;
      fetchVersion(c).then(function (v) {
        ["bookings", "invoices", "payments", "expenses", "blocks", "log"].forEach(function (k) { (v[k] || []).forEach(function (x) { x.updated = new Date().toISOString(); }); });
        v.settings.updated = new Date().toISOString();
        B.setAll(v); B.logIt("books", "restored", "Version " + c.sha.slice(0, 7) + " from " + new Date(c.commit.author.date).toLocaleString() + " put back", "#history"); B.save(true);
        toast("Put back. The books are as they were.", "ok"); A.render();
      }).catch(function (e) { toast(e.message, "err"); });
    });
  }

  /* the story of one booking, for its page */
  window.History = { forRef: function (ref, host) {
    var entries = B.live("log").filter(function (e) { return e.ref === ref; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    list(entries, host, { empty: "No changes recorded for this booking yet." });
  } };
})(window.Admin);
