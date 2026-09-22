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
| Vercel | The e-mail that owns their account, and which team the project should live in. **Pro, not Hobby** — Hobby is licensed for non-commercial use only, and a team seat for Dheemi needs Pro too. Watch the bandwidth: this site ships ~1 GB of film. |
| Supabase | The e-mail that owns their organisation. Free tier is enough. Region **ap-south-1 (Mumbai)** — nearest to Malé. |
| Staff sign-in | The e-mail the office will actually read (password resets go there). `test@coravida.com` is a placeholder and cannot receive mail. |
| Domain | The domain, and who controls its DNS. |
| GitHub | Whether the repository moves to their account or stays with Dheemi (see step 6). |

## 1. The new Supabase project

1. In the client's organisation: **New project** → name `coravida`, region **ap-south-1**,
   a strong database password (keep it — it is not recoverable).
2. **Close sign-ups before anything else.** A new project accepts public sign-ups, and
   every policy in this schema trusts *any* signed-in user with the books. In the dashboard:
   *Authentication → Sign In / Providers → Email* → turn **Allow new users to sign up** off.
   (Step 4 sets it in `config.toml` as well; doing it by hand first closes the window.)
3. Note **Project URL**, **publishable (anon) key** and **service_role key** from
   *Settings → API*, and the project **ref** (the subdomain).
4. Link the CLI and apply the schema and the data. **Export immediately before you
   switch over** — the snapshot is a moment in time, and the office is using the admin.

```bash
cd ~/coravida
supabase login                                    # if not already
supabase link --project-ref <NEW_REF>             # import.sh refuses if this does not match

# 3a. out of the old project (writes handover/data — gitignored, never mirrored)
SUPABASE_URL=https://hkzseexkxufrqbngzqdk.supabase.co \
SUPABASE_SERVICE_KEY=<OLD_SERVICE_KEY> \
bash tools/export.sh handover/data

# 3b. schema + every row into the new one
SUPABASE_URL=https://<NEW_REF>.supabase.co \
SUPABASE_SERVICE_KEY=<NEW_SERVICE_KEY> \
bash tools/import.sh handover/data first
```

`first` applies `supabase/schema.sql` — tables, row-level security, grants (including the
column-level `anon` insert on `inbox`), the `keep_newer` and `inbox_budget` triggers, the
realtime publication and the `uploads` bucket — and ends by raising an error if any of
those is missing. Then it loads `content`, `records`, `inbox` and any uploaded photographs
with their exact timestamps, and prints the row counts it can see afterwards.

**For anything that arrives after that**, run the pair again with `gap` as the mode:

```bash
SUPABASE_URL=https://hkzseexkxufrqbngzqdk.supabase.co SUPABASE_SERVICE_KEY=<OLD> bash tools/export.sh handover/gap
SUPABASE_URL=https://<NEW_REF>.supabase.co          SUPABASE_SERVICE_KEY=<NEW> bash tools/import.sh handover/gap gap
```

`gap` inserts only what is not there yet. Never re-run `first` against a project the office
has started using: it would put the content, the books and the enquiry board back to the
state of the snapshot.

5. Auth — edit `supabase/config.toml` so the two URL lines carry the client's address, then
   push it. This is what closes sign-ups and makes reset links land on their admin:

```toml
project_id = "coravida"
[auth]
site_url = "https://<THEIR-DOMAIN>/admin/"
additional_redirect_urls = ["https://<THEIR-DOMAIN>/admin/", "https://<THEIR-DOMAIN>/admin", "https://<THEIR-DOMAIN>/admin/index.html", "http://127.0.0.1:8899/admin/"]
enable_signup = false        # keep [auth.email] enable_signup = true — that flag is the e-mail *provider*
```

`supabase config push` sends the whole file, not those lines, so read it once for anything
that does not belong to the client's project or their plan; if the push is rejected, set the
same two URLs by hand in *Authentication → URL Configuration*. Password-reset e-mail goes
through Supabase's shared sender and is rate-limited (a couple an hour) — fine for the
office, not for anything bulk; add their own SMTP later if that matters.

```bash
supabase config push
```

