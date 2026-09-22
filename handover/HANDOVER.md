# Moving Coravida to the client's Vercel and Supabase

Everything the site needs is either in this repository or in the database, and nothing in
the code names an account any more: the Supabase address the browser uses is written at
build time from `SUPABASE_URL` / `SUPABASE_ANON_KEY`, and the canonical/sitemap host comes
from `SITE_URL`. So the move is: create their two projects, copy the data across, point the
build at them, then close the old ones.

Allow about an hour, plus DNS time if a domain is involved.

---

## 0. What to collect from the client first

| | |
|---|---|
| Vercel | The e-mail that owns their account, and which team the project should live in. Hobby is enough (100 GB bandwidth/month; this site ships ~1 GB of film, so a busy month is worth watching). |
| Supabase | The e-mail that owns their organisation. Free tier is enough. Region **ap-south-1 (Mumbai)** — nearest to Malé. |
| Staff sign-in | The e-mail the office will actually read (password resets go there). `test@coravida.com` is a placeholder and cannot receive mail. |
| Domain | The domain, and who controls its DNS. |
| GitHub | Whether the repository moves to their account or stays with Dheemi (see step 6). |

## 1. The new Supabase project

1. In the client's organisation: **New project** → name `coravida`, region **ap-south-1**,
   a strong database password (keep it — it is not recoverable).
2. Note **Project URL**, **publishable (anon) key** and **service_role key** from
   *Settings → API*, and the project **ref** (the subdomain).
3. Link the CLI and apply the schema and the data:

```bash
cd ~/coravida
supabase login                       # if not already
supabase link --project-ref <NEW_REF>

# 3a. export from the current project (writes handover/data, gitignored)
SUPABASE_URL=https://hkzseexkxufrqbngzqdk.supabase.co \
SUPABASE_SERVICE_KEY=<OLD_SERVICE_KEY> \
bash tools/export.sh handover/data

# 3b. schema + data into the new one
SUPABASE_URL=https://<NEW_REF>.supabase.co \
SUPABASE_SERVICE_KEY=<NEW_SERVICE_KEY> \
bash tools/import.sh handover/data
```

`tools/import.sh` applies `supabase/schema.sql` (tables, row-level security, grants, the
`keep_newer` and `inbox_budget` triggers, the realtime publication, the `uploads` bucket)
and then upserts `content`, `records`, `inbox` and any uploaded photographs. It is safe to
run twice.

4. Auth — edit `supabase/config.toml` so the two URL lines carry the client's address, then
   push it. This is what closes sign-ups and makes reset links land on their admin:

```toml
project_id = "coravida"
[auth]
site_url = "https://<THEIR-DOMAIN>/admin/"
additional_redirect_urls = ["https://<THEIR-DOMAIN>/admin/", "https://<THEIR-DOMAIN>/admin/index.html", "http://127.0.0.1:8899/admin/"]
enable_signup = false        # keep [auth.email] enable_signup = true — that flag is the e-mail *provider*
```

```bash
supabase config push
```

5. Create the office's user (sign-ups are closed, so make it with the service key):

```bash
curl -s -X POST "https://<NEW_REF>.supabase.co/auth/v1/admin/users" \
  -H "apikey: <NEW_SERVICE_KEY>" -H "Authorization: Bearer <NEW_SERVICE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"<OFFICE_EMAIL>","password":"<TEMPORARY>","email_confirm":true}'
```

Tell the office to change it at *Admin → Settings → Change password* on first sign-in.

## 2. The new Vercel project

1. Import `coravida` from GitHub into the client's team (or `vercel link` from the clone).
   Framework **Other**; the rest comes from `vercel.json` — build `node tools/vercel-build.js`,
   output `_site`.
2. Environment variables (*Settings → Environment Variables*, all environments):

| Key | Value |
|---|---|
| `SUPABASE_URL` | `https://<NEW_REF>.supabase.co` |
| `SUPABASE_ANON_KEY` | the new **publishable** key |
| `SITE_URL` | `https://<THEIR-DOMAIN>/` — with the trailing slash |
| `DEPLOY_HOOK` | created in step 3 |

3. *Settings → Git → Deploy Hooks* → create one named `admin-publish` on `main`, copy the
   URL into `DEPLOY_HOOK`, then redeploy. Until that variable exists, the admin's
   **Publish** saves the content but cannot rebuild the site (it will say so).
4. **Deploy**, then check the build log says
   `build: assets/js/env.js points at https://<NEW_REF>.supabase.co` and
   `build: content from the database`.

## 3. Domain

*Settings → Domains* → add the domain → follow Vercel's records with whoever runs the DNS
(an `A` to `76.76.21.21` for the apex, a `CNAME` to `cname.vercel-dns.com` for `www`).
When it resolves, set `SITE_URL` to it and redeploy so the canonical tags, `og:url` and
`sitemap.xml` match — then also update the two auth URLs in step 1.4.

## 4. Check it end to end

On the new address, signed out:

- the home page plays film and the hero cycles;
- **Enquire** → send a test enquiry;
- `/admin/` → sign in as the office user → the enquiry is in **New** on the board;
- drag it to **Contacted**, then delete it;
- block a day in the calendar → the public calendar shows it within a few seconds;
- change a word in Brand & contact → **Publish** → the build runs and the word appears.

`curl -s https://<THEIR-DOMAIN>/assets/js/env.js` must show the client's project — if it
still shows `hkzseexkxufrqbngzqdk`, the env vars are missing and the site is writing to
Dheemi's database.

## 5. Tell the office (they have been using the admin)

Their browsers hold a cache of the books and the enquiries from the old project. Before
they sign in to the new one, on each device: **Settings → Sign out** (which clears it), or
clear site data. Otherwise a stale cache can push old rows into the new database.

Also: enquiries sent between the export and the switch-over land in the *old* project.
Either do the export last, or after cut-over run `tools/export.sh` against the old project
once more and re-run `tools/import.sh` — the import upserts, so nothing is duplicated.

## 6. The repository

Two ways, both fine:

- **Transfer it** to the client's GitHub (*Settings → Transfer ownership*). Dheemi keeps
  push access as a collaborator; `git remote set-url` in the clone.
- **Leave it with Dheemi** and give their Vercel access to it through the GitHub app. The
  client then depends on Dheemi's repository for deploys — say so out loud.

Either way `tools/deploy.sh` still works; it also mirrors the built site into Dheemi's
OneDrive folder, which is harmless (and skipped if the folder is gone).

## 7. Close the old doors

Once the new address has been live for a few days:

- Vercel: delete the old `coravida` project in `muaaadhs-projects` (or pause it), and its
  deploy hook.
- Supabase: pause or delete project `hkzseexkxufrqbngzqdk`. Its publishable key stops
  working with it — nothing else uses it.
- Revoke the GitHub fine-grained token that was pasted into chat on 16 September 2026, if
  it still exists: github.com/settings/personal-access-tokens.
- Delete the agency's `.env.local` copy of the old service key, and `handover/data`
  (it contains customer names, e-mail addresses and telephone numbers).
- Keep, on purpose: a Dheemi seat on the client's Vercel team and Supabase organisation if
  Dheemi is to keep supporting the site. Without it, nobody at Dheemi can deploy.

## What is deliberately *not* transferred

`tools/film.sh`, `tools/enhance.sh`, `tools/images.sh` and `tools/stock.sh` read the raw
footage and photographs from Dheemi's OneDrive, and `tools/mirror.sh` writes back to it.
The client does not need them to run the site — every clip and photograph is already in
`assets/` — but they cannot re-cut media without those sources. Hand the sources over
separately if the client wants that ability.
