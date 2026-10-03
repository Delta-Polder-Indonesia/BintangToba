# Bintang Toba — React portfolio

A small bilingual personal portfolio built with **React** and **Vite**. The original static page has been split into focused JSX components, while keeping the language switcher, theme preference, responsive navigation, profile picture, and social links.

## Project structure

```text
src/
├── assets/images/          # Images and flags imported by React
├── components/
│   ├── layout/             # Header and footer
│   ├── profile/            # Profile card and social links
│   └── ui/                 # Reusable SVG icons
├── data/portfolio.jsx      # Indonesian and English portfolio copy
├── styles/global.css       # Theme tokens and responsive styling
├── App.jsx                 # Page composition and app state
└── main.jsx                # React entry point
public/                     # Files copied directly to the build (favicon, robots.txt)
```

## Run locally

```bash
npm install
npm run dev
```

Vite prints the local preview URL. The dev server is configured to listen on all interfaces, so it also works in remote preview environments.

## Production build

```bash
npm run build
npm run preview
```

The production files are generated in `dist/`. Vite uses relative asset paths (`base: './'`), making the output suitable for this repository's GitHub Pages path as well as a root-domain deployment.

## Notes

- The selected language (`portfolio-language`) and theme (`theme`) are saved in `localStorage`.
- A tiny script in `index.html` applies the saved theme before React loads, preventing a light-theme flash for returning dark-theme visitors.
- No Bootstrap or JavaScript UI library is needed; the responsive layout is maintained by the project CSS.
