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
  var SLOW = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SAVE = (navigator.connection && (navigator.connection.saveData ||
              /^([23]g|slow-2g)$/.test(navigator.connection.effectiveType || ""))) || false;
  var TOUCH = window.matchMedia("(hover: none)").matches;

  function u(p) { return ROOT + p; }                    // an asset, from the site root
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
            '<i aria-hidden="true"></i>' + t("menu", "Menu") + "</button></div>" +
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
      var prev = ft.previousElementSibling;
      if (prev && prev.tagName === "MAIN") prev = prev.lastElementChild;
      sea((prev && prev.classList && prev.classList.contains("section--navy")) ? prev : ft);
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
      '<footer class="ftr"><div class="wrap"><div class="ftr__top">' +
        '<div data-a="up"><img src="' + u("assets/img/logo-full-white.webp") + '" alt="' + B.name + '" width="90" height="46" loading="lazy">' +
          '<p class="small ftr__tag">' + B.tagline + ".</p></div>" +
        '<div data-a="up"><h4>' + t("explore", "Explore") + "</h4><ul>" + links + "</ul></div>" +
        '<div data-a="up"><h4>' + B.name + "</h4><ul>" +
          '<li><a href="' + B.phoneHref + '">' + B.phone + "</a></li>" +
          '<li><a href="mailto:' + B.email + '">' + B.email + "</a></li>" +
          "<li>" + B.marina + "</li><li>" + (B.address || []).join(", ") + "</li><li>" + B.hours + "</li>" +
        "</ul></div>" +
      '</div><div class="ftr__b"><span>© ' + B.year + " " + B.legal + "</span><span>" + B.vessel + "</span>" +
      '<span>' + t("siteBy", "Site by") + ' <a href="https://dheemi.com" rel="noopener">Dheemi Studio</a></span>' +
      "</div></div></footer>"
    );
  }

  /* ---- The sea ---------------------------------------------------------- */
  /* One 1440-unit period, tiled twice inside a 2880 viewBox, so a -50% shift
     loops seamlessly. Each layer drifts at its own speed and direction. */
  var PERIOD = 1440, SEAH = 240;
  function crest(y0, segs) {
    var d = "M0," + y0, x;
    for (var t = 0; t < 2; t++) {
      var o = t * PERIOD;
      for (var i = 0; i < segs.length; i++) {
        var g = segs[i];
        d += " C" + (g[0] + o) + "," + g[1] + " " + (g[2] + o) + "," + g[3] + " " + (g[4] + o) + "," + g[5];
      }
    }
    return d;
  }
  var LAYERS = [
    { y: 88,  s: [[150,36,250,126,390,96],[520,68,610,140,740,110],[880,82,970,40,1090,66],[1220,90,1330,128,1440,88]] },
    { y: 114, s: [[110,166,270,62,410,104],[550,144,630,60,770,94],[910,128,1020,56,1160,88],[1300,118,1360,150,1440,114]] },
    { y: 146, s: [[160,192,290,96,430,136],[570,176,670,100,810,132],[950,166,1070,92,1210,124],[1350,158,1400,178,1440,146]] }
  ];
  function sea(host) {
    var fill = function (d) { return d + " L" + (PERIOD * 2) + "," + SEAH + " L0," + SEAH + " Z"; };
    var body = "";
    LAYERS.forEach(function (L, i) {
      body += '<g class="sea__l l' + (i + 1) + '"><path class="wv" d="' + fill(crest(L.y, L.s)) + '"/></g>';
    });
    var front = crest(LAYERS[2].y, LAYERS[2].s);
    // light refracting down through the surface
    body += '<g class="sea__l l3 sea__rg"><path class="sea__refr" d="' + fill(front) + '"/></g>';
    // chromatic split along the crest: three channels, a hair apart
    body += '<g class="sea__l l3 sea__chr">' +
      '<path class="ch r" d="' + front + '"/>' +
      '<path class="ch g" d="' + front + '"/>' +
      '<path class="ch b" d="' + front + '"/>' +
      '<path class="ch f" d="' + front + '"/></g>';
    var w = el('<div class="sea" aria-hidden="true"><svg viewBox="0 0 ' + (PERIOD * 2) + " " + SEAH +
      '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="cvRefr" gradientUnits="userSpaceOnUse" x1="0" y1="126" x2="0" y2="240">' +
      '<stop offset="0" stop-color="#D8ECFF" stop-opacity=".16"/>' +
      '<stop offset=".16" stop-color="#8CBEEA" stop-opacity=".05"/>' +
      '<stop offset=".55" stop-color="#3E7FC4" stop-opacity=".012"/>' +
      '<stop offset="1" stop-color="#03224D" stop-opacity="0"/></linearGradient></defs>' +
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
  function tier(max) {
    var w = window.innerWidth * (window.devicePixelRatio > 1.5 ? 1.4 : 1);
    var t = w > 1900 ? 1440 : w > 1200 ? 1080 : w > 700 ? 720 : 540;
    return Math.min(t, max || 1080);
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
    var host = v.closest(".hero, .band, .fig, .section--deep");
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
    if (!still) return;
    setTimeout(function () { if (v.classList.contains("on")) still.style.visibility = "hidden"; }, 1500);
  }
  function show(v) {
    v.classList.add("on");
    control(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () { v.classList.remove("on"); });
    else retire(v);
    if (p && p.then) p.then(function () { retire(v); }, function () {});
  }
  function fadeIn(v) {
    if (v.readyState >= 3) return show(v);
    v.addEventListener("canplay", function () { show(v); }, { once: true });
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

    function show(n) {
      var prev = at; at = (n + slides.length) % slides.length;
      slides[at].classList.add("on");
      if (prev !== at) slides[prev].classList.remove("on");
      poster(slides[at]);
      var st = $("img", slides[at]); if (st) st.style.visibility = "";
      var v = vids[at];
      if (v) { load(v, v.getAttribute("data-src"), +v.getAttribute("data-max")); v.currentTime = 0; fadeIn(v); }
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

    function start(v) { fadeIn(load(v, v.getAttribute("data-src"), +v.getAttribute("data-max"))); }

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
    audio.volume = 0.55;
    var i = 0, ready = false;
    var elT = $("#musT"), elBy = $("#musBy"), elFill = $("#musFill"), elPlay = $("#musPlay"), elBar = $("#musBar");

    function store(k, v) { try { sessionStorage.setItem("cv.mus." + k, v); } catch (e) {} }
    function read(k) { try { return sessionStorage.getItem("cv.mus." + k); } catch (e) { return null; } }

    function paint() {
      var t = M.tracks[i];
      elT.textContent = t.title;
      elBy.innerHTML = t.by + ' &middot; <a href="' + t.at + '" target="_blank" rel="noopener">' + t.lic + "</a>";
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
      store("on", on ? "1" : "0");
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
    elPlay.addEventListener("click", function () { audio.paused ? play() : audio.pause(); });
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

    /* One quiet invitation, five seconds, once per visit. It never appears if
       the player is already open or already playing, and any use kills it. */
    function nudge() {
      if (SLOW || read("open") === "1" || read("on") === "1" || read("nudged") === "1") return;
      var n = el('<div class="mus__n" role="status"><span>' +
        t("nudge", "Turn the sound on") + "</span>" +
        '<i class="mus__nq" aria-hidden="true"></i></div>');
      wrap.appendChild(n);
      var out;
      function go() {
        clearTimeout(out);
        n.classList.remove("in");
        setTimeout(function () { n.remove(); }, 600);
        store("nudged", "1");
      }
      setTimeout(function () { n.classList.add("in"); out = setTimeout(go, 5000); }, 2200);
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
      var p = audio.play();
      if (p && p.catch) p.catch(function () { setPlaying(false); });
    }
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
    var m = $(".mosaic"); if (!m) return;
    var items = $$(":scope > figure, :scope > .mosaic__col > figure", m);
    if (!items.length) return;
    var at = -1;
    function cols() { return window.innerWidth >= 1100 ? 3 : window.innerWidth >= 480 ? 2 : 1; }
    function lay() {
      var n = cols();
      if (n === at) return;
      at = n;
      var made = [];
      for (var i = 0; i < n; i++) made.push(el('<div class="mosaic__col"></div>'));
      items.forEach(function (f, i) { made[i % n].appendChild(f); });
      m.textContent = "";
      made.forEach(function (c) { m.appendChild(c); });
    }
    lay();
    var t;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(lay, 150); }, { passive: true });
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

  /* ---- Enquiry --------------------------------------------------------- */
  function enquiry() {
    var f = $("#enquire"); if (!f) return;
    var steps = $$(".step", f), marks = $$(".steps li"), at = 0;
    function money(n) {
      var c = (CV.rates && CV.rates.currency) || "USD";
      return c + " " + Number(n).toLocaleString(LOC === "zh" || LOC === "en" ? "en-US" : LOC);
    }
    function chosen() {
      var v = $('input[name="excursion"]:checked', f);
      return v ? (CV.voyages || []).filter(function (x) { return x.slug === v.value; })[0] : null;
    }
    function sum() {
      var v = chosen(), g = Number(($('[name="guests"]', f) || {}).value || 0), d = ($('[name="date"]', f) || {}).value || "";
      var ex = $$('input[name="extra"]:checked', f);
      $("[data-s-v]").textContent = v ? v.title : "—";
      $("[data-s-a]").textContent = v ? v.area + " · " + v.duration : "—";
      $("[data-s-d]").textContent = d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";
      $("[data-s-g]").textContent = g ? g + " " + t("guestsWord", "guests") : "—";
      $("[data-s-e]").textContent = ex.length ? ex.map(function (i) { return i.getAttribute("data-label"); }).join(", ") : t("none", "None");
      var add = ex.reduce(function (s, i) { return s + Number(i.getAttribute("data-price") || 0); }, 0);
      /* the package price only holds at the party size the client quoted;
         at any other number the charter itself goes back to an enquiry */
      var pax = (CV.rates && CV.rates.pax) || 7;
      var priced = v && v.price != null && g === pax;
      $("[data-s-t]").textContent = !v ? "—"
        : priced ? money(v.price + add)
        : add ? money(add) + " + " + t("charterOnEnquiry", "charter on enquiry")
        : t("onRequest", "On request");
    }
    function go(n, quiet) {
      at = Math.max(0, Math.min(steps.length - 1, n));
      steps.forEach(function (s, k) { s.classList.toggle("on", k === at); });
      marks.forEach(function (m, k) { m.classList.toggle("on", k === at); m.classList.toggle("done", k < at); });
      if (at === steps.length - 1) sum();
      if (!quiet) window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY - 140, behavior: SLOW ? "auto" : "smooth" });
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
    go(0, true);
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
    chrome(); header(); menu(); heroCycle(); video(); lines(); reveals(); scrollFx(); counters();
    rails(); lightbox(); mosaic();   /* the lightbox takes its order before the columns move things */ accordion(); enquiry(); forms(); voyageIndex(); player(); language(); driver(); ready();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
