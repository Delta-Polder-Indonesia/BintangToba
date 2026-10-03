import { createElement, useEffect, useRef } from 'react';
import { aiSlopTranslations } from '../../data/index.js';
import '../../styles/ai-slop.css';


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

const aiSlopAttributeNames = ['aria-label', 'title', 'alt', 'data-title-2022', 'data-title-2025', 'data-title-2026'];

function compactAiSlopText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function translateAiSlopValue(value, language) {
  const dictionary = aiSlopTranslations[language];
  if (!dictionary) return value;

  const key = compactAiSlopText(value);
  const translation = dictionary[key];
  if (!translation) return value;

  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  return `${leading}${translation}${trailing}`;
}

function translateAiSlopText(value, language) {
  return translateAiSlopValue(value, language);
}

function translateAiSlopChild(child, language) {
  if (typeof child === 'string') return translateAiSlopValue(child, language);
  if (Array.isArray(child)) return child.map((item) => translateAiSlopChild(item, language));
  return child;
}

function createAiSlopElement(language) {
  return function translatedElement(type, props, ...children) {
    let nextProps = props;

    if (props && typeof props === 'object' && !Array.isArray(props)) {
      aiSlopAttributeNames.forEach((attributeName) => {
        if (typeof props[attributeName] !== 'string') return;
        const translatedValue = translateAiSlopValue(props[attributeName], language);
        if (translatedValue === props[attributeName]) return;
        nextProps = nextProps === props ? { ...props } : nextProps;
        nextProps[attributeName] = translatedValue;
      });
    }

    return createElement(type, nextProps, ...children.map((child) => translateAiSlopChild(child, language)));
  };
}

function setupAiSlopInteractions(root, language) {
  let disposed = false;

  function positionThumb(tab) {
    const thumb = root.querySelector('.slop-era-toggle .ks-thumb');
    if (!thumb) return;
    thumb.style.width = `${tab.offsetWidth}px`;
    thumb.style.transform = `translateX(${tab.offsetLeft}px)`;
  }

  function activateEra(tab) {
    const era = tab.getAttribute('data-era');
    root.querySelectorAll('.slop-era-tab').forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });

    positionThumb(tab);

    root.querySelectorAll('.slop-era-frame').forEach((frame) => {
      frame.style.display = frame.getAttribute('data-era') === era ? '' : 'none';
    });

    const title = root.querySelector('.visual-mode-preview-title[data-title-2022]');
    if (title) title.textContent = title.getAttribute(`data-title-${era}`);
  }

  const clickHandler = (event) => {
    const sidebarToggle = event.target.closest?.('.skills-sidebar-toggle');
    if (sidebarToggle) {
      const expanded = sidebarToggle.getAttribute('aria-expanded') === 'true';
      sidebarToggle.setAttribute('aria-expanded', String(!expanded));
      return;
    }

    const motionToggle = event.target.closest?.('[data-motion-toggle]');
    if (motionToggle) {
      const section = root.querySelector('#section-motion');
      const note = root.querySelector('[data-motion-note]');
      const paused = section?.classList.toggle('motion-paused');
      motionToggle.textContent = paused ? translateAiSlopText('Play examples', language) : translateAiSlopText('Pause examples', language);
      if (note) {
        note.textContent = paused
          ? translateAiSlopText('Illustrative loops, paused.', language)
          : translateAiSlopText('Illustrative loops, playing.', language);
      }
      return;
    }

    const eraTab = event.target.closest?.('.slop-era-tab');
    if (eraTab) {
      event.preventDefault();
      activateEra(eraTab);
    }
  };

  const keyHandler = (event) => {
    const tab = event.target.closest?.('.slop-era-tab');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const tabs = Array.from(root.querySelectorAll('.slop-era-tab'));
    const index = tabs.indexOf(tab);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;

    activateEra(tabs[nextIndex]);
    tabs[nextIndex].focus();
  };

  root.addEventListener('click', clickHandler);
  root.addEventListener('keydown', keyHandler);

  const syncThumb = () => {
    const activeTab = root.querySelector('.slop-era-tab.is-active');
    if (activeTab) positionThumb(activeTab);
  };

  syncThumb();
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (!disposed) syncThumb();
    });
  }

  const motionSection = root.querySelector('#section-motion');
  const motionToggle = root.querySelector('[data-motion-toggle]');
  const motionNote = root.querySelector('[data-motion-note]');
  let reducedMotion = null;
  let applyMotionPreference = null;

  if (motionSection && motionToggle && motionNote) {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    applyMotionPreference = () => {
      const paused = reducedMotion.matches;
      motionSection.classList.toggle('motion-paused', paused);
      motionToggle.disabled = paused;
      motionToggle.textContent = paused
        ? translateAiSlopText('Motion off', language)
        : translateAiSlopText('Pause examples', language);
      motionNote.textContent = paused
        ? translateAiSlopText('Motion is off to match your reduced-motion preference.', language)
        : translateAiSlopText('Examples repeat so you can inspect the movement.', language);
    };

    reducedMotion.addEventListener('change', applyMotionPreference);
    applyMotionPreference();
  }

  return () => {
    disposed = true;
    root.removeEventListener('click', clickHandler);
    root.removeEventListener('keydown', keyHandler);
    if (reducedMotion && applyMotionPreference) {
      reducedMotion.removeEventListener('change', applyMotionPreference);
    }
  };
}

