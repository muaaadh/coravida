/* ==========================================================================
   CORAVIDA — behaviour. Chrome, video, reveals, rail, lightbox, forms.
   No dependencies.
   ========================================================================== */
(function () {
  "use strict";

  var CV = window.CV || {}, B = CV.brand || {};
  var ROOT = document.documentElement.getAttribute("data-root") || "";
  var PAGE = document.documentElement.getAttribute("data-page") || "";
  var SLOW = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SAVE = (navigator.connection && (navigator.connection.saveData ||
              /^([23]g|slow-2g)$/.test(navigator.connection.effectiveType || ""))) || false;

  function u(p) { return ROOT + p; }
  function el(h) { var t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstElementChild; }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  var ARROW = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 9.5 9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.1" stroke-linecap="square"/></svg>';
  var L = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M7.5 1.5 3 6l4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>';
  var R = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4.5 1.5 9 6l-4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>';
  var X = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>';

  /* ---- Chrome ---------------------------------------------------------- */
  function chrome() {
    var h = $('[data-chrome="header"]');
    if (h) {
      h.replaceWith(el(
        '<header class="hdr" id="hdr"><div class="hdr__in">' +
          '<div class="hdr__l"><button class="burger" type="button" id="burger" aria-expanded="false" aria-controls="menu"><i aria-hidden="true"></i>Menu</button></div>' +
          '<div class="hdr__m"><a class="hdr__logo" href="' + u("index.html") + '" aria-label="' + B.name + ' — home">' +
            '<img class="light" src="' + u("assets/img/logo-mark-white.png") + '" alt="' + B.name + '" width="66" height="28">' +
            '<img class="dark" src="' + u("assets/img/logo-mark.png") + '" alt="' + B.name + '" width="66" height="28"></a></div>' +
          '<div class="hdr__r"><span class="hdr__lang">EN</span>' +
            '<a class="btn btn--white" href="' + u("enquire.html") + '">Book</a></div>' +
        '</div></header>'
      ));
      document.body.insertBefore(menuEl(), document.body.firstChild);
    }
    var f = $('[data-chrome="footer"]');
    if (f) f.replaceWith(footerEl());
  }

  function menuEl() {
    var links = (CV.nav || []).map(function (n) {
      return '<li><a' + (PAGE && n.href.indexOf(PAGE) === 0 ? ' class="here"' : "") + ' href="' + u(n.href) + '">' + n.label + "</a></li>";
    }).join("");
    return el(
      '<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu" hidden>' +
        '<div class="menu__bar"><div class="hdr__in">' +
          '<div class="hdr__l"><button class="menu__x" type="button" id="menuX">' + X + "Close</button></div>" +
          '<div class="hdr__m"><a class="hdr__logo" href="' + u("index.html") + '" aria-label="' + B.name + '"><img src="' + u("assets/img/logo-mark.png") + '" alt="' + B.name + '" width="66" height="28"></a></div>' +
          '<div class="hdr__r"><a class="btn" href="' + u("enquire.html") + '">Book</a></div>' +
        "</div></div>" +
        '<div class="menu__body"><div>' +
          '<nav class="menu__nav" aria-label="Primary"><ul>' + links + "</ul></nav>" +
          '<div class="menu__foot">' +
            '<a class="small" href="' + B.phoneHref + '">' + B.phone + "</a>" +
            '<a class="small" href="mailto:' + B.email + '">' + B.email + "</a>" +
            '<span class="small">' + B.marina + "</span>" +
          "</div>" +
        "</div></div>" +
      "</div>"
    );
  }

  function footerEl() {
    var links = (CV.nav || []).map(function (n) { return '<li><a href="' + u(n.href) + '">' + n.label + "</a></li>"; }).join("") +
      '<li><a href="' + u("enquire.html") + '">Enquire</a></li>';
    return el(
      '<footer class="ftr"><div class="wrap"><div class="ftr__top">' +
        '<div><img src="' + u("assets/img/logo-full-white.png") + '" alt="' + B.name + '" width="93" height="48" loading="lazy">' +
          '<p class="small" style="margin-top:1.4rem;max-width:24ch;color:rgba(255,255,255,.58)">' + B.tagline + ".</p></div>" +
        '<div><h4>Explore</h4><ul>' + links + "</ul></div>" +
        '<div><h4>Coravida</h4><ul>' +
          '<li><a href="' + B.phoneHref + '">' + B.phone + "</a></li>" +
          '<li><a href="mailto:' + B.email + '">' + B.email + "</a></li>" +
          "<li>" + B.marina + "</li><li>" + (B.address || []).join(", ") + "</li><li>" + B.hours + "</li>" +
        "</ul></div>" +
      "</div><div class=\"ftr__b\"><span>© " + B.year + " " + B.legal + "</span><span>" + B.vessel + "</span>" +
      '<span>Site by <a href="https://dheemi.com" rel="noopener">Dheemi Studio</a></span></div></div></footer>'
    );
  }

  /* ---- Header ---------------------------------------------------------- */
  function header() {
    var h = $("#hdr"); if (!h) return;
    var last = 0;
    function tick() {
      var y = window.scrollY || 0;
      h.classList.toggle("solid", y > 40);
      if (y > 460 && y > last + 4 && !document.body.classList.contains("lock")) h.classList.add("up");
      else if (y < last - 4 || y < 140) h.classList.remove("up");
      last = y;
    }
    tick(); window.addEventListener("scroll", tick, { passive: true });
  }

  /* ---- Menu ------------------------------------------------------------ */
  function menu() {
    var m = $("#menu"), b = $("#burger"), x = $("#menuX");
    if (!m || !b) return;
    var prev = null;
    function open() {
      prev = document.activeElement; m.hidden = false;
      requestAnimationFrame(function () { m.classList.add("open"); });
      document.body.classList.add("lock"); b.setAttribute("aria-expanded", "true");
      setTimeout(function () { x && x.focus(); }, 50);
    }
    function close() {
      m.classList.remove("open"); document.body.classList.remove("lock");
      b.setAttribute("aria-expanded", "false");
      setTimeout(function () { m.hidden = true; }, 460);
      prev && prev.focus();
    }
    b.addEventListener("click", open);
    x && x.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (!m.classList.contains("open")) return;
      if (e.key === "Escape") return close();
      if (e.key !== "Tab") return;
      var f = $$("a[href], button:not([disabled])", m).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    });
  }

  /* ---- Video ----------------------------------------------------------- */
  function start(v) {
    if (v.dataset.started) return;
    v.dataset.started = "1";
    var base = v.getAttribute("data-src");
    var w = window.innerWidth * (window.devicePixelRatio > 1.5 ? 1.4 : 1);
    v.src = u("assets/video/" + base + (w > 1200 ? "-1080" : w > 700 ? "-720" : "-540") + ".mp4");
    v.addEventListener("canplay", function () {
      v.classList.add("on");
      var p = v.play();
      if (p && p.catch) p.catch(function () { v.classList.remove("on"); });
    }, { once: true });
    v.load();
  }
  function video() {
    var vids = $$("video[data-src]");
    if (!vids.length || SLOW || SAVE) return;   // poster image stands in
    var eager = vids.filter(function (v) { return v.hasAttribute("data-eager"); });
    var lazy = vids.filter(function (v) { return !v.hasAttribute("data-eager"); });
    function go() { eager.forEach(start); }
    if (document.readyState === "complete") setTimeout(go, 120);
    else window.addEventListener("load", function () { setTimeout(go, 120); });
    if (!lazy.length) return;
    if (!("IntersectionObserver" in window)) return lazy.forEach(start);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { start(e.target); io.unobserve(e.target); } });
    }, { rootMargin: "300px 0px" });
    lazy.forEach(function (v) { io.observe(v); });
  }

  /* ---- Reveals --------------------------------------------------------- */
  function reveals() {
    var n = $$("[data-rv], .rvl");
    if (!("IntersectionObserver" in window) || SLOW) return n.forEach(function (x) { x.classList.add("in"); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px", threshold: .06 });
    n.forEach(function (x) { io.observe(x); });
  }

  /* ---- Rail ------------------------------------------------------------ */
  function rails() {
    $$(".rail").forEach(function (rail) {
      var t = $(".rail__track", rail), p = $("[data-prev]", rail), n = $("[data-next]", rail);
      if (!t) return;
      function step() { var i = $(".rail__item", t); return i ? i.getBoundingClientRect().width + 24 : 400; }
      function sync() { if (!p || !n) return; p.disabled = t.scrollLeft < 8; n.disabled = t.scrollLeft + t.clientWidth >= t.scrollWidth - 8; }
      p && p.addEventListener("click", function () { t.scrollBy({ left: -step(), behavior: SLOW ? "auto" : "smooth" }); });
      n && n.addEventListener("click", function () { t.scrollBy({ left: step(), behavior: SLOW ? "auto" : "smooth" }); });
      t.addEventListener("scroll", sync, { passive: true });
      window.addEventListener("resize", sync); sync();
    });
  }

  /* ---- Filters --------------------------------------------------------- */
  function filters() {
    var bar = $("[data-filters]"); if (!bar) return;
    var items = $$("[data-cat]");
    $$("button", bar).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filter");
        $$("button", bar).forEach(function (o) { o.classList.toggle("on", o === b); });
        items.forEach(function (i) { i.hidden = !(f === "all" || i.getAttribute("data-cat") === f); });
      });
    });
  }

  /* ---- Lightbox -------------------------------------------------------- */
  function lightbox() {
    var t = $$("[data-lb]"); if (!t.length) return;
    var box = el('<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Image viewer" hidden>' +
      '<button class="lb__x" type="button" data-x aria-label="Close">' + X + "</button>" +
      '<button class="lb__p" type="button" data-p aria-label="Previous">' + L + "</button>" +
      '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="">' +
      '<button class="lb__n" type="button" data-n aria-label="Next">' + R + "</button>" +
      '<p class="lb__c"></p></div>');
    document.body.appendChild(box);
    var img = $("img", box), cap = $(".lb__c", box), i = 0, from = null;
    function vis() { return t.filter(function (x) { var f = x.closest("[data-cat]"); return !f || !f.hidden; }); }
    function show(n) {
      var l = vis(); if (!l.length) return;
      i = (n + l.length) % l.length;
      img.src = l[i].getAttribute("data-lb");
      img.alt = l[i].getAttribute("data-alt") || "";
      cap.textContent = l[i].getAttribute("data-cap") || "";
    }
    function open(x) {
      from = x; show(vis().indexOf(x)); box.hidden = false;
      requestAnimationFrame(function () { box.classList.add("open"); });
      document.body.classList.add("lock"); $("[data-x]", box).focus();
    }
    function close() {
      box.classList.remove("open"); document.body.classList.remove("lock");
      setTimeout(function () { box.hidden = true; }, 300); from && from.focus();
    }
    t.forEach(function (x) { x.addEventListener("click", function (e) { e.preventDefault(); open(x); }); });
    $("[data-x]", box).addEventListener("click", close);
    $("[data-p]", box).addEventListener("click", function () { show(i - 1); });
    $("[data-n]", box).addEventListener("click", function () { show(i + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(i - 1);
      if (e.key === "ArrowRight") show(i + 1);
    });
  }

  /* ---- Accordion ------------------------------------------------------- */
  function accordion() {
    $$(".acc__i").forEach(function (item) {
      var b = $(".acc__b", item); if (!b) return;
      b.setAttribute("aria-expanded", "false");
      b.addEventListener("click", function () {
        var o = item.classList.toggle("open");
        b.setAttribute("aria-expanded", o ? "true" : "false");
      });
    });
  }

  /* ---- Enquiry --------------------------------------------------------- */
  function enquiry() {
    var f = $("#enquire"); if (!f) return;
    var steps = $$(".step", f), marks = $$(".steps li"), at = 0;
    function money(n) { return "USD " + Number(n).toLocaleString("en-US"); }
    function chosen() {
      var v = $('input[name="voyage"]:checked', f);
      return v ? (CV.voyages || []).filter(function (x) { return x.slug === v.value; })[0] : null;
    }
    function sum() {
      var v = chosen(), g = Number(($('[name="guests"]', f) || {}).value || 0), d = ($('[name="date"]', f) || {}).value || "";
      var ex = $$('input[name="extra"]:checked', f);
      $("[data-s-v]").textContent = v ? v.title : "—";
      $("[data-s-a]").textContent = v ? v.area + " · " + v.duration : "—";
      $("[data-s-d]").textContent = d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";
      $("[data-s-g]").textContent = g ? g + (g === 1 ? " guest" : " guests") : "—";
      $("[data-s-e]").textContent = ex.length ? ex.map(function (i) { return i.getAttribute("data-label"); }).join(", ") : "None";
      var add = ex.reduce(function (s, i) { return s + Number(i.getAttribute("data-price") || 0); }, 0);
      $("[data-s-t]").textContent = v ? money(v.from + add) : "—";
    }
    function go(n) {
      at = Math.max(0, Math.min(steps.length - 1, n));
      steps.forEach(function (s, k) { s.classList.toggle("on", k === at); });
      marks.forEach(function (m, k) { m.classList.toggle("on", k === at); m.classList.toggle("done", k < at); });
      if (at === steps.length - 1) sum();
      window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY - 130, behavior: SLOW ? "auto" : "smooth" });
    }
    function ok() {
      var need = $$("[required]", steps[at]);
      for (var i = 0; i < need.length; i++) if (!need[i].checkValidity()) { need[i].reportValidity(); return false; }
      return true;
    }
    $$("[data-next]", f).forEach(function (b) { b.addEventListener("click", function () { if (ok()) go(at + 1); }); });
    $$("[data-prev]", f).forEach(function (b) { b.addEventListener("click", function () { go(at - 1); }); });
    f.addEventListener("change", function () { if (at === steps.length - 1) sum(); });
    f.addEventListener("submit", function (e) {
      e.preventDefault(); if (!ok()) return;
      var d = {}; new FormData(f).forEach(function (v, k) { d[k] = d[k] ? [].concat(d[k], v) : v; });
      d.at = new Date().toISOString();
      try { var a = JSON.parse(localStorage.getItem("cv.enquiries") || "[]"); a.push(d); localStorage.setItem("cv.enquiries", JSON.stringify(a)); } catch (x) {}
      f.hidden = true;
      var o = $("#enquireOk");
      if (o) { o.classList.add("on"); o.scrollIntoView({ behavior: SLOW ? "auto" : "smooth", block: "center" }); }
    });
    go(0);
  }

  function forms() {
    $$("form[data-ok]").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!f.checkValidity()) return f.reportValidity();
        var o = $("#" + f.getAttribute("data-ok"));
        f.hidden = true; if (o) o.classList.add("on");
      });
    });
  }

  function boot() {
    chrome(); header(); menu(); video(); reveals(); rails();
    filters(); lightbox(); accordion(); enquiry(); forms();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
