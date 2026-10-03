export default function Footer({ text }) {
  return (
    <footer className="site-footer">
      <div className="page-shell">
        © Copyright {new Date().getFullYear()} Bintang Toba · {text}{' '}
        <a href="https://pages.github.com/" target="_blank" rel="noreferrer">GitHub Pages</a>.
      </div>
    </footer>
  );
}
