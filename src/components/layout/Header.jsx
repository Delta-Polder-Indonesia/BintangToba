import flagIndonesia from '../../assets/images/flag-id.svg';
import flagEnglish from '../../assets/images/flag-gb.svg';
import { MenuIcon, MoonIcon, SunIcon } from '../ui/Icons.jsx';

const flags = {
  id: flagIndonesia,
  en: flagEnglish,
};

export default function Header({ language, content, isMenuOpen, onMenuToggle, onLanguageToggle, onThemeToggle }) {
  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <div className="page-shell navbar-content">
          <button
            className={`menu-toggle ${isMenuOpen ? 'is-open' : ''}`}
            type="button"
            aria-controls="primary-navigation"
            aria-expanded={isMenuOpen}
            aria-label={content.menuLabel}
            onClick={() => onMenuToggle(!isMenuOpen)}
          >
            <span className="visually-hidden">{content.menuLabel}</span>
            <MenuIcon />
          </button>

          <div className={`navigation-panel ${isMenuOpen ? 'is-open' : ''}`} id="primary-navigation">
            <a className="navigation-link is-active" href="#about" onClick={() => onMenuToggle(false)}>
              {content.navigation}
              <span className="visually-hidden"> (current)</span>
            </a>
            <button className="language-toggle" type="button" aria-label={content.languageLabel} onClick={onLanguageToggle}>
              <span>{language.toUpperCase()}</span>
              <img src={flags[language]} alt={content.flagAlt} width="20" height="14" />
            </button>
            <button className="theme-toggle" type="button" aria-label={content.themeLabel} title={content.themeLabel} onClick={onThemeToggle}>
              <MoonIcon />
              <SunIcon />
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
