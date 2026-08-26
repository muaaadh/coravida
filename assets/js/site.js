/* ==========================================================================
   CORAVIDA — site behaviour
   Header + menu + footer chrome, hero rotation, reveals, rail, lightbox,
   filters, accordion and the enquiry flow. No dependencies.
   ========================================================================== */
(function () {
  "use strict";

  var CV = window.CV || {};
  var B = CV.brand || {};
  var ROOT = document.documentElement.getAttribute("data-root") || "";
  var PAGE = document.documentElement.getAttribute("data-page") || "";
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function u(p) { return ROOT + p; }
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  var ARROW = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 9.5 9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.1" stroke-linecap="square"/></svg>';
  var CHEV_L = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M7.5 1.5 3 6l4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>';
  var CHEV_R = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4.5 1.5 9 6l-4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>';
  var XMARK = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>';

  /* ---- Chrome ---------------------------------------------------------- */
  function header() {
    var h = el(
      '<header class="hdr" id="hdr">' +
        '<div class="hdr__in">' +
          '<div class="hdr__left">' +
            '<button class="burger" type="button" id="burger" aria-expanded="false" aria-controls="menu">' +
              '<span class="burger__bars" aria-hidden="true"><i></i><i></i><i></i></span>Menu' +
            '</button>' +
          '</div>' +
          '<div class="hdr__mid">' +
            '<a class="hdr__logo" href="' + u("index.html") + '" aria-label="' + B.name + ' — home">' +
              '<img class="l-light" src="' + u("assets/img/logo-mark-white.png") + '" alt="' + B.name + '" width="80" height="34">' +
              '<img class="l-dark"  src="' + u("assets/img/logo-mark.png") + '" alt="' + B.name + '" width="80" height="34">' +
            '</a>' +
          '</div>' +
          '<div class="hdr__right">' +
            '<a class="hdr__lang" href="#" aria-label="Language: English">EN</a>' +
            '<a class="pill pill--white" href="' + u("enquire.html") + '">Book</a>' +
          '</div>' +
        '</div>' +
      '</header>'
    );
    return h;
  }

  function menu() {
    var links = (CV.nav || []).map(function (n) {
      var cur = PAGE && n.href.indexOf(PAGE) === 0 ? ' class="is-current"' : "";
      return "<li><a" + cur + ' href="' + u(n.href) + '">' + n.label + "</a></li>";
    }).join("");

    return el(
      '<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu" hidden>' +
        '<div class="menu__bar">' +
          '<div class="hdr__in">' +
            '<div class="hdr__left"><button class="menu__close" type="button" id="menuClose">' + XMARK + "Close</button></div>" +
            '<div class="hdr__mid"><a class="hdr__logo" href="' + u("index.html") + '" aria-label="' + B.name + '"><img src="' + u("assets/img/logo-mark.png") + '" alt="' + B.name + '" width="80" height="34"></a></div>' +
            '<div class="hdr__right"><a class="hdr__lang" href="' + u("contact.html") + '" style="color:var(--navy)">Contact</a><a class="pill" href="' + u("enquire.html") + '">Book</a></div>' +
          "</div>" +
        "</div>" +
        '<div class="menu__body">' +
          '<div class="menu__grid">' +
            '<nav class="menu__nav" aria-label="Primary"><ul>' + links + "</ul></nav>" +
            '<div class="menu__aside">' +
              '<a class="menu__card fig" href="' + u("voyages/twelve-nights-at-anchor.html") + '">' +
                '<img src="' + u("assets/img/horizon-dusk.jpg") + '" alt="A pale horizon at dusk over open water" loading="lazy">' +
              "</a>" +
              '<div class="menu__meta">' +
                '<p class="eyebrow">Signature charter</p>' +
                '<p class="d-s">Twelve Nights at Anchor</p>' +
                '<p class="small">Northern atolls · February to April</p>' +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function footer() {
    var navLinks = (CV.nav || []).slice(0, 4).map(function (n) { return '<li><a href="' + u(n.href) + '">' + n.label + "</a></li>"; }).join("");
    var more = (CV.nav || []).slice(4).map(function (n) { return '<li><a href="' + u(n.href) + '">' + n.label + "</a></li>"; }).join("") +
      '<li><a href="' + u("enquire.html") + '">Enquire</a></li>';

    return el(
      '<footer class="ftr">' +
        '<div class="wrap">' +
          '<div class="ftr__top">' +
            '<div class="ftr__brand">' +
              '<img src="' + u("assets/img/logo-full-white.png") + '" alt="' + B.name + '" width="105" height="54">' +
              '<p class="small" style="margin-top:1.5rem;max-width:26ch;color:rgba(255,255,255,.6)">' + B.tagline + ".</p>" +
            "</div>" +
            '<div class="ftr__col"><h4>Explore</h4><ul>' + navLinks + "</ul></div>" +
            '<div class="ftr__col"><h4>More</h4><ul>' + more + "</ul></div>" +
            '<div class="ftr__col"><h4>Contact</h4><ul>' +
              '<li><a href="' + B.phoneHref + '">' + B.phone + "</a></li>" +
              '<li><a href="mailto:' + B.email + '">' + B.email + "</a></li>" +
              "<li><span>" + B.marina + "</span></li>" +
              "<li><span>" + (B.address || []).join(", ") + "</span></li>" +
              "<li><span>" + B.hours + "</span></li>" +
            "</ul></div>" +
          "</div>" +
          '<p class="ftr__word" aria-hidden="true">Coravida</p>' +
          '<div class="ftr__bar">' +
            "<span>© " + B.year + " " + B.legal + "</span>" +
            "<span>" + B.vessel + " · Malé, Maldives</span>" +
            '<span>Site by <a href="https://dheemi.com" rel="noopener">Dheemi Studio</a></span>' +
          "</div>" +
        "</div>" +
      "</footer>"
    );
  }

  function dock() {
    return el(
      '<a class="dock" id="dock" href="' + u("enquire.html") + '">' +
        '<img src="' + u("assets/img/sandbank.jpg") + '" alt="" loading="lazy">' +
        "<span>Reserve<br>the vessel</span>" +
      "</a>"
    );
  }

  function mountChrome() {
    var hSlot = $('[data-chrome="header"]');
    if (hSlot) { hSlot.replaceWith(header()); document.body.insertBefore(menu(), document.body.firstChild); }
    var fSlot = $('[data-chrome="footer"]');
    if (fSlot) fSlot.replaceWith(footer());
    if (!$(".dock") && document.documentElement.getAttribute("data-dock") !== "off") document.body.appendChild(dock());
  }

  /* ---- Header state ---------------------------------------------------- */
  function headerState() {
    var hdr = $("#hdr"); if (!hdr) return;
    var last = 0;
    function tick() {
      var y = window.scrollY || 0;
      hdr.classList.toggle("is-solid", y > 40);
      if (y > 420 && y > last + 4 && !document.body.classList.contains("is-locked")) hdr.classList.add("is-hidden");
      else if (y < last - 4 || y < 120) hdr.classList.remove("is-hidden");
      last = y;
    }
    tick();
    window.addEventListener("scroll", tick, { passive: true });
  }

  /* ---- Menu ------------------------------------------------------------ */
  function menuBehaviour() {
    var m = $("#menu"), b = $("#burger"), c = $("#menuClose");
    if (!m || !b) return;
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      m.hidden = false;
      requestAnimationFrame(function () { m.classList.add("is-open"); });
      document.body.classList.add("is-locked");
      b.setAttribute("aria-expanded", "true");
      setTimeout(function () { if (c) c.focus(); }, 60);
    }
    function close() {
      m.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      b.setAttribute("aria-expanded", "false");
      setTimeout(function () { m.hidden = true; }, 480);
      if (lastFocus) lastFocus.focus();
    }
    b.addEventListener("click", open);
    if (c) c.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && m.classList.contains("is-open")) close();
      if (e.key === "Tab" && m.classList.contains("is-open")) {
        var f = $$('a[href], button:not([disabled])', m).filter(function (n) { return n.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---- Reveals --------------------------------------------------------- */
  function reveals() {
    var nodes = $$("[data-rv], .rvline");
    if (!("IntersectionObserver" in window) || REDUCED) { nodes.forEach(function (n) { n.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---- Hero rotation --------------------------------------------------- */
  function hero() {
    var root = $("[data-hero]"); if (!root) return;
    var slides = $$(".hero__slide", root);
    var tabs = $$(".hero__tabs button", root);
    var lines = $$("[data-hero-line]", root);
    var i = 0, timer = null;

    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
      tabs.forEach(function (t, k) { t.classList.toggle("is-active", k === i); t.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      lines.forEach(function (l, k) {
        var on = k === i;
        l.hidden = !on;
        if (on) { l.classList.remove("is-in"); void l.offsetWidth; l.classList.add("is-in"); }
      });
    }
    function auto() { if (REDUCED) return; clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 7000); }

    tabs.forEach(function (t, k) { t.addEventListener("click", function () { go(k); auto(); }); });
    go(0); auto();
  }

  /* ---- Rail ------------------------------------------------------------ */
  function rails() {
    $$(".rail").forEach(function (rail) {
      var track = $(".rail__track", rail);
      var prev = $("[data-rail-prev]", rail), next = $("[data-rail-next]", rail);
      if (!track) return;
      function step() { var item = $(".rail__item", track); return item ? item.getBoundingClientRect().width + 24 : 380; }
      function sync() {
        if (!prev || !next) return;
        prev.disabled = track.scrollLeft < 8;
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
      }
      if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: REDUCED ? "auto" : "smooth" }); });
      if (next) next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: REDUCED ? "auto" : "smooth" }); });
      track.addEventListener("scroll", sync, { passive: true });
      window.addEventListener("resize", sync);
      sync();
    });
  }

  /* ---- Filters --------------------------------------------------------- */
  function filters() {
    var bar = $("[data-filters]"); if (!bar) return;
    var items = $$("[data-cat]");
    $$("button", bar).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        $$("button", bar).forEach(function (b) { b.classList.toggle("is-active", b === btn); });
        items.forEach(function (it) { it.hidden = !(f === "all" || it.getAttribute("data-cat") === f); });
      });
    });
  }

  /* ---- Lightbox -------------------------------------------------------- */
  function lightbox() {
    var triggers = $$("[data-lb]");
    if (!triggers.length) return;
    var box = el(
      '<div class="lbox" id="lbox" role="dialog" aria-modal="true" aria-label="Image viewer" hidden>' +
        '<button class="lbox__x" type="button" data-lb-close aria-label="Close">' + XMARK + "</button>" +
        '<button class="lbox__nav lbox__nav--prev" type="button" data-lb-prev aria-label="Previous">' + CHEV_L + "</button>" +
        '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="">' +
        '<button class="lbox__nav lbox__nav--next" type="button" data-lb-next aria-label="Next">' + CHEV_R + "</button>" +
        '<p class="lbox__cap"></p>' +
      "</div>"
    );
    document.body.appendChild(box);
    var img = $("img", box), cap = $(".lbox__cap", box), idx = 0, opener = null;

    function visible() { return triggers.filter(function (t) { var f = t.closest("[data-cat]"); return !f || !f.hidden; }); }
    function show(n) {
      var list = visible(); if (!list.length) return;
      idx = (n + list.length) % list.length;
      var t = list[idx];
      img.src = t.getAttribute("data-lb");
      img.alt = t.getAttribute("data-lb-alt") || "";
      cap.textContent = t.getAttribute("data-lb-cap") || "";
    }
    function open(t) {
      opener = t;
      var list = visible();
      show(list.indexOf(t));
      box.hidden = false;
      requestAnimationFrame(function () { box.classList.add("is-open"); });
      document.body.classList.add("is-locked");
      $("[data-lb-close]", box).focus();
    }
    function close() {
      box.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      setTimeout(function () { box.hidden = true; }, 340);
      if (opener) opener.focus();
    }
    triggers.forEach(function (t) { t.addEventListener("click", function (e) { e.preventDefault(); open(t); }); });
    $("[data-lb-close]", box).addEventListener("click", close);
    $("[data-lb-prev]", box).addEventListener("click", function () { show(idx - 1); });
    $("[data-lb-next]", box).addEventListener("click", function () { show(idx + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* ---- Accordion ------------------------------------------------------- */
  function accordion() {
    $$(".acc__item").forEach(function (item) {
      var btn = $(".acc__btn", item); if (!btn) return;
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", function () {
        var open = item.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  /* ---- Dock ------------------------------------------------------------ */
  function dockBehaviour() {
    var d = $("#dock"); if (!d) return;
    function tick() { d.classList.toggle("is-on", (window.scrollY || 0) > 620); }
    tick();
    window.addEventListener("scroll", tick, { passive: true });
  }

  /* ---- Enquiry flow ---------------------------------------------------- */
  function enquiry() {
    var form = $("#enquire"); if (!form) return;
    var steps = $$(".step", form);
    var marks = $$(".steps li");
    var at = 0;

    function money(n) { return "USD " + Number(n).toLocaleString("en-US"); }
    function selected() {
      var v = $('input[name="voyage"]:checked', form);
      if (!v) return null;
      return (CV.voyages || []).filter(function (x) { return x.slug === v.value; })[0] || null;
    }
    function summary() {
      var v = selected();
      var g = Number(($('[name="guests"]', form) || {}).value || 0);
      var date = ($('[name="date"]', form) || {}).value || "";
      var extras = $$('input[name="extra"]:checked', form).map(function (i) { return i.getAttribute("data-label"); });
      $("[data-sum-voyage]").textContent = v ? v.title : "—";
      $("[data-sum-area]").textContent = v ? v.area + " · " + v.duration : "—";
      $("[data-sum-date]").textContent = date ? new Date(date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";
      $("[data-sum-guests]").textContent = g ? g + (g === 1 ? " guest" : " guests") : "—";
      $("[data-sum-extras]").textContent = extras.length ? extras.join(", ") : "None";
      var base = v ? v.from : 0;
      var add = $$('input[name="extra"]:checked', form).reduce(function (s, i) { return s + Number(i.getAttribute("data-price") || 0); }, 0);
      $("[data-sum-total]").textContent = base ? money(base + add) : "—";
    }
    function go(n) {
      at = Math.max(0, Math.min(steps.length - 1, n));
      steps.forEach(function (s, k) { s.classList.toggle("is-active", k === at); });
      marks.forEach(function (m, k) { m.classList.toggle("is-active", k === at); m.classList.toggle("is-done", k < at); });
      if (at === steps.length - 1) summary();
      var top = form.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: top, behavior: REDUCED ? "auto" : "smooth" });
    }
    function valid() {
      var s = steps[at];
      var need = $$("[required]", s);
      for (var i = 0; i < need.length; i++) {
        if (!need[i].checkValidity()) { need[i].reportValidity(); return false; }
      }
      if (at === 0 && !selected()) { window.alert("Choose a voyage to continue."); return false; }
      return true;
    }
    $$("[data-next]", form).forEach(function (b) { b.addEventListener("click", function () { if (valid()) go(at + 1); }); });
    $$("[data-prev]", form).forEach(function (b) { b.addEventListener("click", function () { go(at - 1); }); });
    form.addEventListener("change", function () { if (at === steps.length - 1) summary(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!valid()) return;
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = data[k] ? [].concat(data[k], v) : v; });
      data.at = new Date().toISOString();
      try {
        var all = JSON.parse(localStorage.getItem("cv.enquiries") || "[]");
        all.push(data);
        localStorage.setItem("cv.enquiries", JSON.stringify(all));
      } catch (err) { /* private mode — nothing to do */ }
      form.hidden = true;
      var ok = $("#enquireOk"); if (ok) { ok.classList.add("is-on"); ok.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" }); }
    });
    go(0);
  }

  function simpleForms() {
    $$("form[data-demo]").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!f.checkValidity()) { f.reportValidity(); return; }
        var ok = $("#" + f.getAttribute("data-demo"));
        f.hidden = true;
        if (ok) ok.classList.add("is-on");
      });
    });
  }

  /* ---- Boot ------------------------------------------------------------ */
  function boot() {
    mountChrome();
    headerState();
    menuBehaviour();
    reveals();
    hero();
    rails();
    filters();
    lightbox();
    accordion();
    dockBehaviour();
    enquiry();
    simpleForms();
    $$("[data-year]").forEach(function (n) { n.textContent = B.year; });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
