# tg-edition

The Ghost theme running on teagangosling.com.

This is a fork of **[Edition](https://github.com/TryGhost/Edition)**, the newsletter
theme by the Ghost Foundation, with a handful of personal changes on top:

- Custom post byline (avatar, author, labelled date rows) and an italic excerpt
- Custom feature-image layouts (`custom-full-feature-image`, `custom-narrow-feature-image`, `custom-no-feature-image`)
- A height cap on content images, with click-to-expand on every image rather than
  just gallery images

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