export default function AiSlopPage({ language = 'en' }) {
  const rootRef = useRef(null);
  const h = createAiSlopElement(language);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    return setupAiSlopInteractions(root, language);
  }, [language]);

  return h(
    'div',
    { className: 'ai-slop-native-page', lang: language },
    h(
      'div',
      { className: 'sub-page skills-layout-page slop-page slop-kinpaku kinpaku-chrome', ref: rootRef },
          h("main", { "id": "main" },
            h("div", { "className": "skills-layout" },
              h("aside", { "className": "skills-sidebar slop-sidebar", "aria-label": "Slop page sections" },
                h("button", { "className": "skills-sidebar-toggle", "type": "button", "aria-expanded": "false", "aria-controls": "slop-sidebar-inner" },
                  h("span", { "className": "skills-sidebar-toggle-label" },
                    "On this page"
                  ),
                  h("svg", { "className": "skills-sidebar-toggle-chevron", "width": "14", "height": "14", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": "2.5", "aria-hidden": "true" },
                    h("path", { "d": "M6 9l6 6 6-6" })
                  )
                ),
                h("div", { "className": "skills-sidebar-inner", "id": "slop-sidebar-inner" },
                  h("p", { "className": "skills-sidebar-label" },
                    "On this page"
                  ),
                  h("div", { "className": "skills-sidebar-group" },
                    h("ul", { "className": "skills-sidebar-list anti-patterns-sidebar-list" },
                      h("li", {},
                        h("a", { "href": "#see-it" },
                          h("span", {},
                            "Slop through the years"
                          )
                        )
                      ),
                      h("li", {},
                        h("a", { "href": "#try-it-live" },
                          h("span", {},
                            "Explore the examples"
                          ),
                          h("span", { "className": "anti-patterns-sidebar-count" },
                            "11"
                          )
                        )
                      ),
                      h("li", {},
                        h("a", { "href": "#catalog" },
                          h("span", {},
                            "The catalog"
                          ),
                          h("span", { "className": "anti-patterns-sidebar-count" },
                            "67"
                          )
                        ),
                        h("ul", { "className": "slop-sidebar-sublist" },
                          h("li", {},
                            h("a", { "href": "#section-design-system" },
                              h("span", {},
                                "Your design system"
                              ),
                              h("span", { "className": "anti-patterns-sidebar-count" },
                                "4"
                              )
                            )
                          ),
                          h("li", {},
                            h("a", { "href": "#section-visual-details" },
                              h("span", {},
                                "Visual Details"
                              ),
                              h("span", { "className": "anti-patterns-sidebar-count" },
                                "8"
                              )
                            )
                          ),
                          h("li", {},
                            h("a", { "href": "#section-typography" },
                              h("span", {},
                                "Typography"
                              ),
                              h("span", { "className": "anti-patterns-sidebar-count" },
                                "11"
                              )
                            )
                          ),
                          h("li", {},
                            h("a", { "href": "#section-color-contrast" },
                              h("span", {},
                                "Color & Contrast"
                              ),
                              h("span", { "className": "anti-patterns-sidebar-count" },
                                "7"
                              )
                            )
                          ),
                          h("li", {},
                            h("a", { "href": "#section-layout-space" },
                              h("span", {},
                                "Layout & Space"
                              ),
                              h("span", { "className": "anti-patterns-sidebar-count" },
                                "12"
                              )
                            )
                          ),
                          h("li", {},
                            h("a", { "href": "#section-motion" },
                              h("span", {},
                                "Motion"
                              ),
                              h("span", { "className": "anti-patterns-sidebar-count" },
                                "6"
                              )
                            )
                          ),
                          h("li", {},
                            h("a", { "href": "#section-copy" },
                              h("span", {},
                                "Copy"
                              ),
                              h("span", { "className": "anti-patterns-sidebar-count" },
                                "5"
                              )
                            )
                          ),
                          h("li", {},
                            h("a", { "href": "#section-imagery" },
                              h("span", {},
                                "Imagery"
                              ),
                              h("span", { "className": "anti-patterns-sidebar-count" },
                                "4"
                              )
                            )
                          ),
                          h("li", {},
                            h("a", { "href": "#section-general-quality" },
                              h("span", {},
                                "General quality"
                              ),
                              h("span", { "className": "anti-patterns-sidebar-count" },
                                "10"
                              )
                            )
                          )
                        )
                      ),
                      h("li", {},
                        h("a", { "href": "#run-it" },
                          h("span", {},
                            "Run it yourself"
                          )
                        )
                      )
                    )
                  )
                )
              ),
              h("div", { "className": "skills-main" },
                h("div", { "className": "anti-patterns-content slop-content" },
                  h("header", { "className": "anti-patterns-header slop-header" },
                    h("h1", { "className": "sub-page-title" },
                      "Slop"
                    ),
                    h("p", { "className": "sub-page-lede" },
                      "AI slop changes with the era and the model. The design checker keeps up, so you don\u2019t have to spot every new tell yourself."
                    )
                  ),
                  h("section", { "className": "slop-section slop-then-now", "id": "see-it", "aria-label": "Detection overlay demo" },
                    h("h2", { "className": "slop-section-heading" },
                      "New eras. Familiar model habits."
                    ),
                    h("div", { "className": "slop-then-now-intro" },
                      h("p", { "className": "slop-then-now-lede" },
                        "Trends change, and models have their own defaults. Compare purple gradients, beige editorial layouts, and a GPT-style neobrutalist take on the same fictional product. The design checker\u2019s guidance and checks evolve with both."
                      ),
                      h("div", { "className": "slop-era-toggle ks-instrument-strip is-paper has-thumb", "role": "tablist", "aria-label": "Compare eras and model habits", "data-thumb": "1" },
                        h("button", { "id": "slop-era-2022", "className": "ks-instrument-key slop-era-tab is-active", "type": "button", "role": "tab", "aria-controls": "slop-example-2022", "aria-selected": "true", "data-era": "2022", "data-track": "slop_era_selected", "data-track-era": "2022" },
                          "2022"
                        ),
                        h("button", { "id": "slop-era-2025", "className": "ks-instrument-key slop-era-tab", "type": "button", "role": "tab", "aria-controls": "slop-example-2025", "aria-selected": "false", "tabIndex": "-1", "data-era": "2025", "data-track": "slop_era_selected", "data-track-era": "2025" },
                          "2025"
                        ),
                        h("button", { "id": "slop-era-2026", "className": "ks-instrument-key slop-era-tab", "type": "button", "role": "tab", "aria-controls": "slop-example-2026", "aria-selected": "false", "tabIndex": "-1", "data-era": "2026", "data-track": "slop_era_selected", "data-track-era": "2026" },
                          "2026"
                        ),
                        h("span", { "className": "ks-thumb", "aria-hidden": "true", "style": cssStyle("width: 69.77px; transform: translateX(3px);") })
                      )
                    ),
                    h("div", { "className": "visual-mode-preview" },
                      h("div", { "className": "visual-mode-preview-header" },
                        h("span", { "className": "visual-mode-preview-dot red" }),
                        h("span", { "className": "visual-mode-preview-dot yellow" }),
                        h("span", { "className": "visual-mode-preview-dot green" }),
                        h("span", { "className": "visual-mode-preview-title", "data-title-2022": "Purple gradients, glass panels, neon glow", "data-title-2025": "Beige backgrounds, editorial labels, decorative motion", "data-title-2026": "GPT-style neobrutalism: bold borders, hard shadows, sticker badges" },
                          "Purple gradients, glass panels, neon glow"
                        )
                      ),
                      h("div", { "id": "slop-example-2022", "className": "visual-mode-frame slop-era-frame ai-slop-era-panel", "data-era": "2022" },
                        h("img", { "src": "ai-slop/antipattern_images/purple_gradients.png", "alt": "2022-era AI slop example", "loading": "lazy" }),
                        h("p", null,
                          "Purple gradients, glass panels, neon glow"
                        )
                      ),
                      h("div", { "id": "slop-example-2025", "className": "visual-mode-frame slop-era-frame ai-slop-era-panel", "data-era": "2025", "style": cssStyle("display:none") },
                        h("img", { "src": "ai-slop/antipattern_images/layout_templates.png", "alt": "2025-era AI slop example", "loading": "lazy" }),
                        h("p", null,
                          "Beige backgrounds, editorial labels, decorative motion"
                        )
                      ),
                      h("div", { "id": "slop-example-2026", "className": "visual-mode-frame slop-era-frame ai-slop-era-panel", "data-era": "2026", "style": cssStyle("display:none") },
                        h("img", { "src": "ai-slop/antipattern_images/thick_border_cards.png", "alt": "2026-era AI slop example", "loading": "lazy" }),
                        h("p", null,
                          "GPT-style neobrutalism: bold borders, hard shadows, sticker badges"
                        )
                      )
                    ),
                    h("p", { "className": "visual-mode-demo-caption" },
                      "These examples exaggerate habits from different eras and models. Switch tabs to see what the design checker catches in each. Hover or tap an outlined element to read the finding. Page-wide findings appear in the top bar."
                    )
                  ),
                  h("section", { "className": "slop-section visual-mode-gallery", "id": "try-it-live", "aria-label": "Explore the example pages" },
                    h("header", { "className": "visual-mode-gallery-header" },
                      h("h2", { "className": "slop-section-heading" },
                        "Explore the examples"
                      ),
                      h("p", { "className": "visual-mode-gallery-lede" },
                        "Open an example to inspect the page with the detector overlay. Each one deliberately exaggerates a design habit."
                      )
                    ),
                    h("div", { "className": "gallery-grid" },
                      h("a", { "className": "gallery-card", "href": "ai-slop/antipattern_images/purple_gradients.png", "target": "_blank", "rel": "noreferrer" },
                        h("div", { "className": "gallery-card-thumb" },
                          h("img", { "src": "ai-slop/antipattern_images/purple_gradients.png", "alt": "", "loading": "lazy", "width": "540", "height": "540" })
                        ),
                        h("div", { "className": "gallery-card-body" },
                          h("h3", { "className": "gallery-card-title" },
                            "Purple Gradients Everywhere"
                          ),
                          h("p", { "className": "gallery-card-desc" },
                            "Purple-to-blue gradients compete across buttons, text, and backgrounds."
                          )
                        )
                      ),
                      h("a", { "className": "gallery-card", "href": "ai-slop/antipattern_images/lazy_cool.png", "target": "_blank", "rel": "noreferrer" },
                        h("div", { "className": "gallery-card-thumb" },
                          h("img", { "src": "ai-slop/antipattern_images/lazy_cool.png", "alt": "", "loading": "lazy", "width": "540", "height": "540" })
                        ),
                        h("div", { "className": "gallery-card-body" },
                          h("h3", { "className": "gallery-card-title" },
                            "Lazy \"Cool\""
                          ),
                          h("p", { "className": "gallery-card-desc" },
                            "Glass panels, neon edges, and glowing orbs pile up without helping you use the page."
                          )
                        )
                      ),
                      h("a", { "className": "gallery-card", "href": "ai-slop/antipattern_images/lazy_impact.png", "target": "_blank", "rel": "noreferrer" },
                        h("div", { "className": "gallery-card-thumb" },
                          h("img", { "src": "ai-slop/antipattern_images/lazy_impact.png", "alt": "", "loading": "lazy", "width": "540", "height": "540" })
                        ),
                        h("div", { "className": "gallery-card-body" },
                          h("h3", { "className": "gallery-card-title" },
                            "Lazy \"Impact\""
                          ),
                          h("p", { "className": "gallery-card-desc" },
                            "Buttons bounce, icons wiggle, and badges float. Everything asks for attention at once."
                          )
                        )
                      ),
                      h("a", { "className": "gallery-card", "href": "ai-slop/antipattern_images/thick_border_cards.png", "target": "_blank", "rel": "noreferrer" },
                        h("div", { "className": "gallery-card-thumb" },
                          h("img", { "src": "ai-slop/antipattern_images/thick_border_cards.png", "alt": "", "loading": "lazy", "width": "540", "height": "540" })
                        ),
                        h("div", { "className": "gallery-card-body" },
                          h("h3", { "className": "gallery-card-title" },
                            "Side-Tab Cards"
                          ),
                          h("p", { "className": "gallery-card-desc" },
                            "A colored stripe decorates every rounded card, without marking anything useful."
                          )
                        )
                      ),
                      h("a", { "className": "gallery-card", "href": "ai-slop/antipattern_images/cardocalypse.png", "target": "_blank", "rel": "noreferrer" },
                        h("div", { "className": "gallery-card-thumb" },
                          h("img", { "src": "ai-slop/antipattern_images/cardocalypse.png", "alt": "", "loading": "lazy", "width": "540", "height": "540" })
                        ),
                        h("div", { "className": "gallery-card-body" },
                          h("h3", { "className": "gallery-card-title" },
                            "Cardocalypse"
                          ),
                          h("p", { "className": "gallery-card-desc" },
                            "Five layers of cards add padding and shadows around the same content. Each layer leaves less room for the task."
                          )
                        )
                      ),
                      h("a", { "className": "gallery-card", "href": "ai-slop/antipattern_images/layout_templates.png", "target": "_blank", "rel": "noreferrer" },
                        h("div", { "className": "gallery-card-thumb" },
                          h("img", { "src": "ai-slop/antipattern_images/layout_templates.png", "alt": "", "loading": "lazy", "width": "540", "height": "540" })
                        ),
                        h("div", { "className": "gallery-card-body" },
                          h("h3", { "className": "gallery-card-title" },
                            "Copy-Paste Layouts"
                          ),
                          h("p", { "className": "gallery-card-desc" },
                            "The same hero, metrics, and feature grid repeat with different colors. The layout barely responds to the content."
                          )
                        )
                      ),
                      h("a", { "className": "gallery-card", "href": "ai-slop/antipattern_images/inter_everywhere.png", "target": "_blank", "rel": "noreferrer" },
                        h("div", { "className": "gallery-card-thumb" },
                          h("img", { "src": "ai-slop/antipattern_images/inter_everywhere.png", "alt": "", "loading": "lazy", "width": "540", "height": "540" })
                        ),
                        h("div", { "className": "gallery-card-body" },
                          h("h3", { "className": "gallery-card-title" },
                            "Inter Everywhere"
                          ),
                          h("p", { "className": "gallery-card-desc" },
                            "Inter everywhere, paired with an interchangeable product pitch. Typography should help give this product a voice."
                          )
                        )
                      ),
                      h("a", { "className": "gallery-card", "href": "ai-slop/antipattern_images/massive_icons.png", "target": "_blank", "rel": "noreferrer" },
                        h("div", { "className": "gallery-card-thumb" },
                          h("img", { "src": "ai-slop/antipattern_images/massive_icons.png", "alt": "", "loading": "lazy", "width": "540", "height": "540" })
                        ),
                        h("div", { "className": "gallery-card-body" },
                          h("h3", { "className": "gallery-card-title" },
                            "Massive Icons"
                          ),
                          h("p", { "className": "gallery-card-desc" },
                            "Oversized icon tiles make decoration more prominent than the feature it introduces."
                          )
                        )
                      ),
                      h("a", { "className": "gallery-card", "href": "ai-slop/antipattern_images/bad_contrast.png", "target": "_blank", "rel": "noreferrer" },
                        h("div", { "className": "gallery-card-thumb" },
                          h("img", { "src": "ai-slop/antipattern_images/bad_contrast.png", "alt": "", "loading": "lazy", "width": "540", "height": "540" })
                        ),
                        h("div", { "className": "gallery-card-body" },
                          h("h3", { "className": "gallery-card-title" },
                            "Bad Contrast Choices"
                          ),
                          h("p", { "className": "gallery-card-desc" },
                            "Low-contrast text gets lost against its background, especially in small labels."
                          )
                        )
                      ),
                      h("a", { "className": "gallery-card", "href": "ai-slop/antipattern_images/redundant_ux_writing.png", "target": "_blank", "rel": "noreferrer" },
                        h("div", { "className": "gallery-card-thumb" },
                          h("img", { "src": "ai-slop/antipattern_images/redundant_ux_writing.png", "alt": "", "loading": "lazy", "width": "540", "height": "540" })
                        ),
                        h("div", { "className": "gallery-card-body" },
                          h("h3", { "className": "gallery-card-title" },
                            "Redundant UX Writing"
                          ),
                          h("p", { "className": "gallery-card-desc" },
                            "Four bits of text explain the same field. Repetition adds reading without helping you decide what to enter."
                          )
                        )
                      ),
                      h("a", { "className": "gallery-card", "href": "ai-slop/antipattern_images/modal_abuse.png", "target": "_blank", "rel": "noreferrer" },
                        h("div", { "className": "gallery-card-thumb" },
                          h("img", { "src": "ai-slop/antipattern_images/modal_abuse.png", "alt": "", "loading": "lazy", "width": "540", "height": "540" })
                        ),
                        h("div", { "className": "gallery-card-body" },
                          h("h3", { "className": "gallery-card-title" },
                            "Modal Abuse"
                          ),
                          h("p", { "className": "gallery-card-desc" },
                            "Three columns of settings crowd into a scrolling dialog. A dedicated page would give the task room."
                          )
                        )
                      )
                    )
                  ),
                  h("section", { "className": "slop-section slop-catalog", "id": "catalog", "aria-label": "Rule catalog" },
                    h("header", { "className": "slop-catalog-header" },
                      h("h2", { "className": "slop-section-heading" },
                        "The catalog"
                      ),
                      h("p", { "className": "slop-catalog-lede" },
                        "Patterns to recognize, with examples and ways to improve them. ",
                        h("strong", {},
                          "AI slop"
                        ),
                        " covers familiar AI design habits. ",
                        h("strong", {},
                          "Quality"
                        ),
                        " covers problems that make an interface harder to use. ",
                        h("strong", {},
                          "Your design system"
                        ),
                        " checks choices against your project\u2019s own standards."
                      )
                    ),
                    h("details", { "className": "anti-patterns-legend" },
                      h("summary", { "className": "anti-patterns-legend-summary" },
                        h("span", { "className": "anti-patterns-legend-title" },
                          "How the design checker checks these patterns"
                        ),
                        h("svg", { "className": "anti-patterns-legend-chevron", "width": "14", "height": "14", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": "2.5", "aria-hidden": "true" },
                          h("path", { "d": "M6 9l6 6 6-6" })
                        )
                      ),
                      h("div", { "className": "anti-patterns-legend-body" },
                        h("dl", { "className": "anti-patterns-legend-layers" },
                          h("div", {},
                            h("dt", {},
                              h("span", { "className": "rule-card-layer", "data-layer": "cli" },
                                "Source"
                              )
                            ),
                            h("dd", {},
                              "Checks code and styles. Run the detector on a file or folder; no browser needed."
                            )
                          ),
                          h("div", {},
                            h("dt", {},
                              h("span", { "className": "rule-card-layer", "data-layer": "browser" },
                                "Browser"
                              )
                            ),
                            h("dd", {},
                              "Checks the rendered page. Use the Chrome extension or give the detector a URL."
                            )
                          ),
                          h("div", {},
                            h("dt", {},
                              h("span", { "className": "rule-card-layer", "data-layer": "llm" },
                                "Design review"
                              )
                            ),
                            h("dd", {},
                              "Needs a judgment about the design and its purpose. Ask the design checker for a ",
                              h("a", { "href": "#catalog" },
                                "critique"
                              ),
                              "."
                            )
                          )
                        ),
                        h("p", {},
                          "The catalog includes ",
                          h("strong", {},
                            "61 detector rules and 6 patterns for design review"
                          ),
                          ". A finding is a reason to look closer: consider the page, the task, and any intentional design choices."
                        )
                      )
                    ),
                    h("div", { "className": "anti-patterns-sections" },
                      h("section", { "className": "anti-patterns-section anti-patterns-section--personalized", "id": "section-design-system" },
                        h("header", { "className": "anti-patterns-section-header" },
                          h("div", {},
                            h("h3", { "className": "anti-patterns-section-title" },
                              "Your design system"
                            ),
                            h("p", { "className": "anti-patterns-section-lede" },
                              "With ",
                              h("code", {},
                                "DESIGN.md"
                              ),
                              " in your project, the design checker checks for fonts, colors, type sizes, and corner radii that fall outside your documented system. ",
                              h("a", { "href": "#catalog" },
                                "Set up design-system checks"
                              ),
                              "."
                            )
                          ),
                          h("p", { "className": "anti-patterns-section-count" },
                            "4 rules"
                          )
                        ),
                        h("div", { "className": "rule-card-grid" },
                          h("article", { "className": "rule-card", "id": "rule-design-system-font", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--token" },
                                  h("span", null,
                                    "Typography"
                                  ),
                                  h("strong", { "style": cssStyle("font-family:Georgia,serif") },
                                    "Aa"
                                  ),
                                  h("code", null,
                                    "Comic Sans MS"
                                  ),
                                  h("i", null,
                                    "outside DESIGN.md"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "personalized" },
                                  "Your design system"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Font outside DESIGN.md"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "This font is not in your documented type system. Use an approved font, or update DESIGN.md if the addition is intentional."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Design-system checks"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-design-system-color", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--swatches" },
                                  h("span", { "style": cssStyle("background:#d4a72c") }),
                                  h("span", { "style": cssStyle("background:#5c9b8f") }),
                                  h("span", { "className": "is-outlier", "style": cssStyle("background:#b026ff") })
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "personalized" },
                                  "Your design system"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Color outside DESIGN.md"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "This color falls outside your documented palette. Use a palette color, or add the new color to your design system."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Design-system checks"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-design-system-radius", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--radius" },
                                  h("span", { "style": cssStyle("border-radius:4px") },
                                    "4"
                                  ),
                                  h("span", { "style": cssStyle("border-radius:8px") },
                                    "8"
                                  ),
                                  h("span", { "className": "is-outlier", "style": cssStyle("border-radius:28px") },
                                    "28"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "personalized" },
                                  "Your design system"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Radius outside DESIGN.md"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "This corner radius is not in your documented scale. Use an existing radius, or update the system to include the new shape."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Design-system checks"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-design-system-font-size", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--scale" },
                                  h("span", null,
                                    "14"
                                  ),
                                  h("span", null,
                                    "16"
                                  ),
                                  h("span", null,
                                    "24"
                                  ),
                                  h("b", null,
                                    "19"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "personalized" },
                                  "Your design system"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Font size outside DESIGN.md"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "This font size is not in your documented type scale. Use an existing size, or add a new step to the system."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Design-system checks"
                              )
                            )
                          )
                        )
                      ),
                      h("section", { "className": "anti-patterns-section", "id": "section-visual-details" },
                        h("header", { "className": "anti-patterns-section-header" },
                          h("h3", { "className": "anti-patterns-section-title" },
                            "Visual Details"
                          ),
                          h("p", { "className": "anti-patterns-section-count" },
                            "8 rules"
                          )
                        ),
                        h("div", { "className": "rule-card-grid" },
                          h("article", { "className": "rule-card", "id": "rule-codex-grid-background", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo", "style": cssStyle("background-image:linear-gradient(rgba(70,80,90,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(70,80,90,.16) 1px,transparent 1px);background-size:18px 18px;display:grid;place-items:center") },
                                  h("span", { "style": cssStyle("background:#fff;border:1px solid #ddd;padding:9px 14px;font:600 12px system-ui;color:#222") },
                                    "Decorative grid"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Decorative grid-line background"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A decorative grid adds lines without helping people use the page. Keep grids for canvases, maps, or tasks that need measurement."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Layout guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-border-accent-on-rounded", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("background: #fff; border: 2px solid oklch(60% 0.22 290); border-radius: 16px; padding: 14px 18px; width: 220px; font-family: system-ui, sans-serif; font-size: 13px; color: #111;") },
                                  h("div", { "style": cssStyle("font-weight: 600;") },
                                    "Rounded card"
                                  ),
                                  h("div", { "style": cssStyle("color: #666; font-size: 12px;") },
                                    "Thick colored border clashes with the radius."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Border accent on rounded element"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A thick colored border makes a rounded card\u2019s outline compete with its content. Try a lighter border, or let the background define the card."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Polish guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-glassmorphism", "data-layer": "llm" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("position: relative; width: 100%; height: 100%; background: linear-gradient(135deg, oklch(70% 0.22 265), oklch(70% 0.25 340)); border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center;") },
                                  h("div", { "style": cssStyle("background: rgba(255,255,255,0.25); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.4); border-radius: 10px; padding: 14px 18px; color: #fff; font-family: system-ui, sans-serif; font-size: 12px; font-weight: 600; box-shadow: 0 8px 30px rgba(0,0,0,0.12);") },
                                    "Frosted glass card"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "llm", "title": "Assessed during critique; not an automated detector rule." },
                                  "Design review"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Glassmorphism everywhere"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Blur effects, glass cards, and glow borders used as decoration rather than to solve a real layering problem."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Critique guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-side-tab", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("background: #fff; border: 1px solid #e8e4df; border-left: 4px solid oklch(60% 0.22 265); border-radius: 6px; padding: 14px 16px; width: 220px; font-family: system-ui, sans-serif; font-size: 13px; color: #111;") },
                                  h("div", { "style": cssStyle("font-weight: 600; margin-bottom: 4px;") },
                                    "Alert title"
                                  ),
                                  h("div", { "style": cssStyle("color: #666; font-size: 12px;") },
                                    "Thick colored stripe on one side."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Side-tab accent border"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A thick colored stripe turns an ordinary card into something that looks like an alert. Remove it when there is no status or warning to communicate."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Polish guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-gpt-thin-border-wide-shadow", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("background: #fff; border: 1px solid #9aa0a6; border-radius: 10px; padding: 14px 18px; width: 200px; box-shadow: 0 0 30px rgba(0,0,0,0.22); font-family: system-ui, sans-serif;") },
                                  h("div", { "style": cssStyle("font-weight: 600; font-size: 13px; color: #111;") },
                                    "Ghost card"
                                  ),
                                  h("div", { "style": cssStyle("font-size: 11px; color: #888;") },
                                    "1px hairline plus a wide soft shadow."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Hairline border with wide shadow"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A thin border and a broad shadow both define the same card. Choose the edge or the shadow to give the surface a clearer shape."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Polish guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-repeating-stripes-gradient", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--surface", "style": cssStyle("background: repeating-linear-gradient(45deg, oklch(93% 0.02 80), oklch(93% 0.02 80) 10px, oklch(88% 0.04 80) 10px, oklch(88% 0.04 80) 20px);") })
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Repeating-gradient stripes"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Repeating stripes fill empty space with visual noise. Use a plain surface, or a texture that belongs to the design."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Polish guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-over-round", "data-layer": "llm" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("background: #fff; border: 1px solid #e8e4df; border-radius: 44px; padding: 18px 24px; width: 200px; font-family: system-ui, sans-serif;") },
                                  h("div", { "style": cssStyle("font-weight: 600; font-size: 13px; color: #111;") },
                                    "44px radius"
                                  ),
                                  h("div", { "style": cssStyle("font-size: 11px; color: #888;") },
                                    "A small card rounded into a blob."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "llm", "title": "Assessed during critique; not an automated detector rule." },
                                  "Design review"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Extreme border-radius on cards"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Large corner radii can squeeze the content and make every card look alike. Reduce the curve to suit the card\u2019s size and give its contents room."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Critique guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-sketchy-svg", "data-layer": "llm" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; gap: 6px;") },
                                  h("svg", { "width": "110", "height": "70", "viewBox": "0 0 110 70", "fill": "none", "stroke": "#bbb", "strokeWidth": "2", "strokeLinecap": "round" },
                                    h("path", { "d": "M22 56 q6 -34 32 -32 q26 2 30 30" }),
                                    h("circle", { "cx": "44", "cy": "30", "r": "3", "fill": "#bbb", "stroke": "none" }),
                                    h("circle", { "cx": "62", "cy": "29", "r": "3", "fill": "#bbb", "stroke": "none" }),
                                    h("path", { "d": "M46 40 q8 6 16 0" }),
                                    h("path", { "d": "M30 60 l-6 8 M78 58 l7 9" })
                                  ),
                                  h("div", { "style": cssStyle("font-size: 10px; color: #888;") },
                                    "A crude hand-coded mascot."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "llm", "title": "Assessed during critique; not an automated detector rule." },
                                  "Design review"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Rough SVG illustrations"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A hastily drawn mascot or scene can make a finished page feel unfinished. Use a well-made illustration or photo, or leave it out."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Critique guide"
                              )
                            )
                          )
                        )
                      ),
                      h("section", { "className": "anti-patterns-section", "id": "section-typography" },
                        h("header", { "className": "anti-patterns-section-header" },
                          h("h3", { "className": "anti-patterns-section-title" },
                            "Typography"
                          ),
                          h("p", { "className": "anti-patterns-section-count" },
                            "11 rules"
                          )
                        ),
                        h("div", { "className": "rule-card-grid" },
                          h("article", { "className": "rule-card", "id": "rule-kicker-above-heading", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo", "style": cssStyle("font-family:system-ui,sans-serif;color:#111") },
                                  h("div", { "style": cssStyle("font-size:9px;text-transform:uppercase;letter-spacing:.18em;color:#999") },
                                    "Features"
                                  ),
                                  h("div", { "style": cssStyle("font-size:15px;font-weight:600;margin-top:3px") },
                                    "What you get"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Label above a heading"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A small label above a heading adds another line to read. Remove it if it repeats the heading, or work the useful words into the heading itself."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-undersized-ui-text", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo", "style": cssStyle("font-family:system-ui,sans-serif;color:#111;display:flex;gap:14px;align-items:baseline") },
                                  h("span", { "style": cssStyle("font-size:8px;color:#666") },
                                    "Terms"
                                  ),
                                  h("span", { "style": cssStyle("font-size:8px;color:#666") },
                                    "Privacy"
                                  ),
                                  h("span", { "style": cssStyle("font-size:8px;color:#666") },
                                    "Status"
                                  ),
                                  h("span", { "style": cssStyle("font-size:15px;color:#111;margin-left:6px") },
                                    "Aa"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Tiny interface text"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Navigation, links, and controls are hard to use when their text is too small. Increase the size so people can read them without zooming."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-flat-type-hierarchy", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; color: #111; line-height: 1.3;") },
                                  h("div", { "style": cssStyle("font-size: 17px; font-weight: 600;") },
                                    "Heading"
                                  ),
                                  h("div", { "style": cssStyle("font-size: 16px; font-weight: 500; margin: 2px 0;") },
                                    "Subheading"
                                  ),
                                  h("div", { "style": cssStyle("font-size: 15px; color: #555;") },
                                    "Body text at almost the same size."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Flat type hierarchy"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Headings and body text look too similar, making the page hard to scan. Give them clearer differences in size, weight, or spacing."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-icon-tile-stack", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; color: #111;") },
                                  h("div", { "style": cssStyle("width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, oklch(62% 0.22 265), oklch(70% 0.20 320)); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; margin-bottom: 10px;") },
                                    "\u2726"
                                  ),
                                  h("div", { "style": cssStyle("font-size: 14px; font-weight: 600; margin-bottom: 2px;") },
                                    "Feature name"
                                  ),
                                  h("div", { "style": cssStyle("font-size: 12px; color: #666;") },
                                    "Rounded icon tile above heading."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Icon tile stacked above heading"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "An icon in a rounded square above a heading is a familiar AI feature-card pattern. Try placing the icon beside the heading, or remove its container."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-italic-serif-display", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 32px; font-weight: 500; color: #111; line-height: 1.05;") },
                                  "Beautifully",
                                  h("br", {}),
                                  "Crafted"
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Italic serif display headline"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "An oversized italic serif headline is a familiar shortcut to an editorial look. Choose a type style that fits the product\u2019s character, rather than borrowing the same one by default."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-hero-eyebrow-chip", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; color: #111;") },
                                  h("div", { "style": cssStyle("display: inline-block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: oklch(60% 0.18 265); background: oklch(60% 0.18 265 / 0.12); padding: 3px 8px; border-radius: 999px; margin-bottom: 8px;") },
                                    "Introducing"
                                  ),
                                  h("div", { "style": cssStyle("font-size: 22px; font-weight: 700;") },
                                    "The hero headline"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Badge above the main headline"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A small pill above the headline can look clickable and compete with the message. Remove it if it adds little, or put useful information in the headline or supporting text."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-oversized-h1", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner", "style": cssStyle("align-items: stretch;") },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; font-size: 58px; font-weight: 800; color: #111; line-height: 0.95; letter-spacing: -0.02em; padding: 12px 14px;") },
                                  "Everything your whole team needs to ship faster"
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Oversized hero headline"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A long headline at display size can fill the first screen by itself. Shorten it or reduce the size so the page has room to explain the offer and show what to do next."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-extreme-negative-tracking", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; font-size: 34px; font-weight: 700; color: #111; letter-spacing: -0.14em; line-height: 1.1;") },
                                  "Crushed Together"
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Crushed letter spacing"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Letters pushed too close together become hard to distinguish. Loosen the spacing until each character is clear, especially at smaller screen sizes."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-overused-font", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: Inter, system-ui, sans-serif; font-size: 15px; color: #111; line-height: 1.4;") },
                                  h("div", { "style": cssStyle("font-weight: 600; margin-bottom: 4px;") },
                                    "Just another Inter headline"
                                  ),
                                  h("div", { "style": cssStyle("color: #555; font-size: 13px;") },
                                    "Every SaaS homepage looks like this."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Overused font"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Familiar defaults such as Inter and Geist can make unrelated products look alike. Choose typography for the product\u2019s character and reading needs, and keep established brand fonts when they fit."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-single-font", "data-layer": "llm" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; font-size: 14px; color: #111;") },
                                  h("div", { "style": cssStyle("font-size: 19px; font-weight: 600; margin-bottom: 6px;") },
                                    "Heading in the body font"
                                  ),
                                  h("div", { "style": cssStyle("color: #555;") },
                                    "Same family. Different size and weight."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "llm", "title": "Assessed during critique; not an automated detector rule." },
                                  "Design review"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Single font for everything"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "One font family can work well across a whole page. If everything feels flat, vary size, weight, and spacing before deciding whether a second family would help."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-all-caps-body", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; color: #111; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; line-height: 1.5;") },
                                  "Long passages in uppercase are hard to read. We recognize words by their shape, which all-caps removes."
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "All-caps body text"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Long passages in capitals are tiring to read. Use sentence case for body text, and keep uppercase for short labels or headings."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          )
                        )
                      ),
                      h("section", { "className": "anti-patterns-section", "id": "section-color-contrast" },
                        h("header", { "className": "anti-patterns-section-header" },
                          h("h3", { "className": "anti-patterns-section-title" },
                            "Color & Contrast"
                          ),
                          h("p", { "className": "anti-patterns-section-count" },
                            "7 rules"
                          )
                        ),
                        h("div", { "className": "rule-card-grid" },
                          h("article", { "className": "rule-card", "id": "rule-radial-halo", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo", "style": cssStyle("background:radial-gradient(circle at 50% 45%,rgba(130,92,246,.62),rgba(130,92,246,0) 58%),#101014;color:#fff;display:grid;place-items:center;font:600 16px system-ui") },
                                  "Ambient glow"
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Radial-gradient background halo"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A bright halo on a dark page is a familiar AI background effect. Remove the glow when it competes with the content or has no role in the design."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Colorize guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-radial-spotlight-glow", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo", "style": cssStyle("min-height:124px;background:radial-gradient(ellipse at 50% 45%,rgba(145,110,225,.20),rgba(145,110,225,0) 70%),#faf9f7;display:grid;place-items:center;font:600 16px system-ui;color:#222") },
                                  "A soft spotlight"
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Soft spotlight behind content"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A faint glow behind a section adds emphasis without explaining what matters. Use spacing, contrast, or a clear heading to guide attention."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Colorize guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-ai-color-palette", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("display: flex; gap: 6px;") },
                                  h("div", { "style": cssStyle("width: 44px; height: 44px; border-radius: 6px; background: oklch(60% 0.22 265);") }),
                                  h("div", { "style": cssStyle("width: 44px; height: 44px; border-radius: 6px; background: oklch(62% 0.25 300);") }),
                                  h("div", { "style": cssStyle("width: 44px; height: 44px; border-radius: 6px; background: oklch(64% 0.25 340);") }),
                                  h("div", { "style": cssStyle("width: 44px; height: 44px; border-radius: 6px; background: oklch(70% 0.20 200);") })
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "AI color palette"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Purple gradients and bright cyan on dark backgrounds are familiar AI defaults. Build the palette around the product\u2019s identity and how people will use it."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Colorize guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-dark-glow", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--surface", "style": cssStyle("background: #0a0b14; font-family: system-ui, sans-serif;") },
                                  h("div", { "style": cssStyle("color: oklch(78% 0.22 280); text-shadow: 0 0 12px oklch(78% 0.22 280 / 0.7); font-size: 16px; font-weight: 600;") },
                                    "Neon on dark"
                                  ),
                                  h("div", { "style": cssStyle("color: oklch(60% 0.12 260); font-size: 12px; margin-top: 4px;") },
                                    "Cyberpunk-by-default slop."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Dark mode with glowing accents"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Glowing borders and accents can turn a dark interface into a wall of neon. Keep the dark theme if it suits the product, and reduce the glow so useful information stands out."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Colorize guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-gradient-text", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif;") },
                                  h("div", { "style": cssStyle("font-size: 28px; font-weight: 700; background: linear-gradient(135deg, oklch(65% 0.25 320), oklch(60% 0.25 265)); -webkit-background-clip: text; background-clip: text; color: transparent; line-height: 1.1;") },
                                    "Build the Future"
                                  ),
                                  h("div", { "style": cssStyle("font-size: 12px; color: #888; margin-top: 4px;") },
                                    "Color changes across the headline."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Gradient text"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A gradient makes color change across a heading or number, often just for decoration. Try one solid color and use size or weight for emphasis."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Colorize guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-gray-on-color", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--surface", "style": cssStyle("background: oklch(60% 0.20 265); font-family: system-ui, sans-serif;") },
                                  h("div", { "style": cssStyle("color: #9ca3af; font-size: 13px; line-height: 1.5;") },
                                    "Gray text on a colored background. Washed out and hard to read."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Gray text on colored background"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Neutral gray text can look washed out on a colored surface. Try a darker tint or a light text color, then check the contrast against the actual background."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Colorize guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-cream-palette", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--surface", "style": cssStyle("background: #f5efe2; font-family: Georgia, serif;") },
                                  h("div", { "style": cssStyle("font-size: 17px; font-weight: 600; color: #2a2622; margin-bottom: 4px;") },
                                    "The tasteful default"
                                  ),
                                  h("div", { "style": cssStyle("font-size: 12px; color: #6b6358;") },
                                    "Warm cream surface, reached for by reflex."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Cream / beige palette"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Cream and beige can become a default substitute for a considered palette. Keep them when they belong to the product, and choose the rest of the colors with equal care."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Colorize guide"
                              )
                            )
                          )
                        )
                      ),
                      h("section", { "className": "anti-patterns-section", "id": "section-layout-space" },
                        h("header", { "className": "anti-patterns-section-header" },
                          h("h3", { "className": "anti-patterns-section-title" },
                            "Layout & Space"
                          ),
                          h("p", { "className": "anti-patterns-section-count" },
                            "12 rules"
                          )
                        ),
                        h("div", { "className": "rule-card-grid" },
                          h("article", { "className": "rule-card", "id": "rule-numbered-section-labels", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--numbers" },
                                  h("span", null,
                                    h("i", null,
                                      "01"
                                    ),
                                    "Discover"
                                  ),
                                  h("span", null,
                                    h("i", null,
                                      "02"
                                    ),
                                    "Design"
                                  ),
                                  h("span", null,
                                    h("i", null,
                                      "03"
                                    ),
                                    "Deliver"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Tiny numbered section labels"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Tiny numbers beside headings add clutter when there is no sequence to follow. Keep numbering for steps or an order that matters."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Layout guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-edge-flush-cards", "data-layer": "browser" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--scroller" },
                                  h("span", null),
                                  h("span", null),
                                  h("span", null)
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "browser", "title": "Checks the rendered page through the extension or a detector URL scan." },
                                  "Browser"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Cards flush against the scroller edge"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Cards meet the scroller\u2019s edge without room around them. Add matching space at both ends so the first and last cards have a clear boundary."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Layout guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-text-occlusion", "data-layer": "browser" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--occlusion" },
                                  h("strong", null,
                                    "Words should stay readable."
                                  ),
                                  h("span", null)
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "browser", "title": "Checks the rendered page through the extension or a detector URL scan." },
                                  "Browser"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Text covered by another element"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "An opaque layer covers readable text. Move the layer or give the text clear space."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Harden guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-first-viewport-column-overflow", "data-layer": "browser" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--columns" },
                                  h("span", null),
                                  h("span", null)
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "browser", "title": "Checks the rendered page through the extension or a detector URL scan." },
                                  "Browser"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Unbalanced opening columns"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "One opening column extends far below the other, leaving a large gap. Rebalance the content, or move the longer section below both columns."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Layout guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-heading-rhythm", "data-layer": "browser" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--rhythm" },
                                  h("p", null),
                                  h("h4", null,
                                    "New section"
                                  ),
                                  h("span", null),
                                  h("span", null)
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "browser", "title": "Checks the rendered page through the extension or a detector URL scan." },
                                  "Browser"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Heading closer to the previous section"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A heading sits closer to the previous block than its own content. Give it more space above than below."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Layout guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-hero-metric-layout", "data-layer": "llm" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; text-align: left;") },
                                  h("div", { "style": cssStyle("font-size: 42px; font-weight: 800; background: linear-gradient(135deg, oklch(65% 0.25 265), oklch(65% 0.25 340)); -webkit-background-clip: text; background-clip: text; color: transparent; line-height: 1;") },
                                    "10M+"
                                  ),
                                  h("div", { "style": cssStyle("font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px;") },
                                    "Active users"
                                  ),
                                  h("div", { "style": cssStyle("display: flex; gap: 14px; margin-top: 10px; font-size: 10px; color: #555;") },
                                    h("span", {},
                                      h("strong", {},
                                        "99.9%"
                                      ),
                                      " uptime"
                                    ),
                                    h("span", {},
                                      h("strong", {},
                                        "200ms"
                                      ),
                                      " p50"
                                    )
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "llm", "title": "Assessed during critique; not an automated detector rule." },
                                  "Design review"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Hero metric layout"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A huge number with a small label and supporting stats is a familiar landing-page template. Lead with a metric when it helps explain the product, and give it enough context to mean something."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Critique guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-identical-card-grids", "data-layer": "llm" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-family: system-ui, sans-serif;") },
                                  h("div", { "style": cssStyle("background: #fff; border: 1px solid #e8e4df; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;") },
                                    h("div", { "style": cssStyle("width: 18px; height: 18px; background: oklch(62% 0.20 265); border-radius: 4px;") }),
                                    h("div", { "style": cssStyle("font-size: 10px; font-weight: 600; color: #111;") },
                                      "Feature"
                                    ),
                                    h("div", { "style": cssStyle("font-size: 9px; color: #888;") },
                                      "Short copy."
                                    )
                                  ),
                                  h("div", { "style": cssStyle("background: #fff; border: 1px solid #e8e4df; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;") },
                                    h("div", { "style": cssStyle("width: 18px; height: 18px; background: oklch(62% 0.20 265); border-radius: 4px;") }),
                                    h("div", { "style": cssStyle("font-size: 10px; font-weight: 600; color: #111;") },
                                      "Feature"
                                    ),
                                    h("div", { "style": cssStyle("font-size: 9px; color: #888;") },
                                      "Short copy."
                                    )
                                  ),
                                  h("div", { "style": cssStyle("background: #fff; border: 1px solid #e8e4df; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;") },
                                    h("div", { "style": cssStyle("width: 18px; height: 18px; background: oklch(62% 0.20 265); border-radius: 4px;") }),
                                    h("div", { "style": cssStyle("font-size: 10px; font-weight: 600; color: #111;") },
                                      "Feature"
                                    ),
                                    h("div", { "style": cssStyle("font-size: 9px; color: #888;") },
                                      "Short copy."
                                    )
                                  ),
                                  h("div", { "style": cssStyle("background: #fff; border: 1px solid #e8e4df; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;") },
                                    h("div", { "style": cssStyle("width: 18px; height: 18px; background: oklch(62% 0.20 265); border-radius: 4px;") }),
                                    h("div", { "style": cssStyle("font-size: 10px; font-weight: 600; color: #111;") },
                                      "Feature"
                                    ),
                                    h("div", { "style": cssStyle("font-size: 9px; color: #888;") },
                                      "Short copy."
                                    )
                                  ),
                                  h("div", { "style": cssStyle("background: #fff; border: 1px solid #e8e4df; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;") },
                                    h("div", { "style": cssStyle("width: 18px; height: 18px; background: oklch(62% 0.20 265); border-radius: 4px;") }),
                                    h("div", { "style": cssStyle("font-size: 10px; font-weight: 600; color: #111;") },
                                      "Feature"
                                    ),
                                    h("div", { "style": cssStyle("font-size: 9px; color: #888;") },
                                      "Short copy."
                                    )
                                  ),
                                  h("div", { "style": cssStyle("background: #fff; border: 1px solid #e8e4df; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;") },
                                    h("div", { "style": cssStyle("width: 18px; height: 18px; background: oklch(62% 0.20 265); border-radius: 4px;") }),
                                    h("div", { "style": cssStyle("font-size: 10px; font-weight: 600; color: #111;") },
                                      "Feature"
                                    ),
                                    h("div", { "style": cssStyle("font-size: 9px; color: #888;") },
                                      "Short copy."
                                    )
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "llm", "title": "Assessed during critique; not an automated detector rule." },
                                  "Design review"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Identical card grids"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Repeated icon, heading, and text cards give every point the same weight. Group related ideas and vary the layout when the content needs different treatment."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Layout guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-monotonous-spacing", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("display: flex; flex-direction: column; gap: 13px; width: 210px;") },
                                  h("div", { "style": cssStyle("height: 14px; background: #2f3338; border-radius: 3px; width: 70%;") }),
                                  h("div", { "style": cssStyle("height: 14px; background: #cfcabf; border-radius: 3px;") }),
                                  h("div", { "style": cssStyle("height: 14px; background: #cfcabf; border-radius: 3px;") }),
                                  h("div", { "style": cssStyle("height: 14px; background: #cfcabf; border-radius: 3px;") }),
                                  h("div", { "style": cssStyle("height: 14px; background: #cfcabf; border-radius: 3px; width: 85%;") })
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Monotonous spacing"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Equal gaps everywhere make it hard to tell what belongs together. Keep related items close and leave more space between separate groups."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Layout guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-nested-cards", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("background: #f5f3ef; border: 1px solid #e0dcd4; border-radius: 10px; padding: 10px;") },
                                  h("div", { "style": cssStyle("background: #fff; border: 1px solid #e8e4df; border-radius: 8px; padding: 10px;") },
                                    h("div", { "style": cssStyle("background: #f5f3ef; border: 1px solid #e8e4df; border-radius: 6px; padding: 8px; font-size: 12px; font-family: system-ui, sans-serif; color: #555;") },
                                      "Card inside card inside card."
                                    )
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Nested cards"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Cards inside cards create visual noise and excessive depth. Flatten the hierarchy: use spacing, typography, and dividers instead of nesting containers."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Layout guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-line-length", "data-layer": "browser" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner", "style": cssStyle("align-items: center; justify-content: flex-start;") },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; font-size: 12px; color: #111; line-height: 1.8; white-space: nowrap; padding-left: 14px;") },
                                  "This one line of running text keeps going",
                                  h("br", {}),
                                  "well past the comfortable measure of about",
                                  h("br", {}),
                                  "seventy-five characters before it ever wraps,",
                                  h("br", {}),
                                  "so the eye loses its place on the way back."
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "browser", "title": "Checks the rendered page. Use the Chrome extension or give the detector a URL." },
                                  "Browser"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Line length too long"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Long lines make it harder to find the start of the next line. Try a text width of 65\u201375 characters, then adjust for the font, content, and screen."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-text-overflow", "data-layer": "browser" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("width: 150px; border: 1px solid #e8e4df; border-radius: 6px; padding: 8px 10px; font-family: system-ui, sans-serif; font-size: 12px; color: #111; white-space: nowrap;") },
                                  "A long line of text that refuses to wrap and spills past its box"
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "browser", "title": "Checks the rendered page. Use the Chrome extension or give the detector a URL." },
                                  "Browser"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Content overflowing its container"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Content spills outside its container or makes the page scroll sideways. Let text wrap and elements shrink; use a scrolling region when the content needs one."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Harden guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-clipped-overflow-container", "data-layer": "browser" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("position: relative; width: 150px; height: 64px; border: 1px solid #e8e4df; border-radius: 6px; overflow: hidden; font-family: system-ui, sans-serif;") },
                                  h("div", { "style": cssStyle("padding: 8px 10px; font-size: 11px; font-weight: 600; color: #111;") },
                                    "Menu"
                                  ),
                                  h("div", { "style": cssStyle("position: absolute; top: 38px; left: 10px; width: 150px; background: #1a1a1a; color: #fff; font-size: 10px; padding: 6px 8px; border-radius: 4px;") },
                                    "Dropdown clipped by the box"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "browser", "title": "Checks the rendered page. Use the Chrome extension or give the detector a URL." },
                                  "Browser"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Clipped menus and popovers"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A container cuts off a menu, tooltip, or popover that needs to extend beyond it. Allow the overflow, or render that layer outside the clipping container."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Harden guide"
                              )
                            )
                          )
                        )
                      ),
                      h("section", { "className": "anti-patterns-section motion-paused", "id": "section-motion" },
                        h("header", { "className": "anti-patterns-section-header" },
                          h("h3", { "className": "anti-patterns-section-title" },
                            "Motion"
                          ),
                          h("p", { "className": "anti-patterns-section-count" },
                            "6 rules"
                          )
                        ),
                        h("div", { "className": "slop-motion-controls" },
                          h("button", { "type": "button", "data-motion-toggle": "", "disabled": true },
                            "Motion off"
                          ),
                          h("span", { "data-motion-note": "" },
                            "Motion is off to match your reduced-motion preference."
                          )
                        ),
                        h("div", { "className": "rule-card-grid" },
                          h("article", { "className": "rule-card", "id": "rule-pulsing-dot", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--center" },
                                  h("span", { "style": cssStyle("width:12px;height:12px;border-radius:50%;background:#20a37a;box-shadow:0 0 0 7px rgba(32,163,122,.14),0 0 0 14px rgba(32,163,122,.06)") }),
                                  h("span", { "style": cssStyle("font:600 12px system-ui;color:#222") },
                                    "Systems operational"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Pulsing status dot"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A pulsing status dot draws attention even when nothing changes. Keep static status still, and use motion to signal activity that matters."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Animate guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-blinking-cursor", "data-layer": "browser" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--terminal" },
                                  h("span", null,
                                    "> Building the future"
                                  ),
                                  h("b", { "style": cssStyle("display:inline-block;width:8px;height:18px;background:#d4a72c;margin-left:4px") })
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "browser", "title": "Checks the rendered page through the extension or a detector URL scan." },
                                  "Browser"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Decorative blinking cursor"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A blinking cursor makes ordinary text look editable or like a terminal. Remove it from static copy; keep it where people can type."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Animate guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-marquee", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--marquee" },
                                  h("span", null,
                                    "NORTHWIND\u00a0\u00a0 HALCYON\u00a0\u00a0 MERIDIAN\u00a0\u00a0 FIELDNOTE\u00a0\u00a0 NORTHWIND"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Auto-scrolling marquee"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Auto-scrolling text or logos make people read at the page\u2019s pace. Keep them still, or give people controls to pause and browse."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Animate guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-bounce-easing", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; gap: 8px;") },
                                  h("div", { "style": cssStyle("background: #fff; border: 1px solid #d8d4cc; border-radius: 8px; padding: 11px 16px; box-shadow: 0 10px 26px rgba(0,0,0,0.14); font-size: 12px; font-weight: 600; color: #111; animation: elasticpop 1.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;") },
                                    "Confirm action"
                                  ),
                                  h("div", { "style": cssStyle("font-size: 11px; color: #888;") },
                                    "A dialog that springs in with overshoot."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Bounce or elastic easing"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A dialog that bounces or overshoots can make a routine action feel fussy. Let it settle quickly, and save playful motion for moments that suit the product."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Animate guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-layout-transition", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; color: #111; display: flex; align-items: center; gap: 10px;") },
                                  h("div", { "style": cssStyle("background: oklch(65% 0.22 265); border-radius: 6px; animation: janky 1.2s ease-in-out infinite; width: 60px; height: 30px;") }),
                                  h("div", { "style": cssStyle("font-size: 12px; color: #555;") },
                                    "Changing width moves nearby content."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Animation that changes layout"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Animating size or spacing can shift nearby content and make transitions stutter. Use transforms for visual movement where possible, and check performance when the layout needs to change."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Optimize guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-image-hover-transform", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("display: flex; flex-direction: column; align-items: center; gap: 8px; font-family: system-ui, sans-serif;") },
                                  h("div", { "style": cssStyle("width: 104px; height: 70px; border-radius: 8px; overflow: hidden;") },
                                    h("svg", { "width": "104", "height": "70", "viewBox": "0 0 104 70", "aria-hidden": "true", "style": cssStyle("width: 100%; height: 100%; display: block; animation: imgzoom 2.4s ease-in-out infinite;") },
                                      h("defs", {},
                                        h("linearGradient", { "id": "rule-image-hover-gradient", "x1": "0", "y1": "0", "x2": "1", "y2": "1" },
                                          h("stop", { "offset": "0", "stopColor": "#c9a86a" }),
                                          h("stop", { "offset": "1", "stopColor": "#7a8b6f" })
                                        )
                                      ),
                                      h("rect", { "width": "104", "height": "70", "fill": "url(#rule-image-hover-gradient)" }),
                                      h("circle", { "cx": "80", "cy": "20", "r": "10", "fill": "#f0e6c8" })
                                    )
                                  ),
                                  h("div", { "style": cssStyle("font-size: 11px; color: #888;") },
                                    "Hover-style zoom, replayed here."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Images that move on hover"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Zooming or rotating every image on hover adds movement without a clear purpose. Keep images still unless the motion helps explain what people can do."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Animate guide"
                              )
                            )
                          )
                        )
                      ),
                      h("section", { "className": "anti-patterns-section", "id": "section-copy" },
                        h("header", { "className": "anti-patterns-section-header" },
                          h("h3", { "className": "anti-patterns-section-title" },
                            "Copy"
                          ),
                          h("p", { "className": "anti-patterns-section-count" },
                            "5 rules"
                          )
                        ),
                        h("div", { "className": "rule-card-grid" },
                          h("article", { "className": "rule-card", "id": "rule-repeated-container-text", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--repeat" },
                                  h("strong", null,
                                    "Ready"
                                  ),
                                  h("span", null,
                                    "Ready"
                                  ),
                                  h("button", null,
                                    "Ready"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Same text repeated inside one container"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "The same label appears in several slots of one card. Keep it once, where it matters."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Clarify guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-em-dash-overuse", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: Georgia, serif; font-size: 13px; color: #111; line-height: 1.6; max-width: 230px;") },
                                  "It works ",
                                  h("span", { "style": cssStyle("color: oklch(58% 0.15 35);") },
                                    "\u2014"
                                  ),
                                  " really well ",
                                  h("span", { "style": cssStyle("color: oklch(58% 0.15 35);") },
                                    "\u2014"
                                  ),
                                  " for teams ",
                                  h("span", { "style": cssStyle("color: oklch(58% 0.15 35);") },
                                    "\u2014"
                                  ),
                                  " of any size ",
                                  h("span", { "style": cssStyle("color: oklch(58% 0.15 35);") },
                                    "\u2014"
                                  ),
                                  " anywhere."
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Em-dash overuse"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A dash in every sentence is a familiar AI writing habit. Use a full stop between separate thoughts, and choose other punctuation when it makes the sentence easier to follow."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Clarify guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-marketing-buzzword", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; color: #111; line-height: 1.5;") },
                                  h("div", { "style": cssStyle("font-size: 16px; font-weight: 700;") },
                                    "Supercharge your workflow"
                                  ),
                                  h("div", { "style": cssStyle("font-size: 11px; color: #888;") },
                                    "World-class, enterprise-grade, next-generation."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Generic marketing claims"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Words like \u201csupercharge\u201d and \u201cworld-class\u201d promise a lot without explaining the product. Say what people can do and what improves for them."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Clarify guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-aphoristic-cadence", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: Georgia, serif; color: #111; line-height: 1.4;") },
                                  h("div", { "style": cssStyle("font-size: 15px; font-weight: 600;") },
                                    "Not a feature."
                                  ),
                                  h("div", { "style": cssStyle("font-size: 15px; font-weight: 600;") },
                                    "A platform."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Forced contrast"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Repeated lines like \u201cNot a feature. A platform.\u201d make every point sound like a slogan. Explain the distinction when it matters, and state the useful information directly."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Clarify guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-theater-slop-phrase", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; color: #111; line-height: 1.5;") },
                                  h("div", { "style": cssStyle("font-size: 15px; font-weight: 700;") },
                                    "We killed the growth ",
                                    h("span", { "style": cssStyle("color: oklch(58% 0.15 35);") },
                                      "theater"
                                    ),
                                    "."
                                  ),
                                  h("div", { "style": cssStyle("font-size: 11px; color: #888;") },
                                    "Dismissing things as performative."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Calling things \u201ctheater\u201d"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Calling something \u201ctheater\u201d can replace an explanation with a dismissal. Name what is ineffective or misleading, and explain why."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Clarify guide"
                              )
                            )
                          )
                        )
                      ),
                      h("section", { "className": "anti-patterns-section", "id": "section-imagery" },
                        h("header", { "className": "anti-patterns-section-header" },
                          h("h3", { "className": "anti-patterns-section-title" },
                            "Imagery"
                          ),
                          h("p", { "className": "anti-patterns-section-count" },
                            "4 rules"
                          )
                        ),
                        h("div", { "className": "rule-card-grid" },
                          h("article", { "className": "rule-card", "id": "rule-shape-assembled-illustration", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--center" },
                                  h("svg", { "width": "150", "height": "86", "viewBox": "0 0 150 86", "fill": "none" },
                                    h("rect", { "x": "20", "y": "38", "width": "52", "height": "34", "rx": "8", "fill": "#eadfce" }),
                                    h("circle", { "cx": "46", "cy": "32", "r": "19", "fill": "#d4a72c" }),
                                    h("path", { "d": "M77 71c8-28 23-42 46-42v42H77Z", "fill": "#5c9b8f" }),
                                    h("circle", { "cx": "113", "cy": "20", "r": "8", "fill": "#222" })
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "slop" },
                                  "AI slop"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Placeholder-style illustrations"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A scene built from generic circles and blocks can look like placeholder art. Choose imagery that says something specific about the product."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Critique guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-organic-clip-path", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--center" },
                                  h("div", { "style": cssStyle("width:150px;height:86px;background:url('/antipattern-images/lazy-cool.png') center/cover;clip-path:polygon(0 19%,9% 5%,21% 13%,32% 2%,44% 11%,57% 4%,69% 15%,82% 7%,100% 20%,94% 38%,100% 53%,91% 69%,96% 88%,78% 83%,64% 96%,49% 87%,33% 97%,18% 84%,3% 91%,8% 68%,0 52%,7% 34%)") })
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Jagged image masks"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A jagged image mask tries to imitate a torn or organic edge. Use a prepared cut-out asset for that effect, or choose a clean crop."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Polish guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-buried-raster", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--center" },
                                  h("div", { "style": cssStyle("position:relative;width:100%;height:100%;background:url('/antipattern-images/lazy-impact.png') center/cover") },
                                    h("span", { "style": cssStyle("position:absolute;inset:0;display:grid;place-items:center;background:rgba(245,242,235,.94);font:600 10px system-ui;color:#777") },
                                      "94% wash"
                                    )
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Images hidden under overlays"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "A nearly opaque overlay hides the image you added. Reduce it until the image contributes, or remove an image that serves no purpose."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Polish guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-broken-image", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif;") },
                                  h("div", { "style": cssStyle("width: 120px; height: 80px; border: 1px solid #d8d4cc; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #f5f3ef; color: #b3ada3;") },
                                    h("svg", { "width": "28", "height": "28", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": "1.5" },
                                      h("rect", { "x": "3", "y": "3", "width": "18", "height": "18", "rx": "2" }),
                                      h("path", { "d": "M3 16l5-5 4 4 3-3 6 6" }),
                                      h("path", { "d": "M3 21L21 3" })
                                    )
                                  ),
                                  h("div", { "style": cssStyle("font-size: 10px; color: #888; margin-top: 6px;") },
                                    "Empty or missing src ships broken."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Broken or placeholder image"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "An image with a missing, empty, or placeholder source leaves the page unfinished. Add the intended asset and check that it loads, or remove the image."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Harden guide"
                              )
                            )
                          )
                        )
                      ),
                      h("section", { "className": "anti-patterns-section", "id": "section-general-quality" },
                        h("header", { "className": "anti-patterns-section-header" },
                          h("h3", { "className": "anti-patterns-section-title" },
                            "General quality"
                          ),
                          h("p", { "className": "anti-patterns-section-count" },
                            "10 rules"
                          )
                        ),
                        h("div", { "className": "rule-card-grid" },
                          h("article", { "className": "rule-card", "id": "rule-script-error", "data-layer": "browser" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--console" },
                                  h("span", null,
                                    "Uncaught TypeError"
                                  ),
                                  h("small", null,
                                    "Cannot read properties of null"
                                  ),
                                  h("code", null,
                                    "app.js:42:17"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "browser", "title": "Checks the rendered page through the extension or a detector URL scan." },
                                  "Browser"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "JavaScript errors on load"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "An uncaught JavaScript error can break controls or hide content. Fix the error, then check that the page works before polishing its appearance."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Harden guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-content-hidden-at-rest", "data-layer": "browser" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--hidden" },
                                  h("strong", null,
                                    "Visible heading"
                                  ),
                                  h("span", null,
                                    "Most of this page never leaves opacity: 0."
                                  ),
                                  h("span", null,
                                    "Reveal handler did not run."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "browser", "title": "Checks the rendered page through the extension or a detector URL scan." },
                                  "Browser"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Content stuck waiting to appear"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Content stays hidden when its entrance animation fails to run. Make it visible by default so people can still use the page if the animation fails."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Harden guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-cramped-padding", "data-layer": "browser" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif;") },
                                  h("button", { "style": cssStyle("background: #111; color: #fff; border: none; border-radius: 4px; padding: 2px 6px; font-size: 13px; font-weight: 500;") },
                                    "Buy now"
                                  ),
                                  h("span", { "style": cssStyle("color: #555; font-size: 12px; margin-left: 8px;") },
                                    "2px vertical padding."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "browser", "title": "Checks the rendered page. Use the Chrome extension or give the detector a URL." },
                                  "Browser"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Cramped padding"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Text pressed against a button or card edge feels cramped. Add enough padding to separate the content from its container, using your spacing scale."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Layout guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-body-text-viewport-edge", "data-layer": "browser" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--surface", "style": cssStyle("padding: 0; overflow: hidden;") },
                                  h("div", { "style": cssStyle("font-family: system-ui, sans-serif; font-size: 11px; color: #111; line-height: 1.5;") },
                                    "Body text running flush against the very edge of the viewport with no container padding to hold it in."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "browser", "title": "Checks the rendered page. Use the Chrome extension or give the detector a URL." },
                                  "Browser"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Body text touching the page edge"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Paragraphs need space at the sides of the screen. Add horizontal padding to the content container, and check that it remains at narrow widths."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Layout guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-justified-text", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; font-size: 12px; color: #111; text-align: justify; max-width: 230px; line-height: 1.5;") },
                                  "These words stretch to fill each line, leaving uneven gaps between them. In a narrow column, the spacing becomes especially noticeable."
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Justified text"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Justified paragraphs can leave distracting gaps between words. Align body text to the start of the line, or use hyphenation and check the spacing at each screen size."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-low-contrast", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "className": "catalog-rule-demo catalog-rule-demo--surface", "style": cssStyle("background: #fff; font-family: system-ui, sans-serif;") },
                                  h("div", { "style": cssStyle("color: #d4d4d4; font-size: 13px;") },
                                    "Light gray text on a white background. 1.6:1 contrast, fails WCAG."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Low-contrast text"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Text that blends into its background is hard to read. Increase contrast to meet WCAG AA: at least 4.5:1 for regular text and 3:1 for large text."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Audit guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-skipped-heading", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; color: #111;") },
                                  h("h1", { "style": cssStyle("font-size: 20px; font-weight: 700; margin: 0 0 4px;") },
                                    "Page title (h1)"
                                  ),
                                  h("h3", { "style": cssStyle("font-size: 13px; font-weight: 600; margin: 0; color: #555;") },
                                    "Subsection (h3), skipped h2"
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Skipped heading level"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Heading levels help screen reader users navigate. Match them to the page structure: use h2 for a section under h1, then h3 for a subsection."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Audit guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-tight-leading", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; font-size: 13px; color: #111; line-height: 1.0; max-width: 220px;") },
                                  "Tight leading makes multi-line body text feel crammed and hard for the eye to track between lines."
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Tight line height"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Closely packed lines make paragraphs hard to follow. Start around 1.5 times the font size, then adjust for the typeface and line length."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-tiny-text", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; color: #111;") },
                                  h("div", { "style": cssStyle("font-size: 15px; margin-bottom: 6px;") },
                                    "Regular body text"
                                  ),
                                  h("div", { "style": cssStyle("font-size: 9px; color: #555;") },
                                    "And then fine print at 9 pixels that no one will ever read."
                                  )
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Tiny body text"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Small body text makes reading a chore. Start around 16px, then check the actual typeface on a phone and desktop. Keep secondary text comfortably readable too."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          ),
                          h("article", { "className": "rule-card", "id": "rule-wide-tracking", "data-layer": "cli" },
                            h("div", { "className": "rule-card-visual", "aria-hidden": "true", "inert": true },
                              h("div", { "className": "rule-card-visual-inner" },
                                h("div", { "style": cssStyle("font-family: system-ui, sans-serif; font-size: 13px; color: #111; letter-spacing: 0.22em; max-width: 230px; line-height: 1.6;") },
                                  "Wide tracking on body text slows reading by breaking up natural character groupings."
                                )
                              )
                            ),
                            h("div", { "className": "rule-card-body" },
                              h("div", { "className": "rule-card-head" },
                                h("span", { "className": "rule-card-category", "data-category": "quality" },
                                  "Quality"
                                ),
                                h("span", { "className": "rule-card-layer", "data-layer": "cli", "title": "Checks source code and styles; no browser needed." },
                                  "Source"
                                )
                              ),
                              h("h3", { "className": "rule-card-name" },
                                "Wide letter spacing on body text"
                              ),
                              h("p", { "className": "rule-card-desc" },
                                "Spreading letters far apart makes paragraphs harder to read. Keep body text near the font\u2019s default spacing; save wider spacing for short labels."
                              ),
                              h("a", { "className": "rule-card-skill-link", "href": "#catalog" },
                                "Typeset guide"
                              )
                            )
                          )
                        )
                      )
                    )
                  ),
                  h("section", { "className": "slop-section visual-mode-methods", "id": "run-it", "aria-label": "Ways to check your design" },
                    h("h2", { "className": "slop-section-heading" },
                      "Run it yourself"
                    ),
                    h("div", { "className": "visual-mode-methods-grid" },
                      h("article", { "className": "visual-mode-method" },
                        h("h3", { "className": "visual-mode-method-name" },
                          "Check from the terminal"
                        ),
                        h("p", { "className": "visual-mode-method-desc" },
                          "Scan source files or a running page. Use the results locally or in CI, without starting an AI conversation."
                        ),
                        h("div", { "className": "site-code-block code-block-wrap is-command docs-command-block", "data-code-variant": "standard", "data-command-syntax": "fixed" },
                          h("div", { "className": "site-code-header" },
                            h("button", { "className": "site-code-copy", "type": "button", "aria-label": "Copy command" },
                              h("svg", { "className": "site-code-copy-icon", "width": "14", "height": "14", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": "1.6", "aria-hidden": "true" },
                                h("rect", { "x": "9", "y": "9", "width": "13", "height": "13", "rx": "2" }),
                                h("path", { "d": "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" })
                              ),
                              h("svg", { "className": "site-code-check-icon", "width": "16", "height": "16", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": "2.1", "strokeLinecap": "round", "strokeLinejoin": "round", "aria-hidden": "true" },
                                h("path", { "d": "M20 6 9 17l-5-5" })
                              ),
                              h("span", { "className": "site-code-copy-label", "aria-hidden": "true" },
                                "Copy"
                              )
                            )
                          ),
                          h("span", { "className": "site-code-prompt", "aria-hidden": "true" },
                            "$"
                          ),
                          h("pre", { "className": "visual-mode-method-code site-code-content", "data-site-code-ready": "true", "tabIndex": "0" },
                            h("code", {},
                              "npx design-checker detect src/\nnpx design-checker detect http://localhost:3000"
                            )
                          )
                        ),
                        h("span", { "className": "site-code-status", "role": "status", "aria-live": "polite" }),
                        h("p", { "className": "visual-mode-method-desc" },
                          h("a", { "href": "#catalog" },
                            "Read the detector guide"
                          ),
                          "."
                        )
                      ),
                      h("article", { "className": "visual-mode-method" },
                        h("h3", { "className": "visual-mode-method-name" },
                          "Ask for a design review"
                        ),
                        h("p", { "className": "visual-mode-method-desc" },
                          "Use ",
                          h("a", { "href": "#catalog" },
                            "critique"
                          ),
                          " to understand what is holding the design back and what to improve first. It combines design judgment with automated checks and shows findings on the page when your agent\u2019s browser tools support the overlay."
                        ),
                        h("p", { "className": "visual-mode-method-desc" },
                          h("a", { "href": "#run-it" },
                            "Follow the critique walkthrough"
                          ),
                          "."
                        )
                      ),
                      h("article", { "className": "visual-mode-method" },
                        h("h3", { "className": "visual-mode-method-name" },
                          "Inspect a page in Chrome"
                        ),
                        h("p", { "className": "visual-mode-method-desc" },
                          "Open your design-checker extension and choose ",
                          h("strong", {},
                            "Scan page"
                          ),
                          ". Use ",
                          h("strong", {},
                            "Show overlays"
                          ),
                          " to see where the findings appear on the page."
                        ),
                        h("p", { "className": "visual-mode-method-desc" },
                          h("a", { "href": "#run-it", "target": "_blank", "rel": "noopener" },
                            "Review the detector workflow"
                          ),
                          "."
                        )
                      )
                    )
                  )
                )
              )
            )
          )
    )
  );
}
