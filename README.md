# tg-edition

The Ghost theme running on teagangosling.com.

This is a fork of **[Edition](https://github.com/TryGhost/Edition)**, the newsletter
theme by the Ghost Foundation, with a handful of personal changes on top:

- Custom post byline (avatar, author, labelled date rows) and an italic excerpt
- Custom feature-image layouts (`custom-full-feature-image`, `custom-narrow-feature-image`, `custom-no-feature-image`)
- A height cap on content images, with click-to-expand on every image rather than
  just gallery images
- A random publication cover on the homepage, drawn from a folder of images

# Random publication cover

The homepage cover is normally the single image set in **Ghost Admin -> Settings ->
Publication cover**. On top of that, the theme can pick a random image from a pool
on each page load.

The pool is a folder on the server, `ghost-content/images/covers/`, which Ghost
already serves publicly at `https://teagangosling.com/content/images/covers/`.
A Handlebars theme cannot list a directory - there is no helper for it and Ghost
exposes no endpoint that enumerates the images folder - so the folder listing is
written out as a small JSON manifest, `covers.json`, that the theme fetches.

The Admin cover stays the rendered default. If JavaScript is off, or the manifest
is missing, empty or unreachable, the homepage shows the Admin cover exactly as it
does today. Nothing breaks if the folder is never created.

## One-time setup on the server

```bash
mkdir -p /opt/ghost/ghost-content/images/covers
```

The folder must be readable by the Ghost container and writable by whoever adds
images. Copy `scripts/build-cover-manifest.sh` somewhere on the server, e.g.
`~/bin/build-cover-manifest.sh`, and `chmod +x` it.

## Adding an image

1. Copy the image into `/opt/ghost/ghost-content/images/covers/`.
2. Run the manifest script:

   ```bash
   ~/bin/build-cover-manifest.sh
   ```

3. Reload the homepage.

Removing an image is the same: delete the file, re-run the script.

`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` and `.avif` are picked up. Anything else
in the folder - the manifest itself, notes, `.DS_Store`, subfolders - is ignored.
Spaces in filenames are fine.

**Do not put `_o.` in a cover filename.** A nightly prune job on the server deletes
any file under the images directory whose name contains a literal `_o.` before the
extension, so `sunset_o.jpg` would disappear overnight. The script refuses such
names with a warning rather than listing them.

## Regenerating the manifest automatically

Optional. To have the manifest track the folder without running anything by hand,
add a crontab entry on the server (`crontab -e`) - **this is not installed by this
repo, add it yourself if you want it**:

```cron
*/15 * * * * ~/bin/build-cover-manifest.sh >/dev/null 2>&1
```

## How it works

- `scripts/build-cover-manifest.sh` writes `covers.json` into the covers folder.
  It is idempotent and writes atomically, so it is safe to re-run at any time and
  safe to run from cron while the site is being served.
- `coverPool()` in `assets/js/main.js` fetches that manifest, picks one entry at
  random, preloads it, and only then swaps the `src` of `.cover-image`.
- While it is choosing, `.cover` carries `cover-pool-pending`
  (`assets/css/site/cover-pool.css`), which holds the same dark overlay the cover
  already shows while loading. That is what stops the default cover from being
  painted and then visibly replaced. The class is always removed - on success, on
  failure, and after a 1.5s timeout - so a bad manifest cannot leave the homepage
  dark.
- The manifest is fetched with `cache: 'no-store'` and a per-minute cache-busting
  query string, because Ghost sends a one-year `Cache-Control` on everything under
  `/content/images/` and newly added covers would otherwise not show up.

Only the homepage cover uses the pool. Per-page and per-post feature images are
untouched.

# Development

Styles are compiled using Gulp/PostCSS to polyfill future CSS spec. You'll need
[Node](https://nodejs.org/). From the theme's root directory:

```bash
# Install
npm install

# Build assets/css + assets/js into assets/built
npx gulp build

# Or build and watch for changes
npx gulp
```

Now you can edit `/assets/css/` and `/assets/js/` files, which are compiled to
`/assets/built/`.

**Both the source and the built output are committed**, because the server running
Ghost has no build tooling on it and is served the contents of `assets/built`
directly. Never hand-edit `assets/built/screen.css` - change the source and rebuild,
or the next build silently reverts the edit.

The `zip` Gulp task packages the theme files into `dist/tg-edition.zip`, which you
can then upload through Ghost's `Design` settings.

```bash
npx gulp zip
```

## Theme translations

See the @TryGhost/Themes/theme-translations/README.md for how to edit translations.
Note that `gulp build` regenerates `locales/` from the installed
`@tryghost/theme-translations`, which can pull in unrelated string changes - check
`git diff locales/` before committing a build.

# Upstream

Upstream development happens in the [TryGhost/Themes](https://github.com/TryGhost/Themes)
monorepo, which syncs to [TryGhost/Edition](https://github.com/TryGhost/Edition).
Issues with the theme itself belong there, not here.

# Copyright & License

Copyright (c) 2013-2026 Ghost Foundation - original Edition theme.

Copyright (c) 2026 Teagan Gosling - modifications.

Released under the [MIT license](LICENSE), the same license as the upstream theme.
