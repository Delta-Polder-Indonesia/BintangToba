export default function Footer({ text }) {
  return (
    <footer className="site-footer fixed-bottom">
      <div className="container mt-0">
        © Copyright {new Date().getFullYear()} Bintang Toba. {text}{' '}
        <a href="https://pages.github.com/" target="_blank" rel="noreferrer">GitHub Pages</a>.
      </div>
    </footer>
  );
}
