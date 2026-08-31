# Bintang Toba — personal landing page

Static HTML/CSS/JS portfolio page, hosted on GitHub Pages at
<https://delta-polder-indonesia.github.io/BintangToba/>.

## Run locally

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## Stack

- **Bootstrap 4.6** CSS (only the stylesheet — no Bootstrap/jQuery JavaScript)
- **Roboto** via Google Fonts (`display=swap`, preconnected)
- Handful of inline SVG icons (no icon-font download)
- Two small vanilla-JS blocks: an inline head script that applies the saved
  dark/light theme before first paint (no flash), and a footer script handling
  the theme toggle, mobile navigation, and ID/EN language switch.

## Performance notes

The page ships no heavy libraries (no jQuery, MDB, MathJax, Masonry,
Font Awesome or polyfills). The profile photo is served as WebP with a JPEG
fallback, and all scripts/styles are either inlined or deferred out of the
render-blocking path.
