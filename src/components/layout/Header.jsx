import flagIndonesia from '../../assets/images/flag-id.svg';
import flagEnglish from '../../assets/images/flag-gb.svg';
import { MoonIcon, SunIcon } from '../ui/index.js';

const flags = {
  id: flagIndonesia,
  en: flagEnglish,
};

export default function Header({ language, theme, content, isMenuOpen, onMenuToggle, onLanguageToggle, onThemeToggle }) {
  return (
    <header>
      <nav id="navbar" className="navbar navbar-light navbar-expand-sm fixed-top">
        <div className="container">
          <button
            className={`navbar-toggler ml-auto ${isMenuOpen ? '' : 'collapsed'}`}
            type="button"
            aria-controls="navbarNav"
            aria-expanded={isMenuOpen}
            aria-label={content.menuLabel}
            onClick={() => onMenuToggle(!isMenuOpen)}
          >
            <span className="sr-only">{content.menuLabel}</span>
            <span className="icon-bar top-bar" />
            <span className="icon-bar middle-bar" />
            <span className="icon-bar bottom-bar" />
          </button>

          <div className={`collapse navbar-collapse text-right ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav ml-auto flex-nowrap">
              <li className="nav-item active">
                <a className="nav-link" href="#about" onClick={() => onMenuToggle(false)}>
                  {content.navigation}
                  <span className="sr-only"> (current)</span>
                </a>
              </li>
              <li className="nav-item">
                <button
                  className="language-toggle nav-link"
                  type="button"
                  aria-label={content.languageLabel}
                  title={content.languageLabel}
                  onClick={onLanguageToggle}
                >
                  <span>{language.toUpperCase()}</span>
                  <img src={flags[language]} alt={content.flagAlt} width="20" height="14" />
                </button>
              </li>
              <li className="toggle-container">
                <button
                  id="light-toggle"
                  type="button"
                  title={content.themeLabel}
                  aria-label={content.themeLabel}
                  aria-pressed={theme === 'dark'}
                  onClick={onThemeToggle}
                >
                  <MoonIcon className="theme-toggle-icon fa-moon" />
                  <SunIcon className="theme-toggle-icon fa-sun" />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
