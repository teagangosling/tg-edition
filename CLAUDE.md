# tg-edition

A personal fork of [Edition](https://github.com/TryGhost/Edition), the Ghost newsletter
theme. Handlebars templates, PostCSS, vanilla ES5 JS, built with gulp.

## Build

```bash
npm install          # devDependencies only; package-lock.json is committed
npx gulp build       # assets/css + assets/js -> assets/built
npx gscan .          # Ghost's theme validator; must report zero errors
```

**Both the source and the built output are committed.** The server running Ghost has
no build tooling on it (node 18, no pnpm, no node_modules) and is served the contents
of `assets/built/` directly, so a change is not complete until it has been rebuilt and
the built files committed alongside the source.

### Build gotchas

- **Never hand-edit `assets/built/screen.css` or `assets/built/main.min.js`.** The next
  build silently reverts it. This has already happened once: byline CSS was appended
  raw to the built file rather than to the source it compiles from.
- **`gulp build` rewrites `locales/`** from whatever `@tryghost/theme-translations`
  resolves under its `^0.0.9` range, producing unrelated string churn. Run
  `git checkout -- locales/` after every build unless translations were the point.
- The gulp `js` task never regenerates `assets/built/main.min.js.map` — it passes
  `sourcemaps: true` on the source but no `sourcemaps` option to `dest`, unlike the
  `css` task. The committed JS sourcemap is therefore stale. Known, unfixed.

## Conventions

- **CSS**: one file per concern under `assets/css/{general,site,blog,misc}/`, imported
  from `assets/css/screen.css`. Add a new file rather than growing an existing one, and
  keep the import order there (it determines the cascade).
- **JS**: `assets/js/main.js` only. ES5 — `var`, function declarations, `'use strict';`
  inside each function. Entry points are called in the list at the top of the file, in
  execution order. No build-time module system, no framework.
- **Comments explain why, not what.** Prefer one comment explaining a non-obvious
  constraint over a running narration of the code.
- Ghost caches templates, so `.hbs` edits need a Ghost restart to take effect; CSS/JS
  changes need one too, so the `{{asset}}` `?v=` hash is re-stamped.

## Layout constraints worth knowing

`.gh-content.gh-canvas` is a **CSS grid** — every paragraph and every `figure.kg-card`
is its own grid item (see `.gh-canvas > * { grid-column: main; }` in
`@tryghost/shared-theme-assets`). Consequences:

- A `float` on a figure will **not** wrap the following paragraphs around it, because
  they are separate grid items and a float cannot escape the item it is in. Wrapping
  text around an image requires JS to group the figure and its text blocks into one
  wrapper element that becomes a single grid item (`display: flow-root` contains the
  float). This is what `floatedImages()` does.
- `kg-width-wide` / `kg-width-full` work by naming a wider grid column, not by width.

Ghost's shared lightbox (`lightbox()` in the shared theme assets) walks
`previousElementSibling`/`nextElementSibling` from the clicked `.kg-card` **at click
time** to gather adjacent image cards into one gallery. Any DOM restructuring of
`.gh-content` changes which images group together.

Handlebars cannot list a directory. Anything that needs to enumerate files (e.g. a pool
of images) needs a manifest or a Ghost query — a template cannot discover them.

## Custom features

Everything below is this fork's, not upstream Edition's:

- Custom post byline — avatar, author name, labelled date rows — replacing Edition's
  stock author block. The author half is gated on `{{#if @custom.show_author}}`.
- Custom feature-image layouts: `custom-full-feature-image`, `custom-narrow-feature-image`,
  `custom-no-feature-image`.
- Standalone full-screen `error-404.hbs` that deliberately does not extend `default.hbs`.
- `expandableImages()` — click-to-expand on every image, not just galleries. The shared
  theme assets only wire up `.kg-gallery-image > img` and
  `.kg-image-card > .kg-image[width][height]`.
- Image height cap (`max-height: 100rem`) with `width: auto` so the ratio is preserved.
- The `gh-meta-share`/`gh-button-share` block removed from `partials/content.hbs`.

## License

MIT, inherited from upstream. The repo is **public** and is a fork, so the Ghost
Foundation copyright notice must stay in `LICENSE` — add to it, never replace it. Keep
`package.json`'s `author.email` a noreply address rather than a personal one.
