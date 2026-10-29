import { memo, useEffect, useRef } from 'react';
import '../../styles/collection.css';


function cssStyle(value) {
  return Object.fromEntries(
    value
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf(':');
        const property = part.slice(0, separator).trim();
        const rawValue = part.slice(separator + 1).trim();
        const reactProperty = property.startsWith('--')
          ? property
          : property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        return [reactProperty, rawValue];
      }),
  );
}


function setupCollectionInteractions(root) {
  const header = root.querySelector('.site-header');
  const nav = root.querySelector('#site-nav');
  const navToggle = root.querySelector('.nav-toggle');
  const revealTargets = root.querySelectorAll('[data-reveal]');
  const navLinks = root.querySelectorAll('.site-nav a');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const setHeaderState = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 12);
  };

  const closeNav = () => {
    navToggle?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('is-open');
  };

  const onToggleClick = () => {
    if (!navToggle) return;
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    nav?.classList.toggle('is-open', !isOpen);
  };

  const onNavClick = (event) => {
    if (event.target instanceof HTMLAnchorElement) closeNav();
  };

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
  );

  revealTargets.forEach((target) => {
    const section = target.closest('section');
    const localTargets = section
      ? Array.from(section.querySelectorAll('[data-reveal]'))
      : Array.from(revealTargets);
    const localIndex = Math.max(localTargets.indexOf(target), 0);
    const delay = Math.min(localIndex, 4) * 110;

    target.style.setProperty('--reveal-delay', `${delay}ms`);
    revealObserver.observe(target);
  });

  const revealFallback = window.setTimeout(() => {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  }, 1600);

  const sections = Array.from(root.querySelectorAll('main section[id]'));
  let activeNavFrame = 0;

  const setActiveNavLink = (sectionId) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${sectionId}`;
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  const getCurrentSectionId = () => {
    const anchorY = (header?.offsetHeight ?? 0) + Math.min(window.innerHeight * 0.32, 260);
    let currentSection = sections[0];

    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= anchorY && rect.bottom > anchorY) return section.id;
      if (rect.top <= anchorY) currentSection = section;
    }

    return currentSection?.id;
  };

  const updateActiveNav = () => {
    activeNavFrame = 0;
    const currentSectionId = getCurrentSectionId();
    if (currentSectionId) setActiveNavLink(currentSectionId);
  };

  const requestActiveNavUpdate = () => {
    if (activeNavFrame) return;
    activeNavFrame = window.requestAnimationFrame(updateActiveNav);
  };

  const speakerCarousel = root.querySelector('.speaker-carousel');
  let speakerTimer = null;
  let activeSpeakerIndex = 0;

  const stopSpeakerTimer = () => {
    if (!speakerTimer) return;
    window.clearInterval(speakerTimer);
    speakerTimer = null;
  };

  let setSpeakerSlide = () => {};

  if (speakerCarousel) {
    const speakerTrack = speakerCarousel.querySelector('.speaker-track');
    const speakerSlides = Array.from(speakerCarousel.querySelectorAll('.speaker-slide'));
    const speakerDots = Array.from(speakerCarousel.querySelectorAll('.speaker-dot'));

    setSpeakerSlide = (index) => {
      activeSpeakerIndex = (index + speakerSlides.length) % speakerSlides.length;
      speakerCarousel.style.setProperty('--speaker-index', activeSpeakerIndex);
      speakerCarousel.style.setProperty('--speaker-offset', `${activeSpeakerIndex * -100}%`);

      speakerSlides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeSpeakerIndex;
        slide.classList.toggle('is-active', isActive);
        slide.toggleAttribute('aria-hidden', !isActive);
      });

      speakerDots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeSpeakerIndex;
        dot.classList.toggle('is-active', isActive);
        if (isActive) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    };

    const startSpeakerTimer = () => {
      if (reducedMotion.matches || speakerSlides.length < 2 || speakerTimer) return;
      speakerTimer = window.setInterval(() => {
        setSpeakerSlide(activeSpeakerIndex + 1);
      }, 5600);
    };

    speakerDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const slideIndex = Number(dot.dataset.slide);
        if (Number.isNaN(slideIndex)) return;
        setSpeakerSlide(slideIndex);
        stopSpeakerTimer();
        startSpeakerTimer();
      });
    });

    speakerCarousel.addEventListener('pointerenter', stopSpeakerTimer);
    speakerCarousel.addEventListener('pointerleave', startSpeakerTimer);
    speakerCarousel.addEventListener('focusin', stopSpeakerTimer);
    speakerCarousel.addEventListener('focusout', startSpeakerTimer);
    speakerCarousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        setSpeakerSlide(activeSpeakerIndex + 1);
      }

      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        setSpeakerSlide(activeSpeakerIndex - 1);
      }
    });

    if (speakerTrack) {
      setSpeakerSlide(0);
      startSpeakerTimer();
    }
  }

  setHeaderState();
  updateActiveNav();
  window.addEventListener('scroll', setHeaderState, { passive: true });
  window.addEventListener('scroll', requestActiveNavUpdate, { passive: true });
  window.addEventListener('resize', requestActiveNavUpdate);
  window.addEventListener('hashchange', requestActiveNavUpdate);
  navToggle?.addEventListener('click', onToggleClick);
  nav?.addEventListener('click', onNavClick);

  return () => {
    window.clearTimeout(revealFallback);
    window.removeEventListener('scroll', setHeaderState);
    window.removeEventListener('scroll', requestActiveNavUpdate);
    window.removeEventListener('resize', requestActiveNavUpdate);
    window.removeEventListener('hashchange', requestActiveNavUpdate);
    navToggle?.removeEventListener('click', onToggleClick);
    nav?.removeEventListener('click', onNavClick);
    revealObserver.disconnect();
    stopSpeakerTimer();
    if (activeNavFrame) window.cancelAnimationFrame(activeNavFrame);
  };
}

export default memo(function CollectionPage() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    return setupCollectionInteractions(root);
  }, []);

  return <div {...({ className: 'collection-page', lang: 'en', ref: rootRef })}>{<a {...({ "className": "skip-link", "href": "#main" })}>{"Skip to content"}</a>}{<header {...({ "className": "site-header is-visible is-scrolled", "data-reveal": "", "style": cssStyle("--reveal-delay: 0ms;") })}>{<a {...({ "className": "brand-lockup", "href": "#", "aria-label": "Bintang Toba collection home" })}>{<span {...({ "className": "brand-mark", "aria-hidden": "true" })}>{<span />}</span>}{<span {...({ "className": "brand-word" })}>{<span>{"BINTANG"}</span>}{<span>{"TOBA"}</span>}</span>}</a>}{<button {...({ "className": "nav-toggle", "type": "button", "aria-expanded": "false", "aria-controls": "site-nav" })}>{<span>{"Menu"}</span>}{<i {...({ "aria-hidden": "true" })} />}</button>}{<nav {...({ "className": "site-nav", "id": "site-nav", "aria-label": "Primary navigation" })}>{<a {...({ "href": "#home", "aria-current": "page" })}>{"Home"}</a>}{<a {...({ "href": "#agenda" })}>{"Agenda"}</a>}{<a {...({ "href": "#speakers" })}>{"Speakers"}</a>}{<a {...({ "href": "#installations" })}>{"Installations"}</a>}{<a {...({ "href": "#experience" })}>{"Experience"}</a>}{<a {...({ "href": "#tickets" })}>{"Practicals"}</a>}</nav>}{<a {...({ "className": "ticket-pill", "href": "#tickets" })}>{<span>{"Get tickets"}</span>}{<svg {...({ "viewBox": "0 0 24 24", "aria-hidden": "true" })}>{<path {...({ "d": "M5 12h12m-5-5 5 5-5 5" })} />}</svg>}</a>}</header>}{<main {...({ "id": "main" })}>{<section {...({ "className": "hero", "id": "home", "aria-labelledby": "hero-title" })}>{<div {...({ "className": "vertical-poem", "aria-hidden": "true" })}>{<span>{"\u672a\u6765\u3092\u63cf\u304d\u3001\u5171\u306b\u5275\u308b\u3002"}</span>}{<i />}{<img {...({ "src": "koleksi/neo_mirai/assets/stamp_seal.svg", "alt": "" })} />}</div>}{<div {...({ "className": "hero-copy is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 0ms;") })}>{<h1 {...({ "id": "hero-title" })}>{<span>{"BINTANG TOBA"}</span>}{<span>{"AI DESIGN"}</span>}{<span>{"CONFERENCE"}</span>}</h1>}{<p {...({ "className": "hero-place" })}>{"Tokyo 2042"}</p>}{<p {...({ "className": "hero-summary" })}>{"Illustration, interfaces, machines, optimism"}</p>}{<div {...({ "className": "hero-meta", "aria-label": "Conference date and venue" })}>{<span>{"May 20\u201322, 2042"}</span>}{<span>{"Tokyo International Forum"}</span>}</div>}</div>}{<figure {...({ "className": "hero-art is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 110ms;") })}>{<img {...({ "src": "koleksi/neo_mirai/assets/hero_city.webp", "alt": "An illustrated golden future Tokyo skyline with towers, terraces, and visitors walking toward the conference venue." })} />}{<figcaption>{"Systems with warmth. Machines with a human horizon."}</figcaption>}</figure>}</section>}{<section {...({ "className": "agenda-block", "id": "agenda", "aria-labelledby": "agenda-title" })}>{<div {...({ "className": "agenda-panel is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 0ms;") })}>{<p {...({ "className": "section-label" })}>{"Agenda"}</p>}{<h2 {...({ "id": "agenda-title" })}>{"Three days of ideas and inspiration"}</h2>}{<ol {...({ "className": "agenda-days", "aria-label": "Conference agenda highlights" })}>{<li>{<time {...({ "dateTime": "2042-05-20" })}>{"Day 01 "}{<span>{"05.20"}</span>}</time>}{<div>{<h3>{"New Frontiers"}</h3>}{<p>{"Keynotes, visions, and emerging paradigms."}</p>}</div>}</li>}{<li>{<time {...({ "dateTime": "2042-05-21" })}>{"Day 02 "}{<span>{"05.21"}</span>}</time>}{<div>{<h3>{"Design x Intelligence"}</h3>}{<p>{"Crafting experiences with AI."}</p>}</div>}</li>}{<li>{<time {...({ "dateTime": "2042-05-22" })}>{"Day 03 "}{<span>{"05.22"}</span>}</time>}{<div>{<h3>{"Society & Imagination"}</h3>}{<p>{"Systems, ethics, and collective futures."}</p>}</div>}</li>}</ol>}{<a {...({ "className": "text-action", "href": "#tickets" })}>{"View full agenda "}{<span {...({ "className": "text-action-icon", "aria-hidden": "true" })}>{<span {...({ "className": "text-action-arrow" })}>{"\u2192"}</span>}</span>}</a>}</div>}{<figure {...({ "className": "agenda-art is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 110ms;") })}>{<img {...({ "src": "koleksi/neo_mirai/assets/agenda_architecture.webp", "alt": "A quiet illustrated architectural platform with amber circles, slim towers, and a lone visitor." })} />}{<figcaption>{"\u5275\u9020\u306f\u3001\u672a\u6765\u3092\u3064\u304f\u308b\u6700\u521d\u306e\u4e00\u6b69\u3002"}</figcaption>}</figure>}</section>}{<section {...({ "className": "speakers", "id": "speakers", "aria-labelledby": "speakers-title" })}>{<div {...({ "className": "section-intro is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 0ms;") })}>{<p {...({ "className": "section-label" })}>{"Speakers"}</p>}{<h2 {...({ "id": "speakers-title" })}>{"Pioneers shaping tomorrow"}</h2>}{<a {...({ "className": "text-action", "href": "#tickets" })}>{"View full speakers "}{<span {...({ "className": "text-action-icon", "aria-hidden": "true" })}>{<span {...({ "className": "text-action-arrow" })}>{"\u2192"}</span>}</span>}</a>}</div>}{<div {...({ "className": "speaker-carousel is-visible", "data-reveal": "", "aria-roledescription": "carousel", "aria-label": "Featured speaker carousel", "style": cssStyle("--reveal-delay: 110ms; --speaker-index: 0; --speaker-offset: 0%;") })}>{<div {...({ "className": "speaker-track", "id": "speaker-track" })}>{<article {...({ "className": "speaker-slide is-active", "aria-label": "Featured speakers set 1" })}>{<ul {...({ "className": "speaker-grid", "aria-label": "Featured speakers, set 1" })}>{<li {...({ "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 68%; --speaker-focus-y: 48%;"), "data-kanji": "\u4e2d\u6751\u7531\u7f8e" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/speaker_yumi_nakamura.webp", "alt": "Yumi Nakamura illustrated in profile before a golden sun and distant future city." })} />}{<div {...({ "className": "speaker-meta" })}>{<span>{"Yumi Nakamura"}</span>}{<small>{"AI Ethicist & Researcher"}</small>}</div>}</li>}{<li {...({ "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 52%; --speaker-focus-y: 47%;"), "data-kanji": "\u7530\u4e2d\u5553\u4ecb" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/speaker_keisuke_tanaka.webp", "alt": "Keisuke Tanaka illustrated before an amber sun and speculative city towers." })} />}{<div {...({ "className": "speaker-meta" })}>{<span>{"Keisuke Tanaka"}</span>}{<small>{"Interaction Designer & Creative Director"}</small>}</div>}</li>}{<li {...({ "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 42%; --speaker-focus-y: 48%;"), "data-kanji": "\u674e\u30bd\u30d5\u30a3\u30a2" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/speaker_sophia_lee.webp", "alt": "Sophia Lee illustrated in profile near circular geometry and a temple skyline." })} />}{<div {...({ "className": "speaker-meta" })}>{<span>{"Sophia Lee"}</span>}{<small>{"Machine Learning Artist"}</small>}</div>}</li>}</ul>}</article>}{<article {...({ "className": "speaker-slide", "aria-label": "Featured speakers set 2", "aria-hidden": "true" })}>{<ul {...({ "className": "speaker-grid", "aria-label": "Featured speakers, set 2" })}>{<li {...({ "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 44%; --speaker-focus-y: 48%;"), "data-kanji": "\u6e21\u8fba\u85cd\u5b50" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/speaker_aiko_watanabe.webp", "alt": "Aiko Watanabe illustrated in profile against a burnt-orange sun and pine silhouette." })} />}{<div {...({ "className": "speaker-meta" })}>{<span>{"Aiko Watanabe"}</span>}{<small>{"Synthetic Media Director"}</small>}</div>}</li>}{<li {...({ "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 52%; --speaker-focus-y: 48%;"), "data-kanji": "\u4f50\u85e4\u84ee" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/speaker_ren_sato.webp", "alt": "Ren Sato illustrated before Mount Fuji and flowing translucent forms." })} />}{<div {...({ "className": "speaker-meta" })}>{<span>{"Ren Sato"}</span>}{<small>{"Robotics Experience Lead"}</small>}</div>}</li>}{<li {...({ "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 46%; --speaker-focus-y: 48%;"), "data-kanji": "\u9ed2\u7530\u7f8e\u5948" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/speaker_mina_kuroda.webp", "alt": "Mina Kuroda illustrated before a red sun and vertical future towers." })} />}{<div {...({ "className": "speaker-meta" })}>{<span>{"Mina Kuroda"}</span>}{<small>{"Computational Typographer"}</small>}</div>}</li>}</ul>}</article>}{<article {...({ "className": "speaker-slide", "aria-label": "Featured speakers set 3", "aria-hidden": "true" })}>{<ul {...({ "className": "speaker-grid", "aria-label": "Featured speakers, set 3" })}>{<li {...({ "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 43%; --speaker-focus-y: 48%;"), "data-kanji": "\u68ee\u82b1" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/speaker_hana_mori.webp", "alt": "Hana Mori illustrated against a black eclipse circle and delicate future skyline." })} />}{<div {...({ "className": "speaker-meta" })}>{<span>{"Hana Mori"}</span>}{<small>{"Speculative Systems Artist"}</small>}</div>}</li>}{<li {...({ "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 52%; --speaker-focus-y: 47%;"), "data-kanji": "\u4f0a\u85e4\u5927\u5730" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/speaker_daichi_ito.webp", "alt": "Daichi Ito illustrated before a red sun and dense machine city." })} />}{<div {...({ "className": "speaker-meta" })}>{<span>{"Daichi Ito"}</span>}{<small>{"Neural Interface Researcher"}</small>}</div>}</li>}{<li {...({ "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 42%; --speaker-focus-y: 48%;"), "data-kanji": "\u5c0f\u6797\u6075\u7f8e" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/speaker_emi_kobayashi.webp", "alt": "Emi Kobayashi illustrated near a gold disk and Tokyo tower forms." })} />}{<div {...({ "className": "speaker-meta" })}>{<span>{"Emi Kobayashi"}</span>}{<small>{"Civic AI Designer"}</small>}</div>}</li>}</ul>}</article>}{<article {...({ "className": "speaker-slide", "aria-label": "Featured speakers set 4", "aria-hidden": "true" })}>{<ul {...({ "className": "speaker-grid", "aria-label": "Featured speakers, set 4" })}>{<li {...({ "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 70%; --speaker-focus-y: 48%;"), "data-kanji": "\u8352\u7530\u5065\u53f8" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/speaker_kenji_arata.webp", "alt": "Kenji Arata illustrated before a red sun and distant speculative towers." })} />}{<div {...({ "className": "speaker-meta" })}>{<span>{"Kenji Arata"}</span>}{<small>{"Machine Imagination Lab"}</small>}</div>}</li>}{<li {...({ "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 52%; --speaker-focus-y: 48%;"), "data-kanji": "\u53e4\u8cc0\u76f4\u7f8e" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/speaker_naomi_koga.webp", "alt": "Naomi Koga illustrated below layered amber circles and a small temple skyline." })} />}{<div {...({ "className": "speaker-meta" })}>{<span>{"Naomi Koga"}</span>}{<small>{"Data Rituals Curator"}</small>}</div>}</li>}{<li {...({ "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 58%; --speaker-focus-y: 48%;"), "data-kanji": "\u85e4\u672c\u4eae" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/speaker_ryo_fujimoto.webp", "alt": "Ryo Fujimoto illustrated near dark circular geometry and warm technical markings." })} />}{<div {...({ "className": "speaker-meta" })}>{<span>{"Ryo Fujimoto"}</span>}{<small>{"Embodied Intelligence Architect"}</small>}</div>}</li>}</ul>}</article>}</div>}{<div {...({ "className": "speaker-controls", "aria-label": "Speaker carousel controls" })}>{<button {...({ "className": "speaker-dot is-active", "type": "button", "data-slide": "0", "aria-label": "Show speaker set 1", "aria-current": "true" })} />}{<button {...({ "className": "speaker-dot", "type": "button", "data-slide": "1", "aria-label": "Show speaker set 2" })} />}{<button {...({ "className": "speaker-dot", "type": "button", "data-slide": "2", "aria-label": "Show speaker set 3" })} />}{<button {...({ "className": "speaker-dot", "type": "button", "data-slide": "3", "aria-label": "Show speaker set 4" })} />}</div>}</div>}</section>}{<section {...({ "className": "installations", "id": "installations", "aria-labelledby": "installations-title" })}>{<div {...({ "className": "section-intro is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 0ms;") })}>{<p {...({ "className": "section-label" })}>{"Installations"}</p>}{<h2 {...({ "id": "installations-title" })}>{"Experiences beyond the screen"}</h2>}{<a {...({ "className": "text-action", "href": "#tickets" })}>{"Explore installations "}{<span {...({ "className": "text-action-icon", "aria-hidden": "true" })}>{<span {...({ "className": "text-action-arrow" })}>{"\u2192"}</span>}</span>}</a>}</div>}{<div {...({ "className": "installation-rhythm is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 110ms;") })}>{<article {...({ "className": "installation-item item-flux" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/install_flux.webp", "alt": "A tiny visitor standing before a glowing orange spherical installation." })} />}{<h3>{"Harmonic Flux"}</h3>}{<p>{"Immersive environment"}</p>}</article>}{<article {...({ "className": "installation-item item-dream" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/install_dream.webp", "alt": "An illustrated generative ribbon floating through an amber exhibition space." })} />}{<h3>{"Dream Compiler"}</h3>}{<p>{"Generative sculpture"}</p>}</article>}{<article {...({ "className": "installation-item item-echoes" })}>{<img {...({ "src": "koleksi/neo_mirai/assets/install_echoes.webp", "alt": "A lone visitor in a circular sound installation with a dark center." })} />}{<h3>{"Echoes of Tomorrow"}</h3>}{<p>{"AI soundscape"}</p>}</article>}</div>}</section>}{<section {...({ "className": "manifesto", "id": "experience", "aria-labelledby": "manifesto-title" })}>{<div {...({ "className": "manifesto-copy is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 0ms;") })}>{<p {...({ "className": "section-label" })}>{"Manifesto"}</p>}{<h2 {...({ "id": "manifesto-title" })}>{"We believe the future is something we design together."}</h2>}{<a {...({ "className": "text-action text-action-light", "href": "#tickets" })}>{"The Bintang Toba manifesto "}{<span {...({ "className": "text-action-icon", "aria-hidden": "true" })}>{<span {...({ "className": "text-action-arrow" })}>{"\u2192"}</span>}</span>}</a>}</div>}{<figure {...({ "className": "manifesto-art is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 110ms;") })}>{<img {...({ "src": "koleksi/neo_mirai/assets/manifesto_fuji_regenerated.webp", "alt": "Mount Fuji and a golden future city beneath a red sun." })} />}</figure>}</section>}{<section {...({ "className": "tickets", "id": "tickets", "aria-labelledby": "tickets-title" })}>{<img {...({ "className": "ticket-pine", "src": "koleksi/neo_mirai/assets/pine_ticket.png", "alt": "", "aria-hidden": "true" })} />}{<div {...({ "className": "tickets-heading is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 0ms;") })}>{<p {...({ "className": "section-label" })}>{"Tickets"}</p>}{<h2 {...({ "id": "tickets-title" })}>{"Choose your experience"}</h2>}</div>}{<div {...({ "className": "ticket-options is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 110ms;") })}>{<article>{<h3>{"Attendee"}</h3>}{<p>{"Full access to all talks and installations."}</p>}{<strong>{"\u00a5 49,000"}</strong>}{<a {...({ "href": "mailto:trianandaadisti04@gmail.com" })}>{"Select"}</a>}</article>}{<article>{<h3>{"Student"}</h3>}{<p>{"Access for students and educators."}</p>}{<strong>{"\u00a5 19,000"}</strong>}{<a {...({ "href": "mailto:trianandaadisti04@gmail.com" })}>{"Select"}</a>}</article>}{<article>{<h3>{"Supporter"}</h3>}{<p>{"Support the community and get benefits."}</p>}{<strong>{"\u00a5 99,000"}</strong>}{<a {...({ "href": "mailto:trianandaadisti04@gmail.com" })}>{"Select"}</a>}</article>}{<article>{<h3>{"Group"}</h3>}{<p>{"For teams of five or more."}</p>}{<strong>{"Contact us"}</strong>}{<a {...({ "href": "mailto:trianandaadisti04@gmail.com" })}>{"Inquire"}</a>}</article>}</div>}{<aside {...({ "className": "ticket-seal is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 220ms;") })}>{<span {...({ "className": "ticket-seal-label" })}>{<span>{"Get"}</span>}{<span>{"Your"}</span>}{<span>{"Ticket"}</span>}</span>}{<a {...({ "href": "mailto:trianandaadisti04@gmail.com", "aria-label": "Email Bintang Toba" })}>{"\u2192"}</a>}</aside>}</section>}</main>}{<footer {...({ "className": "site-footer" })}>{<a {...({ "className": "brand-lockup brand-lockup-small", "href": "#", "aria-label": "Bintang Toba collection home" })}>{<span {...({ "className": "brand-mark", "aria-hidden": "true" })}>{<span />}</span>}{<span {...({ "className": "brand-word" })}>{<span>{"BINTANG"}</span>}{<span>{"TOBA"}</span>}</span>}</a>}{<p>{"\u672a\u6765\u3092\u63cf\u304d\u3001\u5171\u306b\u5275\u308b\u3002"}</p>}{<nav {...({ "aria-label": "Footer navigation" })}>{<a {...({ "href": "#agenda" })}>{"About"}</a>}{<a {...({ "href": "#speakers" })}>{"Partners"}</a>}{<a {...({ "href": "#installations" })}>{"News"}</a>}{<a {...({ "href": "#tickets" })}>{"FAQ"}</a>}{<a {...({ "href": "mailto:trianandaadisti04@gmail.com" })}>{"Contact"}</a>}</nav>}</footer>}</div>;
});