6. Create the office's user (sign-ups are closed, so make it with the service key):

```bash
curl -s -X POST "https://<NEW_REF>.supabase.co/auth/v1/admin/users" \
  -H "apikey: <NEW_SERVICE_KEY>" -H "Authorization: Bearer <NEW_SERVICE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"<OFFICE_EMAIL>","password":"<TEMPORARY>","email_confirm":true}'
```

Tell the office to change it at *Admin → Settings → Change password* on first sign-in.
Send it out of band; do not leave it in a shell history or a chat.

## 2. The new Vercel project

1. Import `coravida` from GitHub into the client's team (or `vercel link` from the clone).
   Framework **Other**; the rest comes from `vercel.json` — build `node tools/vercel-build.js`,
   output `_site`. Set **Node 22.x** in *Settings → Build*, so a future default cannot move
   under the build.
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
   `build: content from the database`. The build now refuses to run if only one of the two
   Supabase variables is set, or if the publishable key is really a service key — so a green
   build with those two lines means the wiring is right.
5. **Disconnect the old project from Git** (*old project → Settings → Git → Disconnect*) as
   soon as this one is verified. Both projects watch the same repository, so until then every
   push republishes the old site too — and the old site still takes enquiries into the old
   database.

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

Three checks that are easy to forget:

```bash
# 1. the browser is pointed at THEIR database (not Dheemi's)
curl -s https://<THEIR-DOMAIN>/assets/js/env.js | grep -o 'https://[a-z0-9]*\.supabase\.co'

# 2. the books and the enquiries actually landed
supabase db query --linked "select 'content' t, count(*) from public.content union all select 'records', count(*) from public.records union all select 'inbox', count(*) from public.inbox"

# 3. the admin will hear about changes made on another device
supabase db query --linked "select tablename from pg_publication_tables where pubname='supabase_realtime'"
```

If step 1 still shows `hkzseexkxufrqbngzqdk`, the environment variables are missing and the
new site is reading and writing Dheemi's database.

## 5. Tell the office (they have been using the admin)

Their browsers hold a cache of the books and the enquiries from the old project, and an
unpublished content draft lives there too. On each device, in this order:

1. **Publish** anything half-edited in the admin (or note that it will be lost — signing
   out clears the draft as well as the cache);
2. **Settings → Sign out**, which clears `cv:*` from that browser;
3. sign in again on the new address.

If a device skips this, its cache can push rows the old project held — including ones the
office has since changed — into the new database on the next save.

Enquiries sent between the export and the switch-over land in the *old* project: catch them
with the `gap` pass in step 1.3.

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
  deploy hook. Its `*.vercel.app` address is indexed, so if the client cares about search,
  redirect it at the new domain rather than deleting it outright.
- Supabase: in the old project, *Authentication → Users* → sign out all users, then rotate
  or disable its API keys, then pause or delete the project. Until you do, an admin tab left
  open on a laptop keeps reading and writing the old database quite happily.
- Revoke the GitHub fine-grained token that was pasted into chat on 16 September 2026, if
  it still exists: github.com/settings/personal-access-tokens.
- Point the agency's own `.env.local` at the client's project (`SUPABASE_URL`,
  `SUPABASE_SERVICE_KEY`) — otherwise `tools/deploy.sh` keeps pushing content into the old
  database and the developer will wonder why nothing changes. Then delete the old key.
- Delete `handover/data` and `handover/gap`: they contain customer names, e-mail addresses
  and telephone numbers. They are gitignored and the mirror excludes them, but they are
  still sitting on the machine.
- Keep, on purpose: a Dheemi seat on the client's Vercel team and Supabase organisation if
  Dheemi is to keep supporting the site. Without it, nobody at Dheemi can deploy.

## What is deliberately *not* transferred

`tools/film.sh`, `tools/enhance.sh`, `tools/images.sh` and `tools/stock.sh` read the raw
footage and photographs from Dheemi's OneDrive, and `tools/mirror.sh` writes back to it.
The client does not need them to run the site — every clip and photograph is already in
`assets/` — but they cannot re-cut media without those sources. Hand the sources over
separately if the client wants that ability.
