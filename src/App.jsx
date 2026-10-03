import { useEffect, useState } from 'react';
import { AiSlopPage, CollectionPage, Footer, Header, ProfileCard, SocialLinks } from './components/index.js';
import { portfolioContent } from './data/index.js';

const LANGUAGE_KEY = 'portfolio-language';
const THEME_KEY = 'theme';
const THEME_TRANSITION_CLASS = 'transition';
const THEME_TRANSITION_DURATION = 500;
const PAGES = ['about', 'collection', 'ai-slop'];

function getPageFromHash() {
  const hash = window.location.hash.replace('#', '');
  return PAGES.includes(hash) ? hash : null;
}

function getInitialPage() {
  return getPageFromHash() ?? 'about';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#1c1c1d' : '#ffffff');
  localStorage.setItem(THEME_KEY, theme);
}

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
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const content = portfolioContent[language];

  useEffect(() => {
    function handleHashChange() {
      const nextPage = getPageFromHash();
      if (!nextPage) return;
      setCurrentPage(nextPage);
      window.scrollTo(0, 0);
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    document.body.classList.toggle('page-collection', currentPage === 'collection');

    return () => {
      document.body.classList.remove('page-collection');
    };
  }, [currentPage]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function transTheme() {
    document.documentElement.classList.add(THEME_TRANSITION_CLASS);
    window.setTimeout(() => {
      document.documentElement.classList.remove(THEME_TRANSITION_CLASS);
    }, THEME_TRANSITION_DURATION);
  }

  function toggleLanguage() {
    setLanguage((currentLanguage) => (currentLanguage === 'id' ? 'en' : 'id'));
  }

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    transTheme();
    applyTheme(nextTheme);
    setTheme(nextTheme);
  }

  return (
    <div className="app-shell">
      <Header
        language={language}
        theme={theme}
        content={content}
        currentPage={currentPage}
        isMenuOpen={isMenuOpen}
        onMenuToggle={setIsMenuOpen}
        onLanguageToggle={toggleLanguage}
        onThemeToggle={toggleTheme}
      />

      {currentPage === 'about' && (
        <main className="container mt-5" id="about">
          <div className="post">
            <header className="post-header">
              <h1 className="post-title">Bintang Toba</h1>
              <p className="desc">{content.subtitle}</p>
            </header>

            <article>
              <ProfileCard imageAlt={content.imageAlt} address={content.address} />

              <div className="clearfix about-copy" aria-label={content.navigation}>
                {content.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>

              <SocialLinks note={content.contactNote} />
            </article>
          </div>
        </main>
      )}

      {currentPage === 'collection' && (
        <main className="collection-page-shell" id="collection">
          <CollectionPage />
        </main>
      )}

      {currentPage === 'ai-slop' && (
        <main className="ai-slop-page-shell" id="ai-slop">
          <AiSlopPage language={language} />
        </main>
      )}

      <Footer text={content.footer} />
    </div>
  );
}
