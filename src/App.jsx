import { useEffect, useState } from 'react';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import ProfileCard from './components/profile/ProfileCard.jsx';
import SocialLinks from './components/profile/SocialLinks.jsx';
import { portfolioContent } from './data/portfolio.jsx';

const LANGUAGE_KEY = 'portfolio-language';
const THEME_KEY = 'theme';

function getInitialLanguage() {
  try {
    const language = localStorage.getItem(LANGUAGE_KEY);
    return language === 'en' || language === 'id' ? language : 'id';
  } catch {
    return 'id';
  }
}

function getInitialTheme() {
  try {
    const theme = localStorage.getItem(THEME_KEY);
    if (theme === 'dark' || theme === 'light') return theme;
  } catch {
    // Fall through to the operating-system preference.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [theme, setTheme] = useState(getInitialTheme);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const content = portfolioContent[language];

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : '';
    if (theme === 'light') document.documentElement.removeAttribute('data-theme');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function toggleLanguage() {
    setLanguage((currentLanguage) => (currentLanguage === 'id' ? 'en' : 'id'));
  }

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }

  return (
    <div className="app-shell">
      <Header
        language={language}
        content={content}
        isMenuOpen={isMenuOpen}
        onMenuToggle={setIsMenuOpen}
        onLanguageToggle={toggleLanguage}
        onThemeToggle={toggleTheme}
      />

      <main className="page-shell main-content" id="about">
        <article className="about">
          <header className="about-header">
            <h1>Bintang Toba</h1>
          </header>

          <ProfileCard imageAlt={content.imageAlt} address={content.address} />

          <section className="about-copy" aria-label={content.navigation}>
            {content.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </section>

          <SocialLinks note={content.contactNote} />
        </article>
      </main>

      <Footer text={content.footer} />
    </div>
  );
}
