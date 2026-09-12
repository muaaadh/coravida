/* ==========================================================================
   CORAVIDA — admin: the website's content.
   Every editor below binds straight onto Admin.C.draft, a working copy of
   content/site.json; Publish (in app.js) commits it.
   ========================================================================== */
(function (A) {
  "use strict";
  var E = A.E, $ = A.$, $$ = A.$$, esc = A.esc, C = A.C, svg = A.svg, iconBtn = A.iconBtn, toast = A.toast;
  var IMG = "../assets/img/", VID = "../assets/video/";

  /* ---------------------------------------------------------------- field builders */
  function field(label, obj, key, opts) {
    opts = opts || {};
    var id = "f-" + Math.random().toString(36).slice(2, 8);
    var wrap = E("div", { class: "field" }), lab = E("label", { for: id }, [label]);
    if (opts.hint) lab.appendChild(E("span", { class: "hint", text: opts.hint }));
    var input;
    if (opts.type === "textarea") {
      input = E("textarea", { id: id, class: opts.body ? "is-body" : "", placeholder: opts.placeholder || "", spellcheck: "true" });
      input.value = obj[key] == null ? "" : obj[key];
    } else if (opts.type === "select") {
      input = E("select", { id: id });
      (opts.options || []).forEach(function (o) { input.appendChild(E("option", { value: o[0], text: o[1], selected: String(obj[key]) === String(o[0]) })); });
    } else {
      input = E("input", { id: id, type: opts.type || "text", placeholder: opts.placeholder || "", autocomplete: "off", spellcheck: "false", inputmode: opts.type === "number" ? "decimal" : null, step: opts.step, min: opts.min, max: opts.max });
      input.value = obj[key] == null ? "" : obj[key];
    }
    if (opts.max && opts.type !== "number") { var c = E("span", { class: "count" }); lab.appendChild(c); var upd = function () { c.textContent = input.value.length + " / " + opts.max; }; upd(); input.addEventListener("input", upd); }
    if (opts.readonly) input.readOnly = true;
    if (opts.prefix) { var m = E("div", { class: "money-in" }, [E("i", { text: opts.prefix }), input]); input = m; }
    var real = opts.prefix ? input.querySelector("input") : input;
    real.addEventListener("input", function () {
      var v = real.value;
      obj[key] = opts.type === "number" ? (v === "" ? null : Number(v)) : v;
      if (opts.onchange) opts.onchange(obj[key]);
      wrap._validate(); A.changed();
    });
    wrap.appendChild(lab); wrap.appendChild(input);
    if (opts.help) wrap.appendChild(E("p", { class: "field__help", text: opts.help }));
    var err = E("span", { class: "field__err" }); wrap.appendChild(err);
    wrap._validate = function () {
      var v = String(obj[key] == null ? "" : obj[key]).trim(), msg = "";
      if (opts.required && !v) msg = "This is required.";
      else if (v && opts.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = "That does not look like an email address.";
      else if (v && opts.type === "url" && !/^https?:\/\//.test(v)) msg = "Include https:// at the start.";
      else if (opts.validate) msg = opts.validate(v) || "";
      wrap.classList.toggle("is-bad", !!msg); err.textContent = msg;
      return !msg;
    };
    return wrap;
  }

  /* an ordered list of records with move / remove, re-rendered on change */
  function list(host, arr, opts) {
    function draw() {
      host.innerHTML = "";
      if (!arr.length) host.appendChild(E("p", { class: "small mute", text: opts.empty || "Nothing here yet." }));
      arr.forEach(function (item, i) {
        var tools = E("div", { class: "row__tools" });
        if (opts.move !== false) {
          tools.appendChild(iconBtn("up", "Move up", function () { if (i > 0) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); A.changed(); draw(); } }));
          tools.appendChild(iconBtn("down", "Move down", function () { if (i < arr.length - 1) { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); A.changed(); draw(); } }));
        }
        tools.appendChild(iconBtn("trash", "Remove", function () {
          var go = function () { arr.splice(i, 1); A.changed(); draw(); };
          if (opts.confirm) A.confirm("Remove this?", opts.confirm, "Remove", true).then(function (ok) { if (ok) go(); }); else go();
        }));
        var body = E("div", { class: "row__body" });
        opts.render(item, i, body, draw);
        host.appendChild(E("div", { class: "row" }, [body, tools]));
      });
    }
    draw();
    return draw;
  }
  function chips(arr, placeholder) {
    var wrap = E("div", {}), box = E("div", { class: "chips" });
    function draw() {
      box.innerHTML = "";
      arr.forEach(function (s, i) { box.appendChild(E("span", { class: "chip" }, [s, E("button", { type: "button", "aria-label": "Remove " + s, text: "✕", onclick: function () { arr.splice(i, 1); A.changed(); draw(); } })])); });
    }
    var inp = E("input", { placeholder: placeholder || "Add one and press Enter" });
    var add = function () { var v = inp.value.trim(); if (!v) return; arr.push(v); inp.value = ""; A.changed(); draw(); };
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); add(); } });
    draw();
    wrap.appendChild(box);
    wrap.appendChild(E("div", { class: "chip-add" }, [inp, E("button", { class: "btn btn--ghost", type: "button", text: "Add", onclick: add })]));
    return wrap;
  }

  /* ---------------------------------------------------------------- media */
  function images() {
    var m = (C.media && C.media.images) || [];
    var out = m.map(function (i) { return { name: i.name, src: IMG + i.name + "-900.webp", w: i.w, h: i.h }; });
    C.uploads.forEach(function (u) { out.push({ name: u.name, src: u.preview, w: u.w, h: u.h, isNew: true }); });
    return out;
  }
  function clips() { return (C.media && C.media.clips) || []; }
  function thumbSrc(name) { var u = C.uploads.filter(function (x) { return x.name === name; })[0]; return u ? u.preview : IMG + name + "-900.webp"; }

  function imagePick(label, obj, key, opts) {
    opts = opts || {};
    var wrap = E("div", { class: "field" });
    var lab = E("label", {}, [label]); if (opts.hint) lab.appendChild(E("span", { class: "hint", text: opts.hint }));
    wrap.appendChild(lab);
    var grid = E("div", { class: "pick", role: "radiogroup", "aria-label": label }), name = "pick-" + Math.random().toString(36).slice(2, 8);
    function draw() {
      grid.innerHTML = "";
      images().filter(function (i) { return !opts.exclude || !opts.exclude(i.name) || i.name === obj[key]; }).forEach(function (i) {
        var inp = E("input", { type: "radio", name: name, value: i.name, checked: obj[key] === i.name });
        inp.addEventListener("change", function () { obj[key] = i.name; if (opts.onpick) opts.onpick(i.name); A.changed(); });
        grid.appendChild(E("label", { class: i.isNew ? "is-new" : "" }, [inp, E("img", { src: i.src, alt: "", loading: "lazy" }), E("span", { text: i.name })]));
      });
      grid.appendChild(uploadTile(function (u) { obj[key] = u.name; A.changed(); draw(); }));
    }
    draw();
    wrap.appendChild(grid);
    return wrap;
  }
  function uploadTile(after) {
    var inp = E("input", { type: "file", accept: "image/jpeg,image/png,image/webp", hidden: true });
    inp.addEventListener("change", function () { var f = inp.files && inp.files[0]; if (f) upload(f).then(function (u) { if (u && after) after(u); }); inp.value = ""; });
    return E("label", { class: "" }, [inp, E("div", { class: "up", html: svg("plus") + "<span>Upload a photograph</span>" })]);
  }
  /* resize in the browser so a phone photograph does not put 6 MB in the
     repository; the build cuts the web tiers from this */
  function upload(file) {
    if (C.readonly) { toast("Add a GitHub token in Settings before uploading.", "err"); return Promise.resolve(null); }
    var base = A.slug(file.name.replace(/\.[^.]+$/, "")) || "photo";
    var taken = images().map(function (i) { return i.name; });
    var node = E("div", {}), nameIn = E("input", { value: base });
    node.appendChild(E("div", { class: "field" }, [E("label", { text: "Name (used in the address of the picture — lower-case, hyphens)" }), nameIn]));
    var nm = null;
    return A.dialog({ title: "Add “" + file.name + "”", node: node, actions: [["Cancel", "btn--ghost", null], ["Add", "btn--go", "ok"]], validate: function () {
      nm = A.slug(nameIn.value);
      if (!nm) { toast("Give it a name.", "err"); return false; }
      if (taken.indexOf(nm) > -1) { toast("There is already a photograph called " + nm + ".", "err"); return false; }
      return true;
    } }).then(function (r) {
      if (r !== "ok") return null;
      toast("Preparing " + nm + "…");
      return createImageBitmap(file, { imageOrientation: "from-image" }).then(function (bm) {
        var MAX = 2400, s = Math.min(1, MAX / Math.max(bm.width, bm.height));
        var w = Math.round(bm.width * s), h = Math.round(bm.height * s);
        var cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(bm, 0, 0, w, h);
        var dataUrl = cv.toDataURL("image/jpeg", 0.86);
        var pv = document.createElement("canvas"); var ps = Math.min(1, 480 / w); pv.width = Math.round(w * ps); pv.height = Math.round(h * ps);
        pv.getContext("2d").drawImage(bm, 0, 0, pv.width, pv.height);
        var u = { name: nm, b64: dataUrl.split(",")[1], preview: pv.toDataURL("image/jpeg", 0.8), w: w, h: h };
        if (w < 900) { toast("That picture is only " + w + "px wide — it will look soft. Use a larger one if you can.", "err"); }
        C.uploads.push(u);
        var bytes = C.uploads.reduce(function (t, x) { return t + x.b64.length; }, 0);
        if (bytes < 4.2e6) A.lsSet(A.KEY.uploads, C.uploads); else toast("Uploads are held in memory now — publish before closing this tab.", "err");
        A.changed(); toast(nm + " is ready — it uploads when you publish.", "ok");
        return u;
      }).catch(function (e) { toast("Could not read that file: " + e.message, "err"); return null; });
    });
  }
  function clipSelect(label, obj, key, opts) {
    var options = clips().map(function (c) { return [c.name, c.name + " (up to " + c.max + "p)"]; });
    return field(label, obj, key, Object.assign({ type: "select", options: options }, opts || {}));
  }
  function head(host, title, p, extra) {
    host.appendChild(E("div", { class: "pagehead" }, [E("div", {}, [E("h2", { text: title }), p ? E("p", { text: p }) : null]), extra || null]));
  }
  var ready = function (host) { if (!C.draft) { host.appendChild(E("div", { class: "note note--warn", html: "Nothing loaded yet — open <a href='#settings'>Settings</a> and connect to GitHub." })); return false; } return true; };

  /* ---------------------------------------------------------------- Brand & contact */
  A.register({ id: "brand", group: "Website", label: "Brand & contact", icon: "brand", render: function (host) {
    if (!ready(host)) return;
    var b = C.draft.brand; b.address = b.address || ["", "", ""]; b.form = b.form || { endpoint: "", key: "" };
    head(host, "Brand & contact", "What the header, footer and contact page say. Telephone numbers also become the WhatsApp and call links.");
    var syncPhone = function () { var d = String(b.phone || "").replace(/[^\d]/g, ""); b.phoneHref = "tel:+" + d; b.whatsappHref = "https://wa.me/" + d; };
    host.appendChild(E("div", { class: "card" }, [
      E("h3", { text: "Names" }),
      E("div", { class: "fg fg2" }, [field("Company", b, "name", { required: true }), field("Legal name (footer)", b, "legal", { required: true }), field("Flagship vessel", b, "vessel", { required: true }), field("Tagline", b, "tagline", { max: 80 })])
    ]));
    host.appendChild(E("div", { class: "card" }, [
      E("h3", { text: "Contact" }),
      E("div", { class: "fg fg2" }, [
        field("Telephone / WhatsApp", b, "phone", { required: true, help: "With the country code, e.g. +960 777 1234.", onchange: syncPhone }),
        field("Email", b, "email", { type: "email", required: true }),
        field("Marina / berth", b, "marina", { required: true }),
        field("Opening hours", b, "hours")
      ]),
      E("div", { class: "fg fg3" }, [field("Address line 1", b.address, 0), field("Address line 2", b.address, 1), field("Address line 3", b.address, 2)])
    ]));
    host.appendChild(E("div", { class: "card" }, [
      E("div", { class: "card__h" }, [E("div", {}, [E("h3", { text: "Where enquiries go" }), E("p", { text: "Every enquiry and contact message is offered to the visitor as a prepared WhatsApp or email to the details above. Add a form endpoint and it is also posted there automatically." })])]),
      E("div", { class: "fg fg2" }, [
        field("Form endpoint (optional)", b.form, "endpoint", { type: "url", placeholder: "https://api.web3forms.com/submit", help: "Web3Forms, Formspree or any service that accepts JSON. Leave empty to rely on WhatsApp and email." }),
        field("Access key (if the service needs one)", b.form, "key", { placeholder: "Web3Forms access key" })
      ])
    ]));
  } });

  /* ---------------------------------------------------------------- Hero film */
  A.register({ id: "hero", group: "Website", label: "Hero film", icon: "film", render: function (host) {
    if (!ready(host)) return;
    var h = C.draft.hero;
    head(host, "Hero film", "The clips that open the home page, in order. Each holds for the interval, then the next fades in.");
    var out = E("output", { text: (h.interval / 1000).toFixed(0) + " s" });
    var rng = E("input", { type: "range", min: 5, max: 15, step: 1, value: Math.round(h.interval / 1000) });
    rng.addEventListener("input", function () { h.interval = Number(rng.value) * 1000; out.textContent = rng.value + " s"; A.changed(); });
    host.appendChild(E("div", { class: "card" }, [E("div", { class: "field" }, [E("label", { text: "Seconds each clip holds" }), E("div", { class: "range" }, [rng, out])]),
      E("p", { class: "field__help", text: "Seven to ten reads well. The drift on each clip is timed to this." })]));
    var card = E("div", { class: "card" }), rows = E("div", { class: "rows" });
    card.appendChild(E("div", { class: "card__h" }, [E("h3", { text: "Clips" }), E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Add a clip", onclick: function () {
      var c = clips()[0]; if (!c) return toast("No clips are built.", "err");
      h.clips.push({ src: c.name, poster: c.poster || "poster-" + c.name, max: c.max, alt: "" }); A.changed(); draw();
    } })]));
    var draw = list(rows, h.clips, { render: function (c, i, body) {
      var preview = E("video", { src: VID + c.src + "-540.mp4", muted: true, playsinline: true, loop: true, preload: "metadata", class: "thumb thumb--lg", style: "width:160px;height:90px;border-radius:8px;object-fit:cover" });
      preview.addEventListener("mouseenter", function () { preview.play().catch(function () {}); }); preview.addEventListener("mouseleave", function () { preview.pause(); });
      body.appendChild(E("div", { style: "display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap" }, [preview, E("div", { style: "flex:1;min-width:220px", class: "fg" }, [
        clipSelect("Clip", c, "src", { onchange: function (v) { var k = clips().filter(function (x) { return x.name === v; })[0]; if (k) { c.poster = k.poster || "poster-" + v; c.max = k.max; } preview.src = VID + v + "-540.mp4"; } }),
        field("Description for screen readers", c, "alt", { max: 120, required: true })
      ])]));
    }, empty: "No clips — the home page needs at least one." });
    card.appendChild(rows); host.appendChild(card);
  } });

  /* ---------------------------------------------------------------- Excursions */
  A.register({ id: "excursions", group: "Website", label: "Excursions & prices", icon: "route", render: function (host, arg) {
    if (!ready(host)) return;
    var V = C.draft.voyages, R = C.draft.rates;
    if (arg) {
      var v = V.filter(function (x) { return x.slug === arg; })[0];
      if (!v) { host.appendChild(E("div", { class: "note note--bad", html: "No excursion called “" + esc(arg) + "”. <a href='#excursions'>Back to the list.</a>" })); return; }
      return editVoyage(host, v);
    }
    head(host, "Excursions & prices", "What the site quotes: a package price for the whole vessel at the party size below. Any other number is priced on enquiry.",
      E("button", { class: "btn btn--go", type: "button", text: "New excursion", onclick: function () {
        var node = E("div", {}), t = E("input", { placeholder: "e.g. Manta Point & Lunch" });
        node.appendChild(E("div", { class: "field" }, [E("label", { text: "Title" }), t]));
        A.dialog({ title: "New excursion", node: node, actions: [["Cancel", "btn--ghost", null], ["Create", "btn--go", "ok"]], validate: function () { return !!A.slug(t.value); } }).then(function (r) {
          if (r !== "ok") return;
          var s = A.slug(t.value); if (V.some(function (x) { return x.slug === s; })) return toast("There is already an excursion at that address.", "err");
          var first = images()[0], c = clips()[0];
          V.push({ slug: s, title: t.value.trim(), kind: "Full day", duration: "8 hours", guests: "Up to 12", season: "Year round", area: "North Malé Atoll", departs: "09:00 · Hulhumalé", price: 1350,
            clip: c ? c.name : "", clipMax: c ? c.max : 1080, plate: { img: first ? first.name : "", stop: 1 }, img: first ? first.name : "", alt: "", line: "", intro: "",
            plan: [{ t: "09:00", h: "Hulhumalé", d: "Out from the jetty." }, { t: "17:00", h: "Hulhumalé", d: "Alongside." }], has: [] });
          A.changed(); A.go("excursions/" + s);
        });
      } }));
    host.appendChild(E("div", { class: "card" }, [E("h3", { text: "Pricing basis" }), E("div", { class: "fg fg3" }, [
      field("Priced for a party of", R, "pax", { type: "number", min: 1, max: 12, step: 1, required: true, help: "The enquiry form defaults to this and shows the package price only at this number." }),
      field("Currency", R, "currency", { type: "select", options: [["USD", "USD — US dollar"], ["EUR", "EUR — euro"], ["MVR", "MVR — rufiyaa"]] })
    ])]));
    var card = E("div", { class: "card" }), rows = E("div", { class: "rows" });
    card.appendChild(E("div", { class: "card__h" }, [E("h3", { text: V.length + " excursions, in the order they appear" })]));
    list(rows, V, { confirm: "The page for it disappears from the site when you publish. Bookings already in the books keep their record.", render: function (v, i, body) {
      body.appendChild(E("div", { style: "display:flex;gap:1rem;align-items:center;flex-wrap:wrap" }, [
        E("img", { class: "thumb", src: thumbSrc(v.img), alt: "" }),
        E("div", { style: "flex:1;min-width:200px" }, [E("div", { class: "row__t" }, [E("a", { href: "#excursions/" + v.slug, text: v.title })]), E("div", { class: "small body", text: v.kind + " · " + v.duration + " · " + v.area })]),
        E("div", { class: "num", style: "font-weight:500", text: v.price == null ? "On request" : R.currency + " " + Number(v.price).toLocaleString("en-US") }),
        E("a", { class: "btn btn--ghost btn--sm", href: "#excursions/" + v.slug, text: "Edit" })
      ]));
    } });
    card.appendChild(rows); host.appendChild(card);
  } });

  function editVoyage(host, v) {
    var R = C.draft.rates;
    host.appendChild(E("div", { class: "crumb", html: "<a href='#excursions'>Excursions</a> › " + esc(v.title) }));
    head(host, v.title, "Address on the site: excursions/" + v.slug + ".html", E("a", { class: "btn btn--ghost btn--sm", href: A.siteUrl() + "excursions/" + v.slug + ".html", target: "_blank", rel: "noopener", text: "View page ↗" }));
    v.plate = v.plate || { img: "", stop: 0 }; v.plan = v.plan || []; v.has = v.has || [];
    host.appendChild(E("div", { class: "card" }, [E("h3", { text: "Essentials" }),
      E("div", { class: "fg fg2" }, [
        field("Title", v, "title", { required: true, max: 40 }),
        field("Price for " + R.pax + " (" + R.currency + ")", v, "price", { type: "number", min: 0, step: 1, prefix: R.currency, help: "Leave empty to show “On request”." }),
        field("Kind", v, "kind", { type: "select", options: [["Full day", "Full day"], ["Half day", "Half day"], ["Evening", "Evening"], ["Overnight", "Overnight"]] }),
        field("Duration", v, "duration", { placeholder: "9.5 hours", required: true }),
        field("Departs", v, "departs", { placeholder: "08:30 · Hulhumalé", required: true }),
        field("Area", v, "area", { placeholder: "North Malé Atoll", required: true }),
        field("Guests", v, "guests", { placeholder: "Up to 12" }),
        field("Season", v, "season", { placeholder: "Year round or Nov – Apr" })
      ])]));
    host.appendChild(E("div", { class: "card" }, [E("h3", { text: "Words" }),
      field("One line (the index and cards)", v, "line", { max: 110, required: true }),
      field("Introduction", v, "intro", { type: "textarea", max: 320, required: true })]));
    var planCard = E("div", { class: "card" }), planRows = E("div", { class: "rows" });
    planCard.appendChild(E("div", { class: "card__h" }, [E("h3", { text: "The day, stop by stop" }), E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Add a stop", onclick: function () { v.plan.push({ t: "", h: "", d: "" }); A.changed(); drawPlan(); } })]));
    var stopSel = null;
    var stopOpts = function () { return v.plan.map(function (p, i) { return [i, (p.t || "—") + " " + (p.h || "")]; }); };
    var refreshStops = function () {
      if (!stopSel) return;
      var sel = stopSel.querySelector("select"); sel.innerHTML = "";
      stopOpts().forEach(function (o) { sel.appendChild(E("option", { value: o[0], text: o[1], selected: String(v.plate.stop) === String(o[0]) })); });
      if (v.plate.stop >= v.plan.length) { v.plate.stop = Math.max(0, v.plan.length - 1); sel.value = v.plate.stop; }
    };
    var drawPlan = list(planRows, v.plan, { render: function (p, i, body) {
      body.appendChild(E("div", { class: "fg", style: "grid-template-columns:90px minmax(0,1fr)" }, [field("Time", p, "t", { placeholder: "09:00", required: true }), field("Stop", p, "h", { required: true, max: 40, onchange: refreshStops })]));
      body.appendChild(field("What happens", p, "d", { max: 140 }));
      refreshStops();
    } });
    planCard.appendChild(planRows); host.appendChild(planCard);
    host.appendChild(E("div", { class: "card" }, [E("h3", { text: "What is included" }), chips(v.has, "e.g. Lunch aboard — Enter to add")]));
    stopSel = field("Caption it with this stop", v.plate, "stop", { type: "select", options: stopOpts(), onchange: function (val) { v.plate.stop = Number(val); } });
    host.appendChild(E("div", { class: "card" }, [E("h3", { text: "Pictures and film" }),
      clipSelect("Film at the top of the page", v, "clip", { onchange: function (n) { var k = clips().filter(function (x) { return x.name === n; })[0]; if (k) v.clipMax = k.max; } }),
      imagePick("Card photograph (index, home and related lists)", v, "img"),
      field("Describe the card photograph", v, "alt", { max: 120, required: true, help: "For screen readers and search engines." }),
      imagePick("Plate photograph (mid-page)", v.plate, "img"),
      stopSel
    ]));
  }

  /* ---------------------------------------------------------------- Add-ons */
  A.register({ id: "addons", group: "Website", label: "Add-ons", icon: "plus", render: function (host) {
    if (!ready(host)) return;
    var Ad = C.draft.addons, R = C.draft.rates;
    var card = E("div", { class: "card" }), rows = E("div", { class: "rows" });
    head(host, "Add-ons", "Extras offered on the enquiry form and the excursions page, each with its price.",
      E("button", { class: "btn btn--go", type: "button", text: "Add one", onclick: function () { Ad.push({ id: "addon-" + A.uid().slice(-4), t: "", d: "", p: 0 }); A.changed(); draw(); } }));
    var draw = list(rows, Ad, { render: function (a, i, body) {
      body.appendChild(E("div", { class: "fg fg--price" }, [field("Name", a, "t", { required: true, max: 40, onchange: function (t) { if (!a._fixed) a.id = A.slug(t) || a.id; } }), field("Price", a, "p", { type: "number", min: 0, prefix: R.currency })]));
      body.appendChild(field("One line", a, "d", { max: 90 }));
      a._fixed = !!a.id;
    } });
    card.appendChild(rows); host.appendChild(card);
  } });

  /* ---------------------------------------------------------------- Our vessels */
  A.register({ id: "vessel", group: "Website", label: "Our vessels", icon: "boat", render: function (host) {
    if (!ready(host)) return;
    var V = C.draft.vessel;
    head(host, "Our vessels", "The flagship page. A second vessel is a Dheemi job for now — tell us when one arrives.");
    host.appendChild(E("div", { class: "card" }, [E("h3", { text: "Headline figures" }), field("Vessel name", V, "name", { required: true }),
      E("div", { class: "fg fg2" }, V.stats.map(function (s) { return E("div", { class: "fg fg--stat" }, [field(s.k || "Stat", s, "v", { required: true }), field("Unit", s, "u", { hint: "optional" })]); }))]));
    var spec = E("div", { class: "card" }), specRows = E("div", { class: "rows" });
    spec.appendChild(E("div", { class: "card__h" }, [E("h3", { text: "Specification" }), E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Add a line", onclick: function () { V.spec.push({ k: "", v: "" }); A.changed(); drawSpec(); } })]));
    var drawSpec = list(specRows, V.spec, { render: function (s, i, body) { body.appendChild(E("div", { class: "fg fg2" }, [field("Label", s, "k", { required: true }), field("Value", s, "v", { required: true })])); } });
    spec.appendChild(specRows); host.appendChild(spec);
    var decks = E("div", { class: "card" }), deckRows = E("div", { class: "rows" });
    decks.appendChild(E("div", { class: "card__h" }, [E("h3", { text: "Deck by deck" }), E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Add a deck", onclick: function () { var f = images()[0]; V.decks.push({ n: String(V.decks.length + 1).padStart(2, "0"), t: "", d: "", img: f ? f.name : "", alt: "" }); A.changed(); drawDecks(); } })]));
    var drawDecks = list(deckRows, V.decks, { render: function (d, i, body) {
      d.n = String(i + 1).padStart(2, "0");
      body.appendChild(E("div", { class: "fg fg2" }, [field("Name", d, "t", { required: true, max: 30 }), field("Describe the photograph", d, "alt", { max: 120, required: true })]));
      body.appendChild(field("One line", d, "d", { max: 120, required: true }));
      body.appendChild(imagePick("Photograph", d, "img"));
    } });
    decks.appendChild(deckRows); host.appendChild(decks);
    host.appendChild(E("div", { class: "card" }, [E("h3", { text: "Aboard" }), E("p", { class: "sub", text: "The list of what the vessel carries." }), chips(V.aboard, "e.g. Paddleboards — Enter to add")]));
  } });

  /* ---------------------------------------------------------------- Gallery */
  var CATS = [["vessel", "Our vessels"], ["aboard", "Aboard"], ["water", "Below"], ["islands", "Islands"]];
  var adding = false;
  A.register({ id: "gallery", group: "Website", label: "Gallery", icon: "grid", render: function (host) {
    if (!ready(host)) return;
    var G = C.draft.gallery;
    var used = function (n) { return G.some(function (g) { return g.img === n; }); };
    head(host, "Gallery", "Four sections, in this order. Captions are one line; the section decides where a photograph sits.",
      E("button", { class: "btn btn--go", type: "button", text: "Add a photograph", disabled: adding, onclick: function () { adding = true; A.render(); } }));
    if (adding) {
      var pick = { img: "", cat: "vessel" };
      var panel = E("div", { class: "card", style: "border-color:var(--marine)" }, [
        E("div", { class: "card__h" }, [E("div", {}, [E("h3", { text: "Add to the gallery" }), E("p", { text: "Choose a photograph not yet in the gallery, or upload a new one." })])]),
        imagePick("Photograph", pick, "img", { exclude: used }),
        E("div", { class: "fg fg2" }, [field("Section", pick, "cat", { type: "select", options: CATS })]),
        E("div", { class: "acts acts--end" }, [
          E("button", { class: "btn btn--ghost", type: "button", text: "Cancel", onclick: function () { adding = false; A.render(); } }),
          E("button", { class: "btn btn--go", type: "button", text: "Add to gallery", onclick: function () {
            if (!pick.img) return toast("Choose a photograph first.", "err");
            G.push({ img: pick.img, cat: pick.cat, cap: "" }); adding = false; A.changed(); A.render(); toast("Added — give it a caption.", "ok");
          } })
        ])
      ]);
      host.appendChild(panel);
    }
    CATS.forEach(function (c) {
      var set = G.filter(function (g) { return g.cat === c[0]; });
      var card = E("div", { class: "card" }), rows = E("div", { class: "rows" });
      card.appendChild(E("div", { class: "card__h" }, [E("h3", { text: c[1] + " · " + set.length })]));
      // moves act on the global list but within the section
      var draw = function () {
        rows.innerHTML = "";
        var idx = G.map(function (g, i) { return g.cat === c[0] ? i : -1; }).filter(function (i) { return i > -1; });
        if (!idx.length) rows.appendChild(E("p", { class: "small mute", text: "Nothing in this section." }));
        idx.forEach(function (gi, k) {
          var g = G[gi];
          var tools = E("div", { class: "row__tools" }, [
            iconBtn("up", "Move up", function () { if (k > 0) { var j = idx[k - 1]; G.splice(j, 0, G.splice(gi, 1)[0]); A.changed(); draw(); } }),
            iconBtn("down", "Move down", function () { if (k < idx.length - 1) { var j = idx[k + 1]; G.splice(j, 0, G.splice(gi, 1)[0]); A.changed(); draw(); } }),
            iconBtn("trash", "Remove from gallery", function () { G.splice(gi, 1); A.changed(); A.render(); })
          ]);
          var body = E("div", { class: "row__body row__body--thumb" }, [
            E("img", { class: "thumb thumb--lg", src: thumbSrc(g.img), alt: "" }),
            E("div", { class: "fg fg--cap" }, [field("Caption", g, "cap", { max: 60, required: true, hint: g.img }), field("Section", g, "cat", { type: "select", options: CATS, onchange: function () { A.render(); } })])
          ]);
          rows.appendChild(E("div", { class: "row" }, [body, tools]));
        });
      };
      draw(); card.appendChild(rows); host.appendChild(card);
    });
  } });

  /* ---------------------------------------------------------------- Music */
  A.register({ id: "music", group: "Website", label: "Music", icon: "music", render: function (host) {
    if (!ready(host)) return;
    var M = C.draft.music, tracks = (C.media && C.media.tracks) || [];
    head(host, "Music", "The floating player. Tracks are the audio files already on the site; a new file is a Dheemi job.");
    host.appendChild(E("div", { class: "card" }, [field("Line under the player", M, "line", { max: 50 })]));
    var card = E("div", { class: "card" }), rows = E("div", { class: "rows" });
    card.appendChild(E("div", { class: "card__h" }, [E("h3", { text: "Tracks" }), E("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Add a track", onclick: function () { M.tracks.push({ file: tracks[0] || "", title: "", by: "", lic: "", at: "" }); A.changed(); draw(); } })]));
    var draw = list(rows, M.tracks, { render: function (t, i, body) {
      body.appendChild(E("div", { class: "fg fg2" }, [field("Audio file", t, "file", { type: "select", options: tracks.map(function (f) { return [f, f]; }) }), field("Title", t, "title", { required: true })]));
      body.appendChild(E("div", { class: "fg fg3" }, [field("Artist", t, "by", { required: true }), field("Licence", t, "lic", { placeholder: "CC BY 4.0" }), field("Source link", t, "at", { type: "url" })]));
    } });
    card.appendChild(rows); host.appendChild(card);
  } });

  /* ---------------------------------------------------------------- FAQ */
  A.register({ id: "faq", group: "Website", label: "Questions", icon: "faq", render: function (host) {
    if (!ready(host)) return;
    var F = C.draft.faq, card = E("div", { class: "card" }), rows = E("div", { class: "rows" });
    head(host, "Questions", "The accordion on the contact page.", E("button", { class: "btn btn--go", type: "button", text: "Add a question", onclick: function () { F.push({ id: "q-" + A.uid().slice(-5), q: "", a: "" }); A.changed(); draw(); } }));
    var draw = list(rows, F, { render: function (f, i, body) { body.appendChild(field("Question", f, "q", { required: true, max: 80 })); body.appendChild(field("Answer", f, "a", { type: "textarea", required: true, max: 400 })); } });
    card.appendChild(rows); host.appendChild(card);
  } });

})(window.Admin);
