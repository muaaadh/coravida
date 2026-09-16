/* ==========================================================================
   CORAVIDA — the data client.
   One Supabase project holds the books, the inbox and the website's content.
   Staff sign in with email and password; the website reads with the public
   key. Everything the other admin files need from the database goes through
   here, so the rest never sees a URL or a key.
   ========================================================================== */
window.DB = (function () {
  "use strict";
  var ENV = window.CV_ENV || {};
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY || !window.supabase) {
    return { ready: false, reason: !window.supabase ? "The Supabase library did not load." : "The database address is missing (assets/js/env.js)." };
  }
  var sb = window.supabase.createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  var user = null, listeners = [];
  sb.auth.onAuthStateChange(function (ev, session) { user = session ? session.user : null; listeners.forEach(function (f) { f(user, ev); }); });

  function fail(r) { if (r.error) throw new Error(r.error.message || String(r.error)); return r; }

  /* ---- who -------------------------------------------------------------- */
  var auth = {
    session: function () { return sb.auth.getSession().then(function (r) { user = r.data.session ? r.data.session.user : null; return r.data.session; }); },
    user: function () { return user; },
    signIn: function (email, password) { return sb.auth.signInWithPassword({ email: email, password: password }).then(fail).then(function (r) { user = r.data.user; return user; }); },
    signOut: function () {
      return sb.auth.signOut().then(function () {   // the books, the inbox and the draft stay behind on a shared machine otherwise
        try { Object.keys(localStorage).forEach(function (k) { if (/^cv:/.test(k) && k !== "cv:device") localStorage.removeItem(k); }); } catch (e) { /* blocked — nothing to clear */ }
      });
    },
    reset: function (email) { return sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }).then(fail); },
    setPassword: function (password) { return sb.auth.updateUser({ password: password }).then(fail); },
    onChange: function (f) { listeners.push(f); },
    token: function () { return sb.auth.getSession().then(function (r) { return r.data.session ? r.data.session.access_token : ""; }); }
  };

  /* ---- content: site.json and the calendar's public face ----------------- */
  var content = {
    get: function (key) { return sb.from("content").select("data, updated").eq("key", key).maybeSingle().then(fail).then(function (r) { return r.data; }); },
    set: function (key, data) { return sb.from("content").upsert({ key: key, data: data, updated: new Date().toISOString() }, { onConflict: "key" }).then(fail); }
  };

  /* ---- records: the books, one row per record ----------------------------- */
  var records = {
    all: function () {
      var out = [], from = 0, PAGE = 1000;
      function page() {
        return sb.from("records").select("id, kind, updated, deleted, data").order("updated", { ascending: true }).order("id", { ascending: true }).range(from, from + PAGE - 1).then(fail).then(function (r) {
          out = out.concat(r.data); if (r.data.length === PAGE) { from += PAGE; return page(); } return out;
        });
      }
      return page();
    },
    since: function (iso) { return sb.from("records").select("id, kind, updated, deleted, data").gt("updated", iso).then(fail).then(function (r) { return r.data; }); },
    upsert: function (rows) {
      if (!rows.length) return Promise.resolve();
      var chunks = []; for (var i = 0; i < rows.length; i += 200) chunks.push(rows.slice(i, i + 200));
      return chunks.reduce(function (p, c) { return p.then(function () { return sb.from("records").upsert(c, { onConflict: "id" }).then(fail); }); }, Promise.resolve());
    },
    watch: function (onRow, onStatus) {
      var ch = sb.channel("records-live").on("postgres_changes", { event: "*", schema: "public", table: "records" }, function (p) { if (p.new && p.new.id) onRow(p.new); }).subscribe(function (status) { if (onStatus) onStatus(status); });
      return function () { sb.removeChannel(ch); };
    }
  };

  /* ---- inbox ----------------------------------------------------------------- */
  var inbox = {
    list: function () { return sb.from("inbox").select("*").order("at", { ascending: false }).limit(500).then(fail).then(function (r) { return r.data.map(row); }); },
    update: function (id, patch) {
      var u = { handled_at: new Date().toISOString() }; if (patch.status) u.status = patch.status; if (patch.bookingRef) u.booking_ref = patch.bookingRef; if (patch.by) u.handled_by = patch.by;
      return sb.from("inbox").update(u).eq("id", id).select().single().then(fail).then(function (r) { return row(r.data); });
    },
    remove: function (id) { return sb.from("inbox").delete().eq("id", id).then(fail); },
    watch: function (onChange) { var ch = sb.channel("inbox-live").on("postgres_changes", { event: "*", schema: "public", table: "inbox" }, function () { onChange(); }).subscribe(); return function () { sb.removeChannel(ch); }; }
  };
  function row(r) { var e = Object.assign({}, r.data || {}); e.id = r.id; e.at = r.at; e.kind = r.kind; e.status = r.status; e.bookingRef = r.booking_ref || e.bookingRef; e.handledAt = r.handled_at; e.handledBy = r.handled_by; return e; }

  /* ---- photographs the admin uploads ------------------------------------------- */
  var storage = {
    upload: function (name, blob) { return sb.storage.from("uploads").upload(name + ".jpg", blob, { contentType: "image/jpeg", upsert: true }).then(fail); },
    list: function () { return sb.storage.from("uploads").list("", { limit: 1000 }).then(fail).then(function (r) { return r.data; }); },
    url: function (name) { return sb.storage.from("uploads").getPublicUrl(name + ".jpg").data.publicUrl; }
  };

  return { ready: true, client: sb, auth: auth, content: content, records: records, inbox: inbox, storage: storage, url: ENV.SUPABASE_URL };
})();
