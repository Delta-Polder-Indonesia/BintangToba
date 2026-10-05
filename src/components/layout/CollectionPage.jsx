import { createElement as h, memo, useEffect, useRef } from 'react';
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

  return h(
    'div',
    { className: 'collection-page', lang: 'en', ref: rootRef },
        h("a", { "className": "skip-link", "href": "#main" },
          "Skip to content"
        ),
        h("header", { "className": "site-header is-visible is-scrolled", "data-reveal": "", "style": cssStyle("--reveal-delay: 0ms;") },
          h("a", { "className": "brand-lockup", "href": "#", "aria-label": "Bintang Toba collection home" },
            h("span", { "className": "brand-mark", "aria-hidden": "true" },
              h("span", null)
            ),
            h("span", { "className": "brand-word" },
              h("span", null,
                "BINTANG"
              ),
              h("span", null,
                "TOBA"
              )
            )
          ),
          h("button", { "className": "nav-toggle", "type": "button", "aria-expanded": "false", "aria-controls": "site-nav" },
            h("span", null,
              "Menu"
            ),
            h("i", { "aria-hidden": "true" })
          ),
          h("nav", { "className": "site-nav", "id": "site-nav", "aria-label": "Primary navigation" },
            h("a", { "href": "#home", "aria-current": "page" },
              "Home"
            ),
            h("a", { "href": "#agenda" },
              "Agenda"
            ),
            h("a", { "href": "#speakers" },
              "Speakers"
            ),
            h("a", { "href": "#installations" },
              "Installations"
            ),
            h("a", { "href": "#experience" },
              "Experience"
            ),
            h("a", { "href": "#tickets" },
              "Practicals"
            )
          ),
          h("a", { "className": "ticket-pill", "href": "#tickets" },
            h("span", null,
              "Get tickets"
            ),
            h("svg", { "viewBox": "0 0 24 24", "aria-hidden": "true" },
              h("path", { "d": "M5 12h12m-5-5 5 5-5 5" })
            )
          )
        ),
        h("main", { "id": "main" },
          h("section", { "className": "hero", "id": "home", "aria-labelledby": "hero-title" },
            h("div", { "className": "vertical-poem", "aria-hidden": "true" },
              h("span", null,
                "\u672a\u6765\u3092\u63cf\u304d\u3001\u5171\u306b\u5275\u308b\u3002"
              ),
              h("i", null),
              h("img", { "src": "koleksi/neo_mirai/assets/stamp_seal.svg", "alt": "" })
            ),
            h("div", { "className": "hero-copy is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 0ms;") },
              h("h1", { "id": "hero-title" },
                h("span", null,
                  "BINTANG TOBA"
                ),
                h("span", null,
                  "AI DESIGN"
                ),
                h("span", null,
                  "CONFERENCE"
                )
              ),
              h("p", { "className": "hero-place" },
                "Tokyo 2042"
              ),
              h("p", { "className": "hero-summary" },
                "Illustration, interfaces, machines, optimism"
              ),
              h("div", { "className": "hero-meta", "aria-label": "Conference date and venue" },
                h("span", null,
                  "May 20\u201322, 2042"
                ),
                h("span", null,
                  "Tokyo International Forum"
                )
              )
            ),
            h("figure", { "className": "hero-art is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 110ms;") },
              h("img", { "src": "koleksi/neo_mirai/assets/hero_city.webp", "alt": "An illustrated golden future Tokyo skyline with towers, terraces, and visitors walking toward the conference venue." }),
              h("figcaption", null,
                "Systems with warmth. Machines with a human horizon."
              )
            )
          ),
          h("section", { "className": "agenda-block", "id": "agenda", "aria-labelledby": "agenda-title" },
            h("div", { "className": "agenda-panel is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 0ms;") },
              h("p", { "className": "section-label" },
                "Agenda"
              ),
              h("h2", { "id": "agenda-title" },
                "Three days of ideas and inspiration"
              ),
              h("ol", { "className": "agenda-days", "aria-label": "Conference agenda highlights" },
                h("li", null,
                  h("time", { "dateTime": "2042-05-20" },
                    "Day 01 ",
                    h("span", null,
                      "05.20"
                    )
                  ),
                  h("div", null,
                    h("h3", null,
                      "New Frontiers"
                    ),
                    h("p", null,
                      "Keynotes, visions, and emerging paradigms."
                    )
                  )
                ),
                h("li", null,
                  h("time", { "dateTime": "2042-05-21" },
                    "Day 02 ",
                    h("span", null,
                      "05.21"
                    )
                  ),
                  h("div", null,
                    h("h3", null,
                      "Design x Intelligence"
                    ),
                    h("p", null,
                      "Crafting experiences with AI."
                    )
                  )
                ),
                h("li", null,
                  h("time", { "dateTime": "2042-05-22" },
                    "Day 03 ",
                    h("span", null,
                      "05.22"
                    )
                  ),
                  h("div", null,
                    h("h3", null,
                      "Society & Imagination"
                    ),
                    h("p", null,
                      "Systems, ethics, and collective futures."
                    )
                  )
                )
              ),
              h("a", { "className": "text-action", "href": "#tickets" },
                "View full agenda ",
                h("span", { "className": "text-action-icon", "aria-hidden": "true" },
                  h("span", { "className": "text-action-arrow" },
                    "\u2192"
                  )
                )
              )
            ),
            h("figure", { "className": "agenda-art is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 110ms;") },
              h("img", { "src": "koleksi/neo_mirai/assets/agenda_architecture.webp", "alt": "A quiet illustrated architectural platform with amber circles, slim towers, and a lone visitor." }),
              h("figcaption", null,
                "\u5275\u9020\u306f\u3001\u672a\u6765\u3092\u3064\u304f\u308b\u6700\u521d\u306e\u4e00\u6b69\u3002"
              )
            )
          ),
          h("section", { "className": "speakers", "id": "speakers", "aria-labelledby": "speakers-title" },
            h("div", { "className": "section-intro is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 0ms;") },
              h("p", { "className": "section-label" },
                "Speakers"
              ),
              h("h2", { "id": "speakers-title" },
                "Pioneers shaping tomorrow"
              ),
              h("a", { "className": "text-action", "href": "#tickets" },
                "View full speakers ",
                h("span", { "className": "text-action-icon", "aria-hidden": "true" },
                  h("span", { "className": "text-action-arrow" },
                    "\u2192"
                  )
                )
              )
            ),
            h("div", { "className": "speaker-carousel is-visible", "data-reveal": "", "aria-roledescription": "carousel", "aria-label": "Featured speaker carousel", "style": cssStyle("--reveal-delay: 110ms; --speaker-index: 0; --speaker-offset: 0%;") },
              h("div", { "className": "speaker-track", "id": "speaker-track" },
                h("article", { "className": "speaker-slide is-active", "aria-label": "Featured speakers set 1" },
                  h("ul", { "className": "speaker-grid", "aria-label": "Featured speakers, set 1" },
                    h("li", { "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 68%; --speaker-focus-y: 48%;"), "data-kanji": "\u4e2d\u6751\u7531\u7f8e" },
                      h("img", { "src": "koleksi/neo_mirai/assets/speaker_yumi_nakamura.webp", "alt": "Yumi Nakamura illustrated in profile before a golden sun and distant future city." }),
                      h("div", { "className": "speaker-meta" },
                        h("span", null,
                          "Yumi Nakamura"
                        ),
                        h("small", null,
                          "AI Ethicist & Researcher"
                        )
                      )
                    ),
                    h("li", { "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 52%; --speaker-focus-y: 47%;"), "data-kanji": "\u7530\u4e2d\u5553\u4ecb" },
                      h("img", { "src": "koleksi/neo_mirai/assets/speaker_keisuke_tanaka.webp", "alt": "Keisuke Tanaka illustrated before an amber sun and speculative city towers." }),
                      h("div", { "className": "speaker-meta" },
                        h("span", null,
                          "Keisuke Tanaka"
                        ),
                        h("small", null,
                          "Interaction Designer & Creative Director"
                        )
                      )
                    ),
                    h("li", { "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 42%; --speaker-focus-y: 48%;"), "data-kanji": "\u674e\u30bd\u30d5\u30a3\u30a2" },
                      h("img", { "src": "koleksi/neo_mirai/assets/speaker_sophia_lee.webp", "alt": "Sophia Lee illustrated in profile near circular geometry and a temple skyline." }),
                      h("div", { "className": "speaker-meta" },
                        h("span", null,
                          "Sophia Lee"
                        ),
                        h("small", null,
                          "Machine Learning Artist"
                        )
                      )
                    )
                  )
                ),
                h("article", { "className": "speaker-slide", "aria-label": "Featured speakers set 2", "aria-hidden": "true" },
                  h("ul", { "className": "speaker-grid", "aria-label": "Featured speakers, set 2" },
                    h("li", { "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 44%; --speaker-focus-y: 48%;"), "data-kanji": "\u6e21\u8fba\u85cd\u5b50" },
                      h("img", { "src": "koleksi/neo_mirai/assets/speaker_aiko_watanabe.webp", "alt": "Aiko Watanabe illustrated in profile against a burnt-orange sun and pine silhouette." }),
                      h("div", { "className": "speaker-meta" },
                        h("span", null,
                          "Aiko Watanabe"
                        ),
                        h("small", null,
                          "Synthetic Media Director"
                        )
                      )
                    ),
                    h("li", { "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 52%; --speaker-focus-y: 48%;"), "data-kanji": "\u4f50\u85e4\u84ee" },
                      h("img", { "src": "koleksi/neo_mirai/assets/speaker_ren_sato.webp", "alt": "Ren Sato illustrated before Mount Fuji and flowing translucent forms." }),
                      h("div", { "className": "speaker-meta" },
                        h("span", null,
                          "Ren Sato"
                        ),
                        h("small", null,
                          "Robotics Experience Lead"
                        )
                      )
                    ),
                    h("li", { "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 46%; --speaker-focus-y: 48%;"), "data-kanji": "\u9ed2\u7530\u7f8e\u5948" },
                      h("img", { "src": "koleksi/neo_mirai/assets/speaker_mina_kuroda.webp", "alt": "Mina Kuroda illustrated before a red sun and vertical future towers." }),
                      h("div", { "className": "speaker-meta" },
                        h("span", null,
                          "Mina Kuroda"
                        ),
                        h("small", null,
                          "Computational Typographer"
                        )
                      )
                    )
                  )
                ),
                h("article", { "className": "speaker-slide", "aria-label": "Featured speakers set 3", "aria-hidden": "true" },
                  h("ul", { "className": "speaker-grid", "aria-label": "Featured speakers, set 3" },
                    h("li", { "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 43%; --speaker-focus-y: 48%;"), "data-kanji": "\u68ee\u82b1" },
                      h("img", { "src": "koleksi/neo_mirai/assets/speaker_hana_mori.webp", "alt": "Hana Mori illustrated against a black eclipse circle and delicate future skyline." }),
                      h("div", { "className": "speaker-meta" },
                        h("span", null,
                          "Hana Mori"
                        ),
                        h("small", null,
                          "Speculative Systems Artist"
                        )
                      )
                    ),
                    h("li", { "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 52%; --speaker-focus-y: 47%;"), "data-kanji": "\u4f0a\u85e4\u5927\u5730" },
                      h("img", { "src": "koleksi/neo_mirai/assets/speaker_daichi_ito.webp", "alt": "Daichi Ito illustrated before a red sun and dense machine city." }),
                      h("div", { "className": "speaker-meta" },
                        h("span", null,
                          "Daichi Ito"
                        ),
                        h("small", null,
                          "Neural Interface Researcher"
                        )
                      )
                    ),
                    h("li", { "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 42%; --speaker-focus-y: 48%;"), "data-kanji": "\u5c0f\u6797\u6075\u7f8e" },
                      h("img", { "src": "koleksi/neo_mirai/assets/speaker_emi_kobayashi.webp", "alt": "Emi Kobayashi illustrated near a gold disk and Tokyo tower forms." }),
                      h("div", { "className": "speaker-meta" },
                        h("span", null,
                          "Emi Kobayashi"
                        ),
                        h("small", null,
                          "Civic AI Designer"
                        )
                      )
                    )
                  )
                ),
                h("article", { "className": "speaker-slide", "aria-label": "Featured speakers set 4", "aria-hidden": "true" },
                  h("ul", { "className": "speaker-grid", "aria-label": "Featured speakers, set 4" },
                    h("li", { "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 70%; --speaker-focus-y: 48%;"), "data-kanji": "\u8352\u7530\u5065\u53f8" },
                      h("img", { "src": "koleksi/neo_mirai/assets/speaker_kenji_arata.webp", "alt": "Kenji Arata illustrated before a red sun and distant speculative towers." }),
                      h("div", { "className": "speaker-meta" },
                        h("span", null,
                          "Kenji Arata"
                        ),
                        h("small", null,
                          "Machine Imagination Lab"
                        )
                      )
                    ),
                    h("li", { "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 52%; --speaker-focus-y: 48%;"), "data-kanji": "\u53e4\u8cc0\u76f4\u7f8e" },
                      h("img", { "src": "koleksi/neo_mirai/assets/speaker_naomi_koga.webp", "alt": "Naomi Koga illustrated below layered amber circles and a small temple skyline." }),
                      h("div", { "className": "speaker-meta" },
                        h("span", null,
                          "Naomi Koga"
                        ),
                        h("small", null,
                          "Data Rituals Curator"
                        )
                      )
                    ),
                    h("li", { "className": "speaker-person", "style": cssStyle("--speaker-focus-x: 58%; --speaker-focus-y: 48%;"), "data-kanji": "\u85e4\u672c\u4eae" },
                      h("img", { "src": "koleksi/neo_mirai/assets/speaker_ryo_fujimoto.webp", "alt": "Ryo Fujimoto illustrated near dark circular geometry and warm technical markings." }),
                      h("div", { "className": "speaker-meta" },
                        h("span", null,
                          "Ryo Fujimoto"
                        ),
                        h("small", null,
                          "Embodied Intelligence Architect"
                        )
                      )
                    )
                  )
                )
              ),
              h("div", { "className": "speaker-controls", "aria-label": "Speaker carousel controls" },
                h("button", { "className": "speaker-dot is-active", "type": "button", "data-slide": "0", "aria-label": "Show speaker set 1", "aria-current": "true" }),
                h("button", { "className": "speaker-dot", "type": "button", "data-slide": "1", "aria-label": "Show speaker set 2" }),
                h("button", { "className": "speaker-dot", "type": "button", "data-slide": "2", "aria-label": "Show speaker set 3" }),
                h("button", { "className": "speaker-dot", "type": "button", "data-slide": "3", "aria-label": "Show speaker set 4" })
              )
            )
          ),
          h("section", { "className": "installations", "id": "installations", "aria-labelledby": "installations-title" },
            h("div", { "className": "section-intro is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 0ms;") },
              h("p", { "className": "section-label" },
                "Installations"
              ),
              h("h2", { "id": "installations-title" },
                "Experiences beyond the screen"
              ),
              h("a", { "className": "text-action", "href": "#tickets" },
                "Explore installations ",
                h("span", { "className": "text-action-icon", "aria-hidden": "true" },
                  h("span", { "className": "text-action-arrow" },
                    "\u2192"
                  )
                )
              )
            ),
            h("div", { "className": "installation-rhythm is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 110ms;") },
              h("article", { "className": "installation-item item-flux" },
                h("img", { "src": "koleksi/neo_mirai/assets/install_flux.webp", "alt": "A tiny visitor standing before a glowing orange spherical installation." }),
                h("h3", null,
                  "Harmonic Flux"
                ),
                h("p", null,
                  "Immersive environment"
                )
              ),
              h("article", { "className": "installation-item item-dream" },
                h("img", { "src": "koleksi/neo_mirai/assets/install_dream.webp", "alt": "An illustrated generative ribbon floating through an amber exhibition space." }),
                h("h3", null,
                  "Dream Compiler"
                ),
                h("p", null,
                  "Generative sculpture"
                )
              ),
              h("article", { "className": "installation-item item-echoes" },
                h("img", { "src": "koleksi/neo_mirai/assets/install_echoes.webp", "alt": "A lone visitor in a circular sound installation with a dark center." }),
                h("h3", null,
                  "Echoes of Tomorrow"
                ),
                h("p", null,
                  "AI soundscape"
                )
              )
            )
          ),
          h("section", { "className": "manifesto", "id": "experience", "aria-labelledby": "manifesto-title" },
            h("div", { "className": "manifesto-copy is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 0ms;") },
              h("p", { "className": "section-label" },
                "Manifesto"
              ),
              h("h2", { "id": "manifesto-title" },
                "We believe the future is something we design together."
              ),
              h("a", { "className": "text-action text-action-light", "href": "#tickets" },
                "The Bintang Toba manifesto ",
                h("span", { "className": "text-action-icon", "aria-hidden": "true" },
                  h("span", { "className": "text-action-arrow" },
                    "\u2192"
                  )
                )
              )
            ),
            h("figure", { "className": "manifesto-art is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 110ms;") },
              h("img", { "src": "koleksi/neo_mirai/assets/manifesto_fuji_regenerated.webp", "alt": "Mount Fuji and a golden future city beneath a red sun." })
            )
          ),
          h("section", { "className": "tickets", "id": "tickets", "aria-labelledby": "tickets-title" },
            h("img", { "className": "ticket-pine", "src": "koleksi/neo_mirai/assets/pine_ticket.png", "alt": "", "aria-hidden": "true" }),
            h("div", { "className": "tickets-heading is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 0ms;") },
              h("p", { "className": "section-label" },
                "Tickets"
              ),
              h("h2", { "id": "tickets-title" },
                "Choose your experience"
              )
            ),
            h("div", { "className": "ticket-options is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 110ms;") },
              h("article", null,
                h("h3", null,
                  "Attendee"
                ),
                h("p", null,
                  "Full access to all talks and installations."
                ),
                h("strong", null,
                  "\u00a5 49,000"
                ),
                h("a", { "href": "mailto:trianandaadisti04@gmail.com" },
                  "Select"
                )
              ),
              h("article", null,
                h("h3", null,
                  "Student"
                ),
                h("p", null,
                  "Access for students and educators."
                ),
                h("strong", null,
                  "\u00a5 19,000"
                ),
                h("a", { "href": "mailto:trianandaadisti04@gmail.com" },
                  "Select"
                )
              ),
              h("article", null,
                h("h3", null,
                  "Supporter"
                ),
                h("p", null,
                  "Support the community and get benefits."
                ),
                h("strong", null,
                  "\u00a5 99,000"
                ),
                h("a", { "href": "mailto:trianandaadisti04@gmail.com" },
                  "Select"
                )
              ),
              h("article", null,
                h("h3", null,
                  "Group"
                ),
                h("p", null,
                  "For teams of five or more."
                ),
                h("strong", null,
                  "Contact us"
                ),
                h("a", { "href": "mailto:trianandaadisti04@gmail.com" },
                  "Inquire"
                )
              )
            ),
            h("aside", { "className": "ticket-seal is-visible", "data-reveal": "", "style": cssStyle("--reveal-delay: 220ms;") },
              h("span", { "className": "ticket-seal-label" },
                h("span", null,
                  "Get"
                ),
                h("span", null,
                  "Your"
                ),
                h("span", null,
                  "Ticket"
                )
              ),
              h("a", { "href": "mailto:trianandaadisti04@gmail.com", "aria-label": "Email Bintang Toba" },
                "\u2192"
              )
            )
          )
        ),
        h("footer", { "className": "site-footer" },
          h("a", { "className": "brand-lockup brand-lockup-small", "href": "#", "aria-label": "Bintang Toba collection home" },
            h("span", { "className": "brand-mark", "aria-hidden": "true" },
              h("span", null)
            ),
            h("span", { "className": "brand-word" },
              h("span", null,
                "BINTANG"
              ),
              h("span", null,
                "TOBA"
              )
            )
          ),
          h("p", null,
            "\u672a\u6765\u3092\u63cf\u304d\u3001\u5171\u306b\u5275\u308b\u3002"
          ),
          h("nav", { "aria-label": "Footer navigation" },
            h("a", { "href": "#agenda" },
              "About"
            ),
            h("a", { "href": "#speakers" },
              "Partners"
            ),
            h("a", { "href": "#installations" },
              "News"
            ),
            h("a", { "href": "#tickets" },
              "FAQ"
            ),
            h("a", { "href": "mailto:trianandaadisti04@gmail.com" },
              "Contact"
            )
          ),
          h("div", { "className": "language-switch", "aria-label": "Language options" },
            h("a", { "href": "#", "aria-current": "true" },
              "EN"
            ),
            h("span", null,
              "/"
            ),
            h("a", { "href": "#" },
              "\u65e5\u672c\u8a9e"
            )
          )
        )
  );
});
