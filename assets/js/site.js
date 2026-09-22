/* ==========================================================================
   CORAVIDA — behaviour + motion. No dependencies.
   ========================================================================== */
(function () {
  "use strict";

  var CV = window.CV || {}, B = CV.brand || {};
  var DOC = document.documentElement;
  var ROOT = DOC.getAttribute("data-root") || "";       // to the site root, for assets
  var BASE = DOC.getAttribute("data-base") || "";       // to the locale root, for links
  var PAGE = DOC.getAttribute("data-page") || "";
  var PATH = DOC.getAttribute("data-path") || "index.html";
  var LOC  = DOC.getAttribute("data-locale") || "en";
  var LANGS = [
    { code: "en", dir: "",    label: "English", short: "EN" },
    { code: "ru", dir: "ru/", label: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439", short: "RU" },
    { code: "zh", dir: "zh/", label: "\u4e2d\u6587", short: "\u4e2d\u6587" },
    { code: "de", dir: "de/", label: "Deutsch", short: "DE" }
  ];
  /* every string this file writes onto the page; English is the fallback */
  var UI = CV.ui || {};
  function t(k, en) { return UI[k] || en; }
  function esc(x) { return String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  var SLOW = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* only a visitor who has asked to save data, or a genuinely slow connection,
     goes without the film. A phone reporting "3g" usually is not slow — Chrome
     says it on any high-latency network — and treating that as save-data left
     phones with still photographs where the film should be. */
  var SAVE = (navigator.connection && (navigator.connection.saveData ||
              /^(2g|slow-2g)$/.test(navigator.connection.effectiveType || ""))) || false;
  var TOUCH = window.matchMedia("(hover: none)").matches;

  /* an asset, from the site root — or from the media library, when the
     photographs, film and music live in Supabase Storage rather than beside
     the pages. Everything else (the stylesheet, this script, the fonts) is
     always served with the site. */
  var MEDIA = (window.CV_ENV && window.CV_ENV.MEDIA_URL) || "";
  function u(p) { return (MEDIA && /^assets\/(img|video|audio)\//.test(p) ? MEDIA : ROOT) + p; }
  function pg(p) { return BASE + p; }                   // a page, in the current language
  function inLang(code) {                               // this same page, in another language
    var l = LANGS.filter(function (x) { return x.code === code; })[0];
    return ROOT + (l ? l.dir : "") + PATH;
  }
  function el(h) { var t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstElementChild; }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  var ARROW = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 9.5 9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.1" stroke-linecap="square"/></svg>';
  var L = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M7.5 1.5 3 6l4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>';
  var R = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4.5 1.5 9 6l-4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>';
  var ICON = {
    play: '<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M2.5 1.4v9.2L10 6z"/></svg>',
    pause: '<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><rect x="2.4" y="1.6" width="2.7" height="8.8" rx=".5"/><rect x="6.9" y="1.6" width="2.7" height="8.8" rx=".5"/></svg>',
    prev: '<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M10 1.8v8.4L3.6 6z"/><rect x="1.6" y="1.8" width="1.5" height="8.4" rx=".4"/></svg>',
    next: '<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M2 1.8v8.4L8.4 6z"/><rect x="8.9" y="1.8" width="1.5" height="8.4" rx=".4"/></svg>',
    x: '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>'
  };
  var CHEV = '<svg class="chev" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>';
  var X = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="square"/></svg>';

  /* ---- Chrome ---------------------------------------------------------- */
  function chrome() {
    var h = $('[data-chrome="header"]');
    if (h) {
      h.replaceWith(el(
        '<header class="hdr" id="hdr"><div class="hdr__in">' +
          '<div class="hdr__l"><button class="burger" type="button" id="burger" aria-expanded="false" aria-controls="menu">' +
            '<i aria-hidden="true"></i>' + t("menu", "Menu") + "</button>" +
            '<nav class="hdr__nav" aria-label="' + t("primary", "Primary navigation") + '">' + (CV.nav || []).map(function (n) {
              var here = location.pathname.replace(/\/(index\.html)?$/, "/index.html").split("/").pop() === n.href.split("/").pop() || (n.href === "excursions.html" && /\/excursions\//.test(location.pathname));
              return '<a href="' + pg(n.href) + '"' + (here ? ' aria-current="page"' : "") + ">" + n.label + "</a>";
            }).join("") + "</nav></div>" +
          '<div class="hdr__m"><a class="hdr__logo" href="' + pg("index.html") + '" aria-label="' + B.name + '">' +
            '<img class="light" src="' + u("assets/img/logo-mark-white.webp") + '" alt="' + B.name + '" width="66" height="28">' +
            '<img class="dark" src="' + u("assets/img/logo-mark.webp") + '" alt="' + B.name + '" width="66" height="28"></a></div>' +
          '<div class="hdr__r">' + langEl() +
            '<a class="btn btn--white" href="' + pg("enquire.html") + '">' + t("enquire", "Enquire") + "</a></div>" +
        "</div></header>"
      ));
      document.body.insertBefore(menuEl(), document.body.firstChild);
    }
    var f = $('[data-chrome="footer"]');
    if (f) {
      var ft = footerEl(); f.replaceWith(ft);
      sea(ft);
    }
  }

  /* ---- Language --------------------------------------------------------- */
  /* Every page exists in all four; data-path is the same file inside each. */
  function langEl() {
    var now = LANGS.filter(function (l) { return l.code === LOC; })[0] || LANGS[0];
    var opts = LANGS.map(function (l) {
      return '<li><a lang="' + (l.code === "zh" ? "zh-Hans" : l.code) + '" href="' + inLang(l.code) + '"' +
        (l.code === LOC ? ' class="on" aria-current="true"' : "") + ">" + l.label + "</a></li>";
    }).join("");
    return '<div class="lang" id="lang">' +
      '<button class="lang__b" type="button" id="langB" aria-expanded="false" aria-controls="langM" aria-label="' +
        t("language", "Language") + '"><span>' + now.short + "</span>" + CHEV + "</button>" +
      '<ul class="lang__m" id="langM">' + opts + "</ul></div>";
  }
  function language() {
    var w = $("#lang"), b = $("#langB");
    if (!w || !b) return;
    function shut() { w.classList.remove("open"); b.setAttribute("aria-expanded", "false"); }
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      b.setAttribute("aria-expanded", w.classList.toggle("open") ? "true" : "false");
    });
    document.addEventListener("click", function (e) { if (!w.contains(e.target)) shut(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") shut(); });
  }

  function menuEl() {
    var links = (CV.nav || []).map(function (n) {
      return '<li><a' + (PAGE && n.href.indexOf(PAGE) === 0 ? ' class="here"' : "") +
        ' href="' + pg(n.href) + '">' + n.label + "</a></li>";
    }).join("");
    var langs = LANGS.map(function (l) {
      return '<a href="' + inLang(l.code) + '"' + (l.code === LOC ? ' class="on"' : "") + ">" + l.label + "</a>";
    }).join("");
    return el(
      '<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="' + t("menuLabel", "Menu") + '" hidden>' +
        '<div class="menu__bar"><div class="hdr__in">' +
          '<div class="hdr__l"><button class="menu__x" type="button" id="menuX">' + X + t("close", "Close") + "</button></div>" +
          '<div class="hdr__m"><a class="hdr__logo" href="' + pg("index.html") + '" aria-label="' + B.name + '">' +
            '<img src="' + u("assets/img/logo-mark.webp") + '" alt="' + B.name + '" width="66" height="28"></a></div>' +
          '<div class="hdr__r"><a class="btn" href="' + pg("enquire.html") + '">' + t("enquire", "Enquire") + "</a></div>" +
        "</div></div>" +
        '<div class="menu__body"><div>' +
          '<nav class="menu__nav" aria-label="' + t("primary", "Primary") + '"><ul>' + links + "</ul></nav>" +
          '<div class="menu__foot">' +
            '<a class="small" href="' + B.phoneHref + '">' + B.phone + "</a>" +
            '<a class="small" href="mailto:' + B.email + '">' + B.email + "</a>" +
            '<span class="small">' + B.marina + "</span>" +
            '<div class="menu__lang">' + langs + "</div>" +
          "</div>" +
        "</div></div>" +
      "</div>"
    );
  }

  function footerEl() {
    var links = (CV.nav || []).map(function (n) { return '<li><a href="' + pg(n.href) + '">' + n.label + "</a></li>"; }).join("") +
      '<li><a href="' + pg("enquire.html") + '">' + t("enquire", "Enquire") + "</a></li>";
    return el(
      '<footer class="ftr">' +
        '<div class="deep__bg" aria-hidden="true">' +
          '<img src="' + u("assets/img/poster-ocean-1200.webp") + '" alt="" loading="lazy" decoding="async" width="1200" height="675">' +
          '<video data-src="ocean" data-max="2160" muted loop playsinline preload="none" tabindex="-1"></video>' +
        "</div>" +
        '<div class="wrap"><div class="ftr__top">' +
        '<div data-a="up"><img src="' + u("assets/img/logo-full-white.webp") + '" alt="' + B.name + '" width="90" height="46" loading="lazy">' +
          '<p class="small ftr__tag">' + B.tagline + ".</p></div>" +
        '<div data-a="up"><h4>' + t("explore", "Explore") + "</h4><ul>" + links + "</ul></div>" +
        '<div data-a="up"><h4>' + B.name + "</h4><ul>" +
          '<li><a href="' + B.phoneHref + '">' + B.phone + "</a></li>" +
          '<li><a href="mailto:' + B.email + '">' + B.email + "</a></li>" +
          "<li>" + B.marina + "</li><li>" + (B.address || []).join(", ") + "</li><li>" + B.hours + "</li>" +
        "</ul></div>" +
      '</div><div class="ftr__b"><span>© ' + new Date().getFullYear() + " " + B.legal + "</span><span>" + B.vessel + "</span>" +
      '<span>' + t("siteBy", "Site by") + ' <a href="https://dheemi.com" rel="noopener">Dheemi Studio</a></span>' +
      "</div></div></footer>"
    );
  }

  /* ---- The sea ---------------------------------------------------------- */
  /* One 1440-unit period, tiled twice inside a 2880 viewBox, so a -50% shift
     loops seamlessly. Four swells, back to front, each a sum of two sines
     (a steep face, a long back) so no two crests look alike; each drifts at
     its own pace and breathes up and down on a second, slower clock. The
     front swell is the footer's own navy, so where the divider ends nothing
     shows — the film beneath only fades in further down. */
  var PERIOD = 1440, SEAH = 240;
  function crest(y0, amp, k1, k2, phase, lean) {
    var pts = [], step = 20, n = (PERIOD * 2) / step;
    for (var i = 0; i <= n; i++) {
      var x = i * step, th = (x / PERIOD) * Math.PI * 2 * k1 + phase;
      var y = y0 - amp * (Math.sin(th) + lean * Math.sin(2 * th + 0.9) + 0.22 * Math.sin(th * (k2 / k1) + 1.7));
      pts.push([x, y]);
    }
    // Catmull-Rom through the points → cubic Béziers, so the surface is smooth
    var d = "M" + pts[0][0] + "," + pts[0][1].toFixed(1);
    for (var j = 0; j < pts.length - 1; j++) {
      var p0 = pts[j ? j - 1 : j], p1 = pts[j], p2 = pts[j + 1], p3 = pts[j + 2 < pts.length ? j + 2 : j + 1];
      d += " C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + "," + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) +
        " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + "," + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) +
        " " + p2[0] + "," + p2[1].toFixed(1);
    }
    return d;
  }
  var LAYERS = [                              // y0, amplitude, waves per period, second harmonic, phase, lean
    { y: 84,  a: 14, k1: 2, k2: 5, ph: 0.4, lean: 0.18 },
    { y: 108, a: 17, k1: 3, k2: 7, ph: 2.1, lean: 0.28 },
    { y: 134, a: 19, k1: 4, k2: 9, ph: 4.0, lean: 0.34 },
    { y: 158, a: 16, k1: 5, k2: 11, ph: 1.2, lean: 0.4 }
  ];
  function sea(host) {
    // every fill runs on past the bottom edge, so a swell breathing upward never shows the one behind it
    var fill = function (d) { return d + " L" + (PERIOD * 2) + "," + (SEAH + 80) + " L0," + (SEAH + 80) + " Z"; };
    var body = "", front = "";
    LAYERS.forEach(function (L, i) {
      var d = crest(L.y, L.a, L.k1, L.k2, L.ph, L.lean);
      if (i === LAYERS.length - 1) front = d;
      body += '<g class="sea__l l' + (i + 1) + '"><g class="sea__b b' + (i + 1) + '"><path class="wv" d="' + fill(d) + '"/>' +
        (i === LAYERS.length - 1 ? '<path class="lip" d="' + fill(d) + '"/><path class="foam" d="' + d + '"/><path class="foam foam--2" d="' + d + '"/>' : "") +
        "</g></g>";
    });
    // light coming down through the surface, and the sheen a low sun leaves on the backs of the swells
    body = '<g class="sea__l l3 sea__rg"><g class="sea__b b3"><path class="sea__sheen" d="' + fill(crest(LAYERS[2].y, LAYERS[2].a, LAYERS[2].k1, LAYERS[2].k2, LAYERS[2].ph, LAYERS[2].lean)) + '"/></g></g>' + body;
    var w = el('<div class="sea" aria-hidden="true"><svg viewBox="0 0 ' + (PERIOD * 2) + " " + SEAH +
      '" preserveAspectRatio="none">' +
      '<defs>' +
      '<linearGradient id="cvW1" gradientUnits="userSpaceOnUse" x1="0" y1="56" x2="0" y2="240"><stop offset="0" stop-color="#E4EFFA" stop-opacity="0"/><stop offset=".3" stop-color="#CDDDF0" stop-opacity=".55"/><stop offset="1" stop-color="#9FBEE0"/></linearGradient>' +
      '<linearGradient id="cvW2" gradientUnits="userSpaceOnUse" x1="0" y1="80" x2="0" y2="240"><stop offset="0" stop-color="#8FB4DC"/><stop offset="1" stop-color="#4677B0"/></linearGradient>' +
      '<linearGradient id="cvW3" gradientUnits="userSpaceOnUse" x1="0" y1="110" x2="0" y2="240"><stop offset="0" stop-color="#3F76B5"/><stop offset="1" stop-color="#153F78"/></linearGradient>' +
      '<linearGradient id="cvLip" gradientUnits="userSpaceOnUse" x1="0" y1="140" x2="0" y2="214"><stop offset="0" stop-color="#4A8AD0" stop-opacity=".95"/><stop offset=".22" stop-color="#245FA3" stop-opacity=".7"/><stop offset=".55" stop-color="#0B3468" stop-opacity=".35"/><stop offset="1" stop-color="#03224D" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cvFoam" gradientUnits="userSpaceOnUse" x1="0" y1="140" x2="0" y2="168"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="cvSheen" gradientUnits="userSpaceOnUse" x1="0" y1="112" x2="0" y2="200"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".22"/><stop offset=".3" stop-color="#BFDCFF" stop-opacity=".06"/><stop offset="1" stop-color="#03224D" stop-opacity="0"/></linearGradient>' +
      '<filter id="cvSoft" x="-2%" y="-20%" width="104%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter>' +
      '</defs>' +
      body + "</svg></div>");
    var cx = "background-image:url(" + u("assets/img/caustics.webp") + ")";
    var deep = el('<div class="sea-deep" aria-hidden="true"><i style="' + cx + '"></i><i style="' + cx + '"></i></div>');
    var cs = getComputedStyle(host);
    if (cs.position === "static") host.style.position = "relative";
    host.insertBefore(deep, host.firstChild);
    host.insertBefore(w, host.firstChild);
    if (SLOW || !("IntersectionObserver" in window)) return w.classList.add("in");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { w.classList.add("in"); io.disconnect(); } });
    }, { rootMargin: "0px 0px -12% 0px" });
    io.observe(host);
  }

  /* ---- Header + progress ----------------------------------------------- */
  /* One scroll driver. Everything that reacts to the scroll position reads
     the same frame: the header state, the reveals, and the parallax. */
  var onFrame = [], ticking = false;
  function tick() { ticking = false; var y = window.scrollY || 0, vh = window.innerHeight; for (var i = 0; i < onFrame.length; i++) onFrame[i](y, vh); }
  function run() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
  function driver() {
    window.addEventListener("scroll", run, { passive: true });
    window.addEventListener("resize", run, { passive: true });
    run();
  }

  function header() {
    var h = $("#hdr");
    if (!h) return;
    var last = 0;
    onFrame.push(function (y) {
      h.classList.toggle("solid", y > 40);
      if (y > 460 && y > last + 4 && !document.body.classList.contains("lock")) h.classList.add("up");
      else if (y < last - 4 || y < 140) h.classList.remove("up");
      last = y;
    });
  }

  function menu() {
    var m = $("#menu"), b = $("#burger"), x = $("#menuX");
    if (!m || !b) return;
    var prev = null;
    function open() {
      prev = document.activeElement; m.hidden = false;
      requestAnimationFrame(function () { m.classList.add("open"); });
      document.body.classList.add("lock"); b.setAttribute("aria-expanded", "true");
      setTimeout(function () { x && x.focus(); }, 60);
    }
    function close() {
      m.classList.remove("open"); document.body.classList.remove("lock");
      b.setAttribute("aria-expanded", "false");
      setTimeout(function () { m.hidden = true; }, 620);
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

  /* ---- Video ------------------------------------------------------------ */
  /* the smallest tier that is not smaller than the screen's own pixels once the
     clip covers it — on a tall phone that is the height that counts, not the
     width. A 2× laptop gets the 2160 cut, a 1080p monitor the 1080; a phone
     stops at 1440, which is already four times its width. Never above the
     clip's own source. */
  var TIERS = [720, 1080, 1440, 2160];
  function tier(max) {
    var dpr = window.devicePixelRatio || 1, need = Math.max(window.innerWidth, window.innerHeight * 16 / 9) * dpr;
    /* A phone is at most about 1300 physical pixels across, so a 1080 cut is
       effectively one-to-one there, while the next one up is twice the bytes
       over somebody's cellular data for no difference anyone can see. Measured
       in real pixels, not CSS ones, so a tablet is not mistaken for a phone. */
    var top = TOUCH && window.innerWidth * dpr <= 1400 ? 1080 : TIERS[TIERS.length - 1], t = top;
    for (var i = 0; i < TIERS.length; i++) if (TIERS[i] * 16 / 9 >= need) { t = TIERS[i]; break; }
    return Math.min(t, top, max || 1080);
  }
  function load(v, base, max) {
    if (v.dataset.started) return v;
    v.dataset.started = "1";
    v.src = u("assets/video/" + base + "-" + tier(max) + ".mp4");
    v.load();
    return v;
  }
  /* Anything that plays on its own needs a way to stop it (WCAG 2.2.2). One
     disc per clip, put there only once the clip is actually running so a
     blocked autoplay never leaves a dead control behind. */
  function control(v) {
    var host = v.closest(".hero, .band, .fig, .ftr");
    if (!host || $(".filmc", host)) return;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    var b = el('<button class="filmc" type="button" aria-label="' + t("pauseFilm", "Pause the film") + '">' + ICON.pause + "</button>");
    host.appendChild(b);
    b.addEventListener("click", function () {
      var vs = $$("video", host).filter(function (x) { return x.classList.contains("on"); });
      var playing = vs.some(function (x) { return !x.paused; });
      vs.forEach(function (x) { playing ? x.pause() : x.play().catch(function () {}); });
      host.classList.toggle("film-off", playing);
      b.innerHTML = playing ? ICON.play : ICON.pause;
      b.setAttribute("aria-label", playing ? t("playFilm", "Play the film") : t("pauseFilm", "Pause the film"));
    });
  }

  /* Once the clip is running, its poster is a full-size painted layer nobody
     will ever see again — take it out of the compositor a beat after the fade. */
  function retire(v) {
    var still = v.parentElement && v.parentElement.querySelector("img");
    if (!still || v.hasAttribute("data-raw")) return;
    setTimeout(function () { if (v.classList.contains("on")) still.style.visibility = "hidden"; }, 1500);
  }
  /* A phone may refuse to start a film until it has been touched — Low Power
     Mode does, and so does any browser that has not seen a gesture yet. Rather
     than give up and leave a still photograph, remember what wanted to play and
     start it all on the first touch, tap or key. */
  var waitingForTouch = [];
  function onFirstTouch() {
    ["pointerdown", "touchstart", "keydown"].forEach(function (e) { document.removeEventListener(e, onFirstTouch, true); });
    var q = waitingForTouch; waitingForTouch = [];
    q.forEach(function (v) { if (v.isConnected) show(v); });
  }
  function askLater(v) {
    if (waitingForTouch.indexOf(v) > -1) return;
    if (!waitingForTouch.length) ["pointerdown", "touchstart", "keydown"].forEach(function (e) { document.addEventListener(e, onFirstTouch, { passive: true, capture: true }); });
    waitingForTouch.push(v);
  }
  function show(v) {
    v.classList.add("on");
    control(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () { v.classList.remove("on"); askLater(v); });
    else retire(v);
    if (p && p.then) p.then(function () { retire(v); }, function () {});
  }
  function fadeIn(v) {
    if (v.readyState >= 3) return show(v);
    v.addEventListener("canplay", function () { show(v); }, { once: true });
  }
  /* the drone clips are the camera's own files, so they cannot dissolve into
     themselves: a looping one dips to its poster for a third of a second at
     the cut instead of jumping */
  function softLoop(v) {
    if (!v.hasAttribute("data-raw") || v.dataset.soft) return; v.dataset.soft = "1";
    v.addEventListener("timeupdate", function () {
      if (!v.duration) return;
      if (v.duration - v.currentTime < 0.34) v.classList.add("dip"); else if (v.currentTime < 0.6) v.classList.remove("dip");
    });
  }

  /* the hero holds one clip, then hands over to the next */
  function heroCycle() {
    var stage = $("[data-hero]"); if (!stage) return;
    var slides = $$(".hero__s", stage);
    if (slides.length < 2) return startOne();
    var vids = slides.map(function (s) { return $("video", s); });
    var at = 0, timer = null;
    var still = SLOW || SAVE;

    function startOne() {
      var v = vids[0];
      if (v && !still) fadeIn(load(v, v.getAttribute("data-src"), +v.getAttribute("data-max")));
    }
    if (still) {                             // the posters carry it
      slides.forEach(function (sl) {
        var p = $("img[data-src]", sl);
        if (!p) return;
        p.src = p.getAttribute("data-src");
        if (p.getAttribute("data-srcset")) p.srcset = p.getAttribute("data-srcset");
      });
      return;
    }

    function poster(slide) {                 // release the held-back still
      var p = $("img[data-src]", slide);
      if (!p) return;
      p.src = p.getAttribute("data-src");
      if (p.getAttribute("data-srcset")) p.srcset = p.getAttribute("data-srcset");
      p.removeAttribute("data-src"); p.removeAttribute("data-srcset");
    }

    var chaps = $$(".hero__chaps li", stage);
    function show(n) {
      var prev = at; at = (n + slides.length) % slides.length;
      slides[at].classList.add("on");
      if (prev !== at) slides[prev].classList.remove("on");
      chaps.forEach(function (li, k) { li.classList.toggle("on", k === at); });   // the chapter this clip is
      poster(slides[at]);
      var st = $("img", slides[at]); if (st) st.style.visibility = "";
      var v = vids[at], hold = (CV.hero && CV.hero.interval) || 6000;
      if (v) {
        /* a clip that cannot outlast the hold — a raw drone file, or a loop shorter
           than the hold — hands over at its own end rather than showing its start
           twice; the chapter's hairline is told the shorter hold */
        if (!v.dataset.hand) {
          v.dataset.hand = "1";
          var arm = function () {
            var d = v.duration;
            if (v.hasAttribute("data-raw") || (d && d * 1000 < hold + 250)) {
              v.loop = false;
              if (d && chaps[at] && d * 1000 < hold) chaps[at].style.setProperty("--hold", Math.round(d * 1000) + "ms");
            }
          };
          v.addEventListener("ended", function () { if (seen && vids[at] === v) show(at + 1); });
          if (v.readyState >= 1) arm(); else v.addEventListener("loadedmetadata", arm, { once: true });
        }
        load(v, v.getAttribute("data-src"), +v.getAttribute("data-max")); v.currentTime = 0; fadeIn(v);
      }
      var nxi = (at + 1) % slides.length, nx = vids[nxi];   // fetch the next one while this plays
      setTimeout(function () {
        if (!seen) return;
        poster(slides[nxi]);
        if (nx) load(nx, nx.getAttribute("data-src"), +nx.getAttribute("data-max"));
      }, 1400);
      queue();
    }
    function queue() {
      clearTimeout(timer);
      timer = setTimeout(function () { show(at + 1); }, (CV.hero && CV.hero.interval) || 6000);
    }
    var seen = true;
    function halt() { clearTimeout(timer); vids.forEach(function (v) { v && v.pause(); }); }
    function resume() {
      var v = vids[at];
      if (v && v.dataset.started) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      queue();
    }
    function go() { show(0); }
    if (document.readyState === "complete") setTimeout(go, 150);
    else window.addEventListener("load", function () { setTimeout(go, 150); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) halt(); else if (seen) resume();
    });
    // scrolled past the hero: stop cycling, and stop fetching clips nobody will see
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          seen = e.isIntersecting;
          if (seen) { if (!document.hidden) resume(); } else halt();
        });
      }, { threshold: 0.05 }).observe(stage);
    }
  }

  /* single clips elsewhere: page heroes and the mid-page band */
  function video() {
    var vids = $$("video[data-src]").filter(function (v) { return !v.closest("[data-hero]"); });
    if (!vids.length || SLOW || SAVE) return;

    function start(v) { softLoop(v); fadeIn(load(v, v.getAttribute("data-src"), +v.getAttribute("data-max"))); }

    var eager = vids.filter(function (v) { return v.hasAttribute("data-eager"); });
    function go() { eager.forEach(start); }
    if (document.readyState === "complete") setTimeout(go, 150);
    else window.addEventListener("load", function () { setTimeout(go, 150); });

    if (!("IntersectionObserver" in window)) {
      return vids.forEach(function (v) { if (!v.hasAttribute("data-eager")) start(v); });
    }
    /* every clip is watched, eager ones included — a clip nobody can see should
       not be decoding, and it should pick up again when it comes back */
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.dataset.started) start(v);
          else if (v.classList.contains("on") && !v.closest(".film-off")) v.play().catch(function () {});
        } else if (v.classList.contains("on")) v.pause();
      });
    }, { rootMargin: "300px 0px" });
    vids.forEach(function (v) { io.observe(v); });
  }

  /* ---- Line splitting -------------------------------------------------- */
  function splitLines(node) {
    var text = node.getAttribute("data-text") || node.textContent.trim();
    node.setAttribute("data-text", text);
    var words = text.split(/\s+/);
    node.textContent = "";
    var probe = document.createDocumentFragment();
    var spans = words.map(function (w, i) {
      var s = document.createElement("span");
      s.textContent = w;
      s.style.display = "inline-block";
      probe.appendChild(s);
      if (i < words.length - 1) probe.appendChild(document.createTextNode(" "));
      return s;
    });
    node.appendChild(probe);
    var lines = [], cur = null, top = null;
    spans.forEach(function (s) {
      var t = s.offsetTop;
      if (top === null || Math.abs(t - top) > 3) { top = t; cur = []; lines.push(cur); }
      cur.push(s.textContent);
    });
    node.textContent = "";
    lines.forEach(function (words, i) {
      var outer = document.createElement("span");
      outer.className = "ln";
      var inner = document.createElement("span");
      inner.textContent = words.join(" ") + (i < lines.length - 1 ? " " : "");
      outer.style.setProperty("--l", i);
      outer.appendChild(inner);
      node.appendChild(outer);
    });
  }
  function lines() {
    /* Measuring where a headline wraps before the webfont has arrived freezes
       the fallback's line breaks into the final markup. Wait for the face. */
    if (document.fonts && document.fonts.status !== "loaded") {
      return document.fonts.ready.then(function () { lines(); });
    }
    var nodes = $$(".lines");
    if (!nodes.length) return;
    // Han text has no spaces to split on, so the headline rises as one block
    if (/^(zh|ja|ko)/.test(LOC)) return nodes.forEach(function (n) { n.classList.add("lines--whole"); });
    nodes.forEach(splitLines);
    var w = window.innerWidth, t;
    window.addEventListener("resize", function () {
      if (Math.abs(window.innerWidth - w) < 40) return;
      w = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(function () {
        nodes.forEach(function (n) { var was = n.classList.contains("in"); splitLines(n); if (was) n.classList.add("in"); });
      }, 200);
    }, { passive: true });
  }

  /* ---- The player -------------------------------------------------------- */
  var BARS = '<span class="mus__eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';

  function player() {
    var M = CV.music;
    if (!M || !M.tracks || !M.tracks.length) return;
    var wrap = el(
      '<div class="mus" id="mus">' +
        '<button class="mus__b" type="button" id="musB" aria-expanded="false" aria-controls="musP" aria-label="' + t("music", "Music") + '">' + BARS + "</button>" +
        '<div class="mus__p" id="musP" role="group" aria-label="' + t("player", "Music player") + '">' +
          '<p class="mus__line">' + M.line + "</p>" +
          '<div><div class="mus__t" id="musT"></div><div class="mus__by" id="musBy"></div></div>' +
          '<div class="mus__bar" id="musBar" role="slider" aria-label="' + t("seek", "Seek") + '" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="musFill"></i></div>' +
          '<div class="mus__c">' +
            '<button type="button" id="musPrev" aria-label="' + t("prev", "Previous track") + '">' + ICON.prev + "</button>" +
            '<button class="play" type="button" id="musPlay" aria-label="Play">' + ICON.play + "</button>" +
            '<button type="button" id="musNext" aria-label="' + t("next", "Next track") + '">' + ICON.next + "</button>" +
            '<button class="mus__x" type="button" id="musX" aria-label="' + t("closePlayer", "Close player") + '">' + ICON.x + "</button>" +
          "</div>" +
        "</div>" +
      "</div>");
    document.body.appendChild(wrap);

    var audio = new Audio();
    audio.preload = "none";
    audio.volume = 0.18;                             // a bed, not a soundtrack; the ear should have to look for it
    var i = 0, ready = false;
    var elT = $("#musT"), elBy = $("#musBy"), elFill = $("#musFill"), elPlay = $("#musPlay"), elBar = $("#musBar");

    function store(k, v) { try { sessionStorage.setItem("cv.mus." + k, v); } catch (e) {} }
    function read(k) { try { return sessionStorage.getItem("cv.mus." + k); } catch (e) { return null; } }

    function paint() {
      var t = M.tracks[i];
      elT.textContent = t.title;
      /* a track the office supplied carries no credit line; a licensed one does */
      elBy.innerHTML = t.by && t.lic
        ? esc(t.by) + ' &middot; ' + (t.at ? '<a href="' + esc(t.at) + '" target="_blank" rel="noopener">' + esc(t.lic) + "</a>" : esc(t.lic))
        : t.by ? esc(t.by) : "";
    }
    function cue(n, autoplay) {
      i = (n + M.tracks.length) % M.tracks.length;
      audio.src = u("assets/audio/" + M.tracks[i].file + ".mp3");
      ready = true; store("i", i); paint();
      if (autoplay) play();
    }
    function play() {
      if (!ready) return cue(i, true);
      var p = audio.play();
      if (p && p.catch) p.catch(function () { setPlaying(false); });
    }
    function setPlaying(on) {
      wrap.classList.toggle("playing", on);
      elPlay.innerHTML = on ? ICON.pause : ICON.play;
      elPlay.setAttribute("aria-label", on ? t("pause", "Pause") : t("play", "Play"));
      if (on) store("on", "1"); else if (paused) store("on", "0");
    }
    audio.addEventListener("play", function () { setPlaying(true); });
    audio.addEventListener("pause", function () { setPlaying(false); });
    audio.addEventListener("ended", function () { cue(i + 1, true); });
    audio.addEventListener("timeupdate", function () {
      if (!audio.duration) return;
      var p = audio.currentTime / audio.duration;
      elFill.style.width = (p * 100).toFixed(2) + "%";
      elBar.setAttribute("aria-valuenow", Math.round(p * 100));
      store("t", audio.currentTime.toFixed(1));
    });

    $("#musB").addEventListener("click", function () {
      var open = wrap.classList.toggle("open");
      $("#musB").setAttribute("aria-expanded", open ? "true" : "false");
      store("open", open ? "1" : "0");
      if (open && !ready) cue(i, false);
    });
    $("#musX").addEventListener("click", function () {
      wrap.classList.remove("open"); $("#musB").setAttribute("aria-expanded", "false"); store("open", "0");
    });
    elPlay.addEventListener("click", function () { if (audio.paused) { paused = false; play(); } else { paused = true; store("on", "0"); audio.pause(); } });
    $("#musPrev").addEventListener("click", function () { cue(i - 1, !audio.paused || wrap.classList.contains("playing")); });
    $("#musNext").addEventListener("click", function () { cue(i + 1, !audio.paused || wrap.classList.contains("playing")); });
    function seek(e) {
      if (!audio.duration) return;
      var r = elBar.getBoundingClientRect();
      audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration;
    }
    elBar.addEventListener("click", seek);
    elBar.addEventListener("keydown", function (e) {
      if (!audio.duration) return;
      if (e.key === "ArrowRight") audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
      if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
    });

    /* The music starts by itself. A browser will not let a page make a sound
       before the visitor has touched it, so: try at once (a visitor who has
       already been on another page of the site is usually allowed), and if
       that is refused, start on their first tap, click or key anywhere. A
       visitor who pauses is not started again this visit. */
    var paused = false;                              // a pause the visitor chose, this visit
    function autoStart() {
      if (SLOW || read("on") === "0") return;         // paused on purpose earlier in the visit
      var armed = false;
      function attempt() {
        if (paused) return off();
        if (!ready) cue(i, false);
        var p = audio.play();
        if (p && p.then) p.then(off, function () { if (!armed) arm(); });
      }
      function arm() { armed = true; ["pointerdown", "keydown", "touchstart"].forEach(function (ev) { document.addEventListener(ev, attempt, { passive: true, capture: true }); }); }
      function off() { ["pointerdown", "keydown", "touchstart"].forEach(function (ev) { document.removeEventListener(ev, attempt, { capture: true }); }); }
      attempt();
    }

    /* One quiet invitation, five seconds, once per visit. It never appears if
       the player is already open or already playing, and any use kills it. */
    function nudge() {
      if (SLOW || read("open") === "1" || read("on") === "1" || read("nudged") === "1") return;
      var n = el('<div class="mus__n" role="status"><span>' +
        t("nudge", "Sound on at your first tap") + "</span>" +
        '<i class="mus__nq" aria-hidden="true"></i></div>');
      wrap.appendChild(n);
      /* mark it seen the moment it appears — not when it leaves — so a visitor
         who moves to the next page inside the window never sees it twice */
      store("nudged", "1");
      var out, gone = false;
      function go() {
        if (gone) return;
        gone = true;
        clearTimeout(out);
        n.classList.remove("in");
        setTimeout(function () { if (n.parentNode) n.remove(); }, 600);
      }
      setTimeout(function () { n.classList.add("in"); out = setTimeout(go, 7000); }, 1500);
      setTimeout(go, 10000);                            // failsafe: nothing keeps it past ten seconds
      wrap.addEventListener("click", go, { once: true });
      n.addEventListener("click", function () { $("#musB").click(); });
    }
    nudge();

    /* carry across a page change: the browser will usually allow the resume
       because the gesture happened on the previous page of the same site */
    var wasI = parseInt(read("i") || "0", 10);
    if (wasI >= 0 && wasI < M.tracks.length) i = wasI;
    paint();
    if (read("open") === "1") { wrap.classList.add("open"); $("#musB").setAttribute("aria-expanded", "true"); }
    if (read("on") === "1") {
      cue(i, false);
      var at = parseFloat(read("t") || "0");
      audio.addEventListener("loadedmetadata", function () {
        if (at > 0 && at < audio.duration) audio.currentTime = at;
      }, { once: true });
    }
    autoStart();
  }

  /* ---- Voyage index: the photograph follows the cursor ------------------- */
  function voyageIndex() {
    var vx = $(".vx");
    if (!vx || TOUCH || !window.matchMedia("(min-width: 900px)").matches) return;
    var thumb = el('<div class="vx__thumb"><img alt=""></div>');
    document.body.appendChild(thumb);
    var img = $("img", thumb), x = 0, y = 0, tx = 0, ty = 0, live = false, raf = null;
    function loop() {
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      thumb.style.left = x + "px"; thumb.style.top = y + "px";
      if (live || Math.abs(tx - x) > 0.5) raf = requestAnimationFrame(loop);
      else raf = null;
    }
    $$(".vx__row", vx).forEach(function (row) {
      row.addEventListener("pointerenter", function () {
        var src = row.getAttribute("data-thumb");
        if (src && img.getAttribute("src") !== src) img.src = src;
        img.alt = row.getAttribute("data-alt") || "";
        live = true; thumb.classList.add("on");
        if (!raf) raf = requestAnimationFrame(loop);
      });
      row.addEventListener("pointerleave", function () { live = false; thumb.classList.remove("on"); });
    });
    vx.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  }

  /* ---- Reveals --------------------------------------------------------- */
  function reveals() {
    // a stagger root numbers its own children, unless the build already did
    $$("[data-stagger]").forEach(function (p) {
      $$("[data-a]", p).forEach(function (n, i) {
        if (!n.style.getPropertyValue("--i")) n.style.setProperty("--i", Math.min(i, 6));
      });
    });
    var waiting = $$("[data-a], .lines");
    if (SLOW) return waiting.forEach(function (n) { n.classList.add("in"); });
    // a sweep rather than an observer: a fast flick can outrun a threshold,
    // and anything left behind would never appear at all
    onFrame.push(function (y, vh) {
      if (!waiting.length) return;
      var line = vh * 0.92, keep = [];
      for (var i = 0; i < waiting.length; i++) {
        if (waiting[i].getBoundingClientRect().top < line) waiting[i].classList.add("in");
        else keep.push(waiting[i]);
      }
      waiting = keep;
    });
  }

  /* ---- Scroll effects: parallax, word scrub, marquee skew --------------- */
  function scrollFx() {
    var pars = $$("[data-par]");
    if (SLOW || !pars.length) return;
    onFrame.push(function (y, vh) {
      var damp = window.innerWidth < 700 ? 0.55 : 1;   // gentler on a phone
      for (var i = 0; i < pars.length; i++) {
        var n = pars[i], r = n.getBoundingClientRect();
        if (r.bottom < -vh * 0.25 || r.top > vh * 1.25) continue;
        var f = (parseFloat(n.getAttribute("data-par")) || 0.1) * damp;
        n.style.transform = "translate3d(0," + (-(r.top + r.height / 2 - vh / 2) * f).toFixed(2) + "px,0)";
      }
    });
  }

  function counters() {
    var vals = $$(".stats .v");
    if (!vals.length) return;
    vals.forEach(function (v) {
      var t = v.firstChild;
      if (!t || t.nodeType !== 3) return;
      var raw = t.textContent.trim();
      if (!/^[\d][\d.,]*$/.test(raw)) return;
      var target = parseFloat(raw.replace(/,/g, ""));
      if (!isFinite(target)) return;
      var dec = (raw.split(".")[1] || "").length;
      var grp = raw.indexOf(",") > -1;
      function fmt(n) {
        var s = dec ? n.toFixed(dec) : String(Math.round(n));
        return grp ? Number(s).toLocaleString("en-US") : s;
      }
      if (SLOW) return;
      t.textContent = fmt(0);
      var done = false;
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting || done) return;
          done = true; io.disconnect();
          var t0 = performance.now(), dur = 1400;
          (function step(now) {
            var p = Math.min(1, (now - t0) / dur);
            var e2 = 1 - Math.pow(1 - p, 3);
            t.textContent = fmt(target * e2);
            if (p < 1) requestAnimationFrame(step);
            else t.textContent = raw;
          })(t0);
        });
      }, { threshold: .4 });
      io.observe(v);
    });
  }

  /* ---- Rail ------------------------------------------------------------ */
  function rails() {
    $$(".rail").forEach(function (rail) {
      var t = $(".rail__track", rail), p = $("[data-prev]", rail), n = $("[data-next]", rail);
      if (!t) return;
      function step() { var i = $(".rail__item", t); return i ? i.getBoundingClientRect().width + 24 : 400; }
      function sync() {
        var end = t.scrollLeft + t.clientWidth >= t.scrollWidth - 8;
        rail.classList.toggle("end", end);          // the edge fade goes with it
        if (!p || !n) return;
        p.disabled = t.scrollLeft < 8;
        n.disabled = end;
      }
      p && p.addEventListener("click", function () { t.scrollBy({ left: -step(), behavior: SLOW ? "auto" : "smooth" }); });
      n && n.addEventListener("click", function () { t.scrollBy({ left: step(), behavior: SLOW ? "auto" : "smooth" }); });
      t.addEventListener("scroll", sync, { passive: true });
      window.addEventListener("resize", sync); sync();
      // drag to scroll
      var down = false, sx = 0, sl = 0, moved = 0;
      t.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "touch") return;
        down = true; moved = 0; sx = e.clientX; sl = t.scrollLeft; t.classList.add("drag");
      });
      window.addEventListener("pointermove", function (e) {
        if (!down) return;
        var d = e.clientX - sx; moved = Math.abs(d);
        t.scrollLeft = sl - d;
      });
      window.addEventListener("pointerup", function () {
        if (!down) return;
        down = false; t.classList.remove("drag");
      });
      t.addEventListener("click", function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    });
  }

  /* ---- Mosaic ----------------------------------------------------------- */
  /* CSS columns fill top-to-bottom, so the third picture you read was the
     eleventh in the DOM — and the eleventh the lightbox went to next. Filling
     the columns round-robin puts reading order and DOM order back together. */
  function mosaic() {
    $$(".mosaic").forEach(function (m) {
      var items = $$(":scope > figure, :scope > .mosaic__row > figure, :scope > .mosaic__col > figure", m);
      if (!items.length) return;
      // rows of two and three, alternating, that always end on a full row
      var rows = [], left = items.length, next = 2;
      while (left > 0) {
        if (left === 1) {
          if (!rows.length) rows.push(1);
          else if (rows[rows.length - 1] === 2) rows[rows.length - 1] = 3;
          else { rows[rows.length - 1] = 2; rows.push(2); }
          left = 0;
        } else if (left === 2) { rows.push(2); left = 0; }
        else { rows.push(next); left -= next; next = next === 2 ? 3 : 2; }
      }
      m.textContent = "";
      var i = 0;
      rows.forEach(function (n) {
        var r = el('<div class="mosaic__row" data-n="' + n + '" style="--n:' + n + '"></div>');
        for (var k = 0; k < n && i < items.length; k++) r.appendChild(items[i++]);
        m.appendChild(r);
      });
    });
  }

  /* ---- Lightbox -------------------------------------------------------- */
  function lightbox() {
    var trg = $$("[data-lb]"); if (!trg.length) return;
    var box = el('<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="' + t("viewer", "Image viewer") + '" hidden>' +
      '<button class="lb__x" type="button" data-x aria-label="' + t("close", "Close") + '">' + X + "</button>" +
      '<button class="lb__p" type="button" data-p aria-label="' + t("prevImage", "Previous") + '">' + L + "</button>" +
      '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="">' +
      '<button class="lb__n" type="button" data-n aria-label="' + t("nextImage", "Next") + '">' + R + "</button>" +
      '<p class="lb__c"></p></div>');
    document.body.appendChild(box);
    var img = $("img", box), cap = $(".lb__c", box), i = 0, from = null;

    function show(n, dir) {
      i = (n + trg.length) % trg.length;
      if (dir && !SLOW) {                       // a short slide in the direction of travel
        img.style.transition = "none";
        img.style.transform = "translateX(" + (dir * 26) + "px) scale(1)";
        img.style.opacity = "0";
        requestAnimationFrame(function () {
          img.style.transition = "";
          img.style.transform = "";
          img.style.opacity = "";
        });
      }
      img.src = trg[i].getAttribute("data-lb");
      img.alt = trg[i].getAttribute("data-alt") || "";
      cap.textContent = trg[i].getAttribute("data-cap") || "";
    }
    function open(x) {
      from = x; show(trg.indexOf(x)); box.hidden = false;
      requestAnimationFrame(function () { box.classList.add("open"); });
      document.body.classList.add("lock"); $("[data-x]", box).focus();
    }
    function close() {
      box.classList.remove("open"); document.body.classList.remove("lock");
      setTimeout(function () { box.hidden = true; }, 340); from && from.focus();
    }
    trg.forEach(function (x) { x.addEventListener("click", function (e) { e.preventDefault(); open(x); }); });
    $("[data-x]", box).addEventListener("click", close);
    $("[data-p]", box).addEventListener("click", function () { show(i - 1, -1); });
    $("[data-n]", box).addEventListener("click", function () { show(i + 1, 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(i - 1, -1);
      if (e.key === "ArrowRight") show(i + 1, 1);
    });

    /* on a phone the arrows are not the instinct — the thumb is */
    var x0 = 0, y0 = 0, live = false;
    box.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      live = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (!live) return;
      live = false;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) show(i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.4) close();
    }, { passive: true });
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

  /* ---- Ready ------------------------------------------------------------- */
  function ready() { requestAnimationFrame(function () { document.body.classList.add("loaded"); }); }

  /* ---- Enquiry ---------------------------------------------------------
     One page, no wizard: four questions in reading order, one optional row,
     and a live estimate above the one Send button. The calendar owns its own
     month arrows (data-cal-prev / data-cal-next), so no form hook can catch them. */
  function enquiry() {
    var f = $("#enquire"); if (!f) return;
    var est = $(".est", f), more = $(".more", f), warn = $("[data-s-taken]", f), paxNote = $("[data-pax]", f);
    var pax = Number((CV.rates && CV.rates.pax) || 7);
    var dateIn = $('[name="date"]', f), altIn = $('[name="alt"]', f), mount = $("[data-gcal]", f), taken = null, cal = null;
    function money(n) {
      var c = (CV.rates && CV.rates.currency) || "USD";
      return c + " " + Number(n).toLocaleString(LOC === "zh" || LOC === "en" ? "en-US" : LOC);
    }
    function chosen() {
      var v = $('input[name="excursion"]:checked', f);
      return v ? (CV.voyages || []).filter(function (x) { return x.slug === v.value; })[0] : null;
    }
    function guests() { var r = $('input[name="guests"]:checked', f); return Number(r ? r.value : 0); }
    function when(d) { return new Date(d + "T00:00:00").toLocaleDateString(LANGTAG, { weekday: "short", day: "numeric", month: "long", year: "numeric" }); }
    function put(sel, txt) { var n = $(sel, f); if (n) n.textContent = txt; return n; }
    function lit(k) { return (est && est.getAttribute("data-" + k)) || ""; }   // the strings the build translated for this block
    function row(k, v) { var r = el('<div class="est__r"><span class="k"></span><span class="v"></span></div>'); $(".k", r).textContent = k; $(".v", r).textContent = v; return r; }
    /* the estimate: every line the figure is made of, then the figure. The
       package price only holds at the party size the client quoted; at any
       other number the charter itself is quoted in the reply. */
    function sum() {
      var v = chosen(), g = guests(), d = dateIn ? dateIn.value : "", a = altIn ? altIn.value : "";
      var ex = $$('input[name="extra"]:checked', f), ask = $$('input[name="arrange"]:checked', f);
      var add = ex.reduce(function (s, i) { return s + Number(i.getAttribute("data-price") || 0); }, 0);
      var priced = !!v && v.price != null && g === pax;
      put("[data-s-d]", d ? when(d) : "—");
      var alt = put("[data-s-a]", a ? when(a) : ""); if (alt) alt.closest("[data-s-row]").hidden = !a;
      var lines = $("[data-s-lines]", f);
      if (lines) {
        lines.innerHTML = "";
        if (v) lines.appendChild(row(v.title + " · " + lit("party").replace("{n}", g), v.price == null ? lit("ask") : priced ? money(v.price) : lit("quoted")));
        ex.forEach(function (i) { lines.appendChild(row(i.getAttribute("data-label"), money(i.getAttribute("data-price") || 0))); });
        ask.forEach(function (i) { lines.appendChild(row(i.getAttribute("data-label"), lit("ask"))); });
      }
      put("[data-s-t]", !v ? "—" : priced ? money(v.price + add) : lit("quoted"));
      $$("[data-s-note]", f).forEach(function (n) { n.hidden = n.getAttribute("data-s-note") !== (priced || !v ? "priced" : "quoted"); });
      return { total: ($("[data-s-t]", f) || {}).textContent || "", extras: add };
    }
    /* a party that is not the priced one is quoted — say so where the number is chosen, with the number */
    function paxCheck() {
      if (!paxNote) return;
      var g = guests(), same = g === pax;
      paxNote.hidden = same;
      if (!same) paxNote.textContent = (paxNote.getAttribute("data-tpl") || "").replace("{g}", g);
    }
    function need(n, quiet) {
      n.scrollIntoView({ behavior: SLOW ? "auto" : "smooth", block: "center" });
      if (!quiet) { n.classList.add("is-need"); setTimeout(function () { n.classList.remove("is-need"); }, 900); }
    }
    /* in reading order: a day, then the name and email, then the day must be free */
    function ok() {
      if (mount && !dateIn.value) { need(mount); return false; }
      var req = $$("[required]", f);
      for (var i = 0; i < req.length; i++) if (!req[i].checkValidity()) { req[i].reportValidity(); return false; }
      if (mount && /taken|past/.test(stateOf(dateIn.value))) { need(dateIn._card || mount, true); return false; }
      return true;
    }
    /* ---- the dates: chosen on the calendar, which knows from the books which
       days are gone (dates only, never a name) ---------------------------- */
    var t0 = new Date(), minDay = t0.getFullYear() + "-" + String(t0.getMonth() + 1).padStart(2, "0") + "-" + String(t0.getDate()).padStart(2, "0");
    function fullDay() { var v = chosen(); return !!v && !/half|evening|sunset/i.test(v.kind || ""); }
    /* free | am (only the morning is free) | pm | taken | past */
    function stateOf(d) {
      if (d < minDay) return "past";
      if (!taken) return "free";
      if (taken.indexOf(d) > -1) return "taken";
      var half = taken.filter(function (x) { return x.indexOf(d + ":") === 0; })[0];
      if (half) return fullDay() ? "taken" : half.slice(-2);
      return "free";
    }
    function check() {
      [dateIn, altIn].forEach(function (inp, i) {
        if (!inp || !inp._note) return;
        var note = inp._note, d = inp.value, pre = inp._label ? inp._label + " — " : "";
        if (!d) { note.hidden = true; inp.setCustomValidity && inp.setCustomValidity(""); return; }
        var st = stateOf(d);
        if (st === "taken" || st === "past") {
          var half = taken && taken.some(function (x) { return x.indexOf(d + ":") === 0; });
          note.textContent = pre + (half && fullDay() ? t("halfDayOnly", "Only half of that day is free — choose a half-day excursion, or another day.") : t("dayTaken", "That day is already taken — please choose another."));
          note.hidden = false; note.className = "note note--avail is-bad";
        } else if (st === "am" || st === "pm") {
          note.textContent = pre + t(st === "pm" ? "pmFree" : "amFree", st === "pm" ? "Only the afternoon is still free that day." : "Only the morning is still free that day.");
          note.hidden = false; note.className = "note note--avail";
        } else { note.hidden = true; }
      });
      /* the preferred day is gone: the card says so by the calendar, a line says so by the button, and the crew are a tap away */
      var blocked = !!dateIn.value && /taken|past/.test(stateOf(dateIn.value));
      showCard(blocked ? dateIn.value : null);
      if (blocked) dateIn._note.hidden = true;   // the card says it
      if (warn) warn.hidden = !blocked;
      if (mount) mount.classList.toggle("has-date", !!dateIn.value);   // the alternative tile appears once there is a day to back up
      if (cal) cal.paint();
    }
    function showCard(d) {
      var card = dateIn._card; if (!card) return;
      card.hidden = !d; if (!d) return;
      var B = CV.brand || {}, v2 = chosen(), when = new Date(d + "T00:00:00").toLocaleDateString(LANGTAG, { day: "numeric", month: "long", year: "numeric" });
      var msg = t("waAsk", "Hello Coravida — I would like to charter on {date}{exc}, but the website says that day is taken. What is the nearest free date?").replace("{date}", when).replace("{exc}", v2 ? " (" + v2.title + ")" : "");
      var wa = $("[data-wa]", card), tel = $("[data-tel]", card);
      if (wa) wa.href = (B.whatsappHref || "https://wa.me/").split("?")[0] + "?text=" + encodeURIComponent(msg);
      if (tel) { tel.href = B.phoneHref || "#"; tel.textContent = B.phone || ""; }
      $(".avail__h", card).textContent = t("notAvailH", "That day is not available") + " — " + when;
    }
    if (dateIn && mount) {
      var notes = document.createElement("div"); notes.className = "avail";
      var card = el('<div class="avail__card" hidden><p class="avail__h">' + t("notAvailH", "That day is not available") + '</p>' +
        '<p>' + t("notAvailP", "The vessel is already spoken for. Would you like to get in touch? The crew will suggest the nearest free date.") + "</p>" +
        '<div class="acts"><a class="btn" data-wa rel="noopener" target="_blank">' + t("sendWhatsApp", "Send on WhatsApp") + '</a><a class="btn btn--ghost" data-tel></a></div></div>');
      [dateIn, altIn].forEach(function (inp, i) {
        if (!inp) return;
        var note = document.createElement("p"); note.className = "note note--avail"; note.hidden = true; note.id = "avail-" + i; note.setAttribute("aria-live", "polite");
        inp._note = note; inp._label = mount.getAttribute(i ? "data-l-alt" : "data-l-pref") || ""; notes.appendChild(note);
      });
      notes.appendChild(card); dateIn._card = card;
      cal = gcal(mount, { state: stateOf, minDay: minDay, mode: "pick", labels: { pref: dateIn._label, alt: altIn ? altIn._label : "" },
        get: function () { return { date: dateIn.value, alt: altIn ? altIn.value : "" }; },
        set: function (which, v) {
          if (which === "alt") { if (altIn) altIn.value = v || ""; }
          else { dateIn.value = v || ""; if (!dateIn.value && altIn && altIn.value) { dateIn.value = altIn.value; altIn.value = ""; } }   // a lone alternative becomes the preferred day
          check(); sum();
        },
        onTaken: function (d) { showCard(d); } });
      mount.parentNode.insertBefore(notes, mount.nextSibling);
      f.addEventListener("change", function (e) { if (e.target.name === "excursion") { cal.repaint(); check(); } });
      var q = new URLSearchParams(location.search).get("date");
      loadTaken(function (list) { taken = list; cal.repaint(); if (q && /^\d{4}-\d{2}-\d{2}$/.test(q) && stateOf(q) !== "taken" && stateOf(q) !== "past") { dateIn.value = q; cal.show(q); } check(); sum(); });
    }
    /* the estimate is live: every tap anywhere on the form updates it */
    f.addEventListener("change", function (e) { if (e.target.name === "guests") paxCheck(); sum(); });
    /* "Add to my enquiry" on the excursions page arrives as ?extra=<id>; an excursion page sends ?excursion=<slug> */
    try {
      var qs = new URLSearchParams(location.search);
      qs.getAll("extra").forEach(function (id) { var c = $('input[name="extra"][value="' + id.replace(/[^a-z0-9-]/g, "") + '"]', f); if (c) c.checked = true; });
      var ex0 = qs.get("excursion"); if (ex0) { var r0 = $('input[name="excursion"][value="' + ex0.replace(/[^a-z0-9-]/g, "") + '"]', f); if (r0 && !r0.checked) { r0.checked = true; r0.dispatchEvent(new Event("change", { bubbles: true })); } }
      if (more && $$('input[name="extra"]:checked, input[name="arrange"]:checked', f).length) more.open = true;   // something optional was pre-ticked: show it
    } catch (x) {}
    f.addEventListener("submit", function (e) {
      e.preventDefault(); if (!ok()) return;
      var s = sum();
      var d = {}; new FormData(f).forEach(function (v, k) { d[k] = d[k] ? [].concat(d[k], v) : v; });
      var v = chosen(); if (v) d.excursionTitle = v.title;
      var ex = $$('input[name="extra"]:checked', f);
      if (ex.length) { d.extras = ex.map(function (i) { return i.getAttribute("data-label"); }).join(", "); d.extrasTotal = money(s.extras); }
      var ask = $$('input[name="arrange"]:checked', f);
      if (ask.length) d.arrange = ask.map(function (i) { return i.getAttribute("data-label"); }).join(", "); else delete d.arrange;
      d.total = s.total;
      deliver(f, "enquiry", d, $("#enquireOk"));
    });
    paxCheck(); sum();
  }

  var LANGTAG = LOC === "zh" ? "zh-CN" : LOC === "en" ? "en-GB" : LOC;
  /* which days are gone: the office publishes it to the database the moment
     it saves; the static file in the repo is the fallback */
  var ENV = window.CV_ENV || {}, takenCache = null;
  function db(path, init) {
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) return Promise.reject(new Error("no database"));
    var h = Object.assign({ apikey: ENV.SUPABASE_ANON_KEY, Authorization: "Bearer " + ENV.SUPABASE_ANON_KEY }, (init && init.headers) || {});
    return fetch(ENV.SUPABASE_URL + "/rest/v1/" + path, Object.assign({}, init || {}, { headers: h }));
  }
  function loadTaken(cb) {
    if (takenCache) return cb(takenCache);
    var stat = function () { return fetch(u("content/availability.json"), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }); };
    var live = Promise.race([db("content?key=eq.availability&select=data", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (rows) { return rows && rows[0] ? rows[0].data : null; }), new Promise(function (res) { setTimeout(function () { res(null); }, 3500); })]).catch(function () { return null; });
    live.then(function (j) { return (j && j.taken) ? j : stat(); }).then(function (j) { takenCache = (j && j.taken) || []; cb(takenCache); }).catch(function () { cb([]); });
  }

  /* ---- The calendar -------------------------------------------------------
     One month of glass over a blurred lagoon. Every day is a button; the books
     say which are gone. "pick" mode chooses a preferred day and an alternative
     for the enquiry form; "browse" mode carries the day to the form. */
  function gcal(mount, o) {
    var mode = o.mode || "browse", view = null, nw = new Date(), today = o.minDay || (nw.getFullYear() + "-" + String(nw.getMonth() + 1).padStart(2, "0") + "-" + String(nw.getDate()).padStart(2, "0"));
    var maxM = shiftM(today.slice(0, 7), 18), minM = today.slice(0, 7);
    function shiftM(m, n) { var p = m.split("-"), d = new Date(+p[0], +p[1] - 1 + n, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
    function daysIn(m) { var p = m.split("-"); return new Date(+p[0], +p[1], 0).getDate(); }
    function dow(d) { var p = d.split("-"); return (new Date(+p[0], +p[1] - 1, +p[2]).getDay() + 6) % 7; }
    function fmt(d, opt) { var p = d.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(LANGTAG, opt); }
    $$(":scope > *", mount).forEach(function (n) { if (n.tagName !== "INPUT") n.remove(); });   // the hidden inputs stay
    var panel = el('<div class="gcal__panel"></div>'); mount.appendChild(panel);
    panel.appendChild(el('<div class="gcal__bg" aria-hidden="true"></div>')).style.backgroundImage = "url(" + u("assets/img/aerial-close-1200.webp") + ")";
    var glass = el('<div class="gcal__glass">' +
      '<div class="gcal__head"><button class="gcal__nav" type="button" data-cal-prev aria-label="' + t("prevMonth", "Previous month") + '">'  + L + '</button>' +
      '<div class="gcal__title" aria-live="polite"><span class="gcal__m"></span></div>' +
      '<button class="gcal__nav" type="button" data-cal-next aria-label="' + t("nextMonth", "Next month") + '">'  + R + "</button></div>" +
      '<div class="gcal__dow"></div><div class="gcal__view"><div class="gcal__grid" role="group"></div><div class="gcal__halo gcal__halo--pref" aria-hidden="true"></div><div class="gcal__halo gcal__halo--alt" aria-hidden="true"></div></div>' +
      '<div class="gcal__legend"><span><i class="gl gl--free"></i>' + t("legFree", "Available") + '</span><span><i class="gl gl--half"></i>' + t("legHalf", "Only half the day is free") + '</span><span><i class="gl gl--taken"></i>' + t("legTaken", "Taken") + "</span></div></div>");
    panel.appendChild(glass);
    var dowEl = $(".gcal__dow", glass), grid = $(".gcal__grid", glass), title = $(".gcal__m", glass), viewEl = $(".gcal__view", glass);
    for (var i = 0; i < 7; i++) dowEl.appendChild(el("<span>" + new Date(2024, 0, 1 + i).toLocaleDateString(LANGTAG, { weekday: "narrow" }) + "</span>"));
    var picks = null;
    if (mode === "pick") {
      picks = el('<div class="gcal__picks"><button type="button" class="gcal__pick" data-pick="date"><span class="k">' + o.labels.pref + '</span><span class="v"></span><span class="x" aria-hidden="true">' + X + '</span></button>' +
        '<button type="button" class="gcal__pick" data-pick="alt"><span class="k">' + o.labels.alt + '</span><span class="v"></span><span class="x" aria-hidden="true">' + X + "</span></button></div>");
      mount.appendChild(picks);
      mount.appendChild(el('<p class="gcal__hint">' + t("pickHint", "Choose your preferred day, then an alternative if you have one.") + "</p>"));
      $$(".gcal__pick", picks).forEach(function (b) { b.addEventListener("click", function () { var k = b.getAttribute("data-pick"); if (o.get()[k === "alt" ? "alt" : "date"]) { o.set(k === "alt" ? "alt" : "date", ""); paint(); } }); });
    }
    function build(m) {
      grid.innerHTML = "";
      var n = daysIn(m), lead = dow(m + "-01");
      for (var i = 0; i < lead; i++) grid.appendChild(el('<span class="gday gday--pad"></span>'));
      for (var d = 1; d <= n; d++) {
        var date = m + "-" + String(d).padStart(2, "0"), st = o.state(date);
        var c = el('<button type="button" class="gday is-' + st + (date === today ? " is-today" : "") + '" data-date="' + date + '"><span class="gday__n">' + d + "</span>" +
          (st === "am" || st === "pm" ? '<span class="gday__h">' + (st === "am" ? t("amShort", "AM") : t("pmShort", "PM")) + "</span>" : "") + "</button>");
        c.setAttribute("aria-label", fmt(date, { weekday: "long", day: "numeric", month: "long" }) + ", " + (st === "taken" ? t("legTaken", "Taken") : st === "past" ? "" : st === "free" ? t("legFree", "Available") : t(st === "am" ? "amFree" : "pmFree", "")));
        if (st === "past" || st === "taken") c.setAttribute("aria-disabled", "true");
        grid.appendChild(c);
      }
      for (var k = lead + n; k < Math.ceil((lead + n) / 7) * 7; k++) grid.appendChild(el('<span class="gday gday--pad"></span>'));
      title.textContent = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1, 1).toLocaleDateString(LANGTAG, { month: "long", year: "numeric" });
      $("[data-cal-prev]", glass).disabled = m <= minM; $("[data-cal-next]", glass).disabled = m >= maxM;
      paint();
    }
    function halo(which, date) {
      var h = $(".gcal__halo--" + which, glass), c = date && $('.gday[data-date="' + date + '"]', grid);
      if (!c) { h.classList.remove("on"); return; }
      var r = c.getBoundingClientRect(), v = viewEl.getBoundingClientRect();
      h.style.transform = "translate(" + (r.left - v.left) + "px," + (r.top - v.top) + "px)"; h.style.width = r.width + "px"; h.style.height = r.height + "px";
      h.classList.add("on");
    }
    function paint() {
      var g = mode === "pick" ? o.get() : { date: "", alt: "" };
      $$(".gday[data-date]", grid).forEach(function (c) { var d = c.getAttribute("data-date"); c.classList.toggle("is-pref", d === g.date); c.classList.toggle("is-alt", !!g.alt && d === g.alt); c.setAttribute("aria-pressed", d === g.date || d === g.alt ? "true" : "false"); });
      if (mode === "pick") {
        halo("pref", g.date); halo("alt", g.alt);
        $$(".gcal__pick", picks).forEach(function (b) { var k = b.getAttribute("data-pick"), v = g[k === "alt" ? "alt" : "date"]; b.classList.toggle("on", !!v); $(".v", b).textContent = v ? fmt(v, { weekday: "short", day: "numeric", month: "short" }) : t("pickNone", "Tap a day"); });
      }
    }
    function repaint() { if (view) build(view); }
    function slide(dir) {
      if (SLOW) return build(view);
      grid.classList.add(dir > 0 ? "is-out-l" : "is-out-r"); $$(".gcal__halo", glass).forEach(function (h) { h.classList.remove("on"); });
      setTimeout(function () {
        grid.classList.remove("is-out-l", "is-out-r"); grid.classList.add("no-t", dir > 0 ? "is-in-r" : "is-in-l");
        build(view);
        requestAnimationFrame(function () { requestAnimationFrame(function () { grid.classList.remove("no-t"); grid.classList.remove("is-in-r", "is-in-l"); setTimeout(paint, 60); }); });
      }, 190);
    }
    $("[data-cal-prev]", glass).addEventListener("click", function () { if (view > minM) { view = shiftM(view, -1); slide(-1); } });
    $("[data-cal-next]", glass).addEventListener("click", function () { if (view < maxM) { view = shiftM(view, 1); slide(1); } });
    grid.addEventListener("click", function (e) {
      var c = e.target.closest(".gday[data-date]"); if (!c) return;
      var d = c.getAttribute("data-date"), st = o.state(d);
      if (st === "past") return;
      if (st === "taken") { c.classList.remove("is-shake"); void c.offsetWidth; c.classList.add("is-shake"); if (o.onTaken) o.onTaken(d); return; }
      if (mode === "browse") { location.href = pg((mount.getAttribute("data-enquire") || "enquire.html") + "?date=" + d); return; }
      var g = o.get();
      if (d === g.date) o.set("date", g.alt || ""), g.alt && o.set("alt", "");
      else if (d === g.alt) o.set("alt", "");
      else if (!g.date) o.set("date", d);
      else o.set("alt", d);
      paint();
    });
    grid.addEventListener("keydown", function (e) {
      var c = e.target.closest(".gday[data-date]"); if (!c) return;
      var d = c.getAttribute("data-date"), p = d.split("-"), dt = new Date(+p[0], +p[1] - 1, +p[2]), step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (!step) return; e.preventDefault(); dt.setDate(dt.getDate() + step);
      var n = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
      if (n.slice(0, 7) !== view) { if (n.slice(0, 7) < minM || n.slice(0, 7) > maxM) return; view = n.slice(0, 7); build(view); }
      var f = $('.gday[data-date="' + n + '"]', grid); if (f) f.focus();
    });
    window.addEventListener("resize", function () { paint(); }, { passive: true });
    view = minM; build(view);
    return { repaint: repaint, paint: paint, show: function (d) { if (d && d.slice(0, 7) !== view) { view = d.slice(0, 7); build(view); } else paint(); } };
  }
  /* browse calendars anywhere on the site */
  function calendars() {
    $$('[data-gcal="browse"]').forEach(function (m) {
      var taken = null, t = new Date(), today = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
      var cal = gcal(m, { mode: "browse", minDay: today, state: function (d) {
        if (d < today) return "past"; if (!taken) return "free"; if (taken.indexOf(d) > -1) return "taken";
        var half = taken.filter(function (x) { return x.indexOf(d + ":") === 0; })[0]; return half ? half.slice(-2) : "free";
      } });
      loadTaken(function (list) { taken = list; cal.repaint(); });
    });
  }

  /* ---- Delivery ---------------------------------------------------------
     A static site has no inbox, so a form goes to the crew one of two ways:
     posted to the endpoint the admin set (Web3Forms, Formspree — anything
     that takes JSON), and always as a prepared WhatsApp or email message,
     which in the Maldives is how most enquiries arrive anyway. */
  function deliver(f, kind, d, o) {
    var B = CV.brand || {}, F = B.form || {};
    var lines = [], skip = { at: 1, total: 0 };
    var order = ["name", "email", "phone", "staying", "subject", "excursionTitle", "date", "alt", "guests", "pickup", "extras", "extrasTotal", "arrange", "total", "message", "notes"];
    var label = { name: "Name", email: "Email", phone: "Phone", staying: "Staying at", subject: "Subject", excursionTitle: "Excursion", date: "Date", alt: "Alternative date", guests: "Guests", pickup: "Departure", extras: "Extras", extrasTotal: "Add-ons total", arrange: "On request", total: "Estimate", message: "Message", notes: "Notes" };
    order.forEach(function (k) { if (d[k] && String(d[k]).trim() && !skip[k]) lines.push(label[k] + ": " + [].concat(d[k]).join(", ")); });
    var subject = (kind === "enquiry" ? "Charter enquiry" : "Enquiry") + (d.excursionTitle ? " — " + d.excursionTitle : "") + (d.date ? " · " + d.date : "");
    var text = subject + "\n\n" + lines.join("\n") + "\n\n— sent from " + location.host;
    var wa = $("[data-wa]", o), ml = $("[data-mail]", o);
    if (wa) wa.href = (B.whatsappHref || "https://wa.me/").split("?")[0] + "?text=" + encodeURIComponent(text);
    if (ml) ml.href = "mailto:" + (B.email || "") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
    try { var a = JSON.parse(localStorage.getItem("cv.enquiries") || "[]"); d.at = new Date().toISOString(); a.push(d); localStorage.setItem("cv.enquiries", JSON.stringify(a)); } catch (x) {}
    function show(sent) {
      if (!sent) {
        var e1 = $("[data-ok-eyebrow]", o), h = $("[data-ok-h]", o), p = $("[data-ok-p]", o);
        if (e1) e1.textContent = t("oneMore", "One more step");
        if (h) h.textContent = t("sendToCrew", "Send it to the crew");
        if (p) p.textContent = t("alreadyWritten", "The message is already written — choose WhatsApp or email and it goes straight to the marina office.");
      }
      f.hidden = true;
      var steps = f.parentNode && $(".steps", f.parentNode); if (steps) steps.hidden = true;   // the form is done
      if (o) { o.classList.add("on"); o.scrollIntoView({ behavior: SLOW ? "auto" : "smooth", block: "center" }); }
    }
    var body = {}; Object.keys(d).forEach(function (k) { body[k] = [].concat(d[k]).join(", "); });
    body.subject = subject; body.lang = LOC; body.page = location.pathname.split("/").pop() || "index.html";
    if (body.website) return show(true);                       // the honeypot caught a robot
    delete body.website;
    var btn = $('[type="submit"]', f); if (btn) btn.disabled = true;
    var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    if (F.endpoint) { var extra = Object.assign({ kind: kind }, body); if (F.key) extra.access_key = F.key; fetch(F.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(extra) }).catch(function () {}); }   // an extra copy, if the office wants one
    var sent = ENV.SUPABASE_URL ? db("inbox", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ id: id, kind: kind, data: body }) }).then(function (r) { return r.ok; }) : Promise.resolve(false);
    sent.then(function (ok) { show(ok); }, function () { show(false); }).then(function () { if (btn) btn.disabled = false; });
  }

  function forms() {
    $$("form[data-ok]").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!f.checkValidity()) return f.reportValidity();
        var d = {}; new FormData(f).forEach(function (v, k) { d[k] = d[k] ? [].concat(d[k], v) : v; });
        deliver(f, "contact", d, $("#" + f.getAttribute("data-ok")));
      });
    });
  }

  /* a lazy photograph fades in as it lands instead of popping */
  function lazyFade() {
    if (SLOW) return;
    $$("img[loading=lazy]").forEach(function (im) {
      if (im.complete && im.naturalWidth) return;
      im.classList.add("lz");
      var on = function () { im.classList.add("ld"); };
      im.addEventListener("load", on, { once: true }); im.addEventListener("error", on, { once: true });
      if (im.complete) on();                      // it landed while we were looking
    });
  }

  function boot() {
    chrome(); header(); menu(); heroCycle(); video(); lines(); reveals(); scrollFx(); counters(); lazyFade();
    rails(); lightbox(); mosaic();   /* the lightbox takes its order before the columns move things */ accordion(); enquiry(); calendars(); forms(); voyageIndex(); player(); language(); driver(); ready();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
