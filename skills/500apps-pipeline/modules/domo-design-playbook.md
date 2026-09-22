# Domo Design Playbook (pipeline reference)

Authoritative Domo brand design system. Use this module for **structural patterns** (shadows, animations, radius, components) across ALL apps, and for the **full Domo palette** on engagement context apps. MVP apps use the customer's brand kit for colors/fonts but still follow the structural patterns here.

## How this module is used in the pipeline

- **Engagement context app** (the Domo-branded template): Use the **full playbook** — Domo Blue, Open Sans, orange CTAs, layered shadows, animation library.
- **MVP1 / MVP2 apps** (customer-branded): Use the playbook's **structural patterns** (shadow system, border-radius scale, animation keyframes, component architecture, easing curves) but swap in the customer's brand colors, fonts, and CTA colors from `spec/BRAND-KIT.md`.
- **When to load:** Stages **F** (build spec — pick structural patterns), **G1/J1** (implementation — apply patterns), **G2/J2** (UX audit — verify compliance).

---

## 1. The Domo Color Palette

```css
:root {
  /* Primary */
  --domo-blue: #99CCEE;           /* Pantone 291C — the anchor */

  /* Neutrals */
  --neutral-50: #F1F6FA;          /* Light backgrounds, card fills */
  --neutral-100: #DCE4EA;         /* Borders, dividers */
  --neutral-200: #B7C1CB;         /* Secondary text, placeholders */
  --neutral-600: #68737F;         /* Body text on light backgrounds */
  --neutral-900: #3F454D;         /* Headings, primary text */

  /* Accents */
  --accent-orange: #FF9922;       /* CTA / action color */
  --accent-purple: #776CB0;       /* Charts, tags */
  --accent-pink: #C179BD;         /* Charts, badges */
  --accent-light-pink: #ECA4DD;   /* Charts */
  --accent-mint: #ADD4C1;         /* Success states, charts */
}
```

**Color hierarchy:**
1. **Domo Blue** — headers, hero sections, navigation backgrounds (engagement context app only; MVP apps use customer primary)
2. **Orange** — ALL buttons, CTAs, links that drive action (engagement context app; MVP apps use customer accent)
3. **Neutrals** — backgrounds, text, borders, cards (shared across both app types)
4. **Accent colors** — charts, data viz, tags (never dominant)

**Banned colors:**
- No purple gradients (`linear-gradient(135deg, #667eea, #764ba2)`) — the #1 AI design cliche
- No generic blues (#3B82F6, #2563EB, #1E40AF) — only Domo Blue #99CCEE for Domo-branded artifacts
- No pure black (#000000) — use #3F454D for darkest elements
- No dark navy (#0C0F1A) — use #3F454D instead

---

## 2. Typography

**Engagement context app:** Open Sans only.

```css
:root {
  --font-primary: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

| Role | Weight | Usage |
|------|--------|-------|
| Titles (h1, h2) | 700 Bold | Page titles, section headers |
| Subtitles, large metrics | 300 Light | KPI numbers, hero values |
| Body copy | 400 Regular | Paragraphs, descriptions |
| Labels, buttons | 600 Semibold | Interactive elements, emphasis |

```html
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
```

**MVP apps:** Use the customer's brand font from `spec/BRAND-KIT.md`. Fall back to Inter if no customer font is specified.

**Responsive sizing:**
```css
h1 { font-size: clamp(2rem, 5vw, 3.5rem); }
h2 { font-size: clamp(1.5rem, 3.5vw, 2.5rem); }
h3 { font-size: clamp(1.25rem, 2.5vw, 1.75rem); }
body { font-size: clamp(0.875rem, 1.5vw, 1rem); }
```

---

## 3. Depth and shadows (all apps)

```css
:root {
  --shadow-sm: 0 1px 3px rgba(63,69,77,0.08), 0 1px 2px rgba(63,69,77,0.06);
  --shadow-md: 0 4px 12px rgba(63,69,77,0.1), 0 2px 4px rgba(63,69,77,0.06);
  --shadow-lg: 0 8px 20px rgba(63,69,77,0.08), 0 4px 8px rgba(63,69,77,0.04);
  --shadow-blue-glow: 0 4px 20px rgba(153, 204, 238, 0.3);
  --shadow-orange-glow: 0 4px 20px rgba(255, 153, 34, 0.3);
}
```

**Border radius:**
```css
:root {
  --radius-sm: 6px;     /* badges, tags, chips */
  --radius-md: 8px;     /* buttons, inputs */
  --radius-lg: 12px;    /* cards, containers */
}
```

---

## 4. Animation library (all apps)

```css
:root {
  --ease-smooth: cubic-bezier(0.83, 0, 0.17, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes domoFadeInUp {
  from { opacity: 0; transform: translateY(1.5rem); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes domoFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes domoShimmer {
  from { background-position: -200% 0; }
  to { background-position: 200% 0; }
}

@keyframes domoPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
}
```

**Staggered entrance (cards, list items):**
```css
.stagger > * {
  opacity: 0;
  animation: domoFadeInUp 0.5s var(--ease-out-expo) forwards;
}
.stagger > *:nth-child(1) { animation-delay: 0.05s; }
.stagger > *:nth-child(2) { animation-delay: 0.1s; }
.stagger > *:nth-child(3) { animation-delay: 0.15s; }
.stagger > *:nth-child(4) { animation-delay: 0.2s; }
.stagger > *:nth-child(5) { animation-delay: 0.25s; }
.stagger > *:nth-child(6) { animation-delay: 0.3s; }
```

**Number counting animation:**
```javascript
function animateValue(element, start, end, duration, suffix = '') {
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOutExpo = 1 - Math.pow(2, -10 * progress);
    const current = start + (end - start) * easeOutExpo;
    element.textContent = Math.floor(current).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
```

**Scroll-triggered animations:**
```javascript
function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}
```

**Loading skeleton:**
```css
.skeleton {
  background: linear-gradient(90deg, #DCE4EA 25%, #F1F6FA 50%, #DCE4EA 75%);
  background-size: 200% 100%;
  animation: domoShimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}
```

---

## 5. Component patterns (all apps — adapt colors per brand)

### Primary button
```css
.btn-primary {
  padding: 0.75rem 1.75rem;
  background: var(--accent-orange); /* or customer CTA color */
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.3s var(--ease-smooth);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-orange-glow); /* adapt glow to CTA color */
}
```

### Card
```css
.card {
  padding: 1.75rem;
  background: white;
  border: 1px solid var(--neutral-100);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s var(--ease-smooth);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
```

### KPI metric
```css
.kpi-value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  font-feature-settings: 'tnum' 1;
}
.kpi-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--neutral-600);
  margin-top: 0.25rem;
}
```

---

## 6. Accessibility (all apps)

```css
*:focus-visible {
  outline: 2px solid var(--domo-blue); /* or customer primary */
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Performance targets

- First Contentful Paint < 1.5s
- Animations at 60fps (use `transform` and `opacity` only)
- Use `will-change` sparingly on animated elements
- Preconnect fonts to avoid layout shift
- Interaction ready < 3s

---

## 8. Anti-patterns checklist

Never use these in any app (engagement context or MVP):

| Banned | Use instead |
|--------|-------------|
| `linear-gradient(135deg, #667eea, #764ba2)` | Solid brand color or subtle vertical gradient |
| `font-family: 'Inter'` in engagement context app | Open Sans per this playbook |
| `color: #3B82F6` or any generic blue | Domo Blue #99CCEE for Domo artifacts; customer primary for MVP |
| `color: #000000` or `background: #000` | #3F454D for darkest elements |
| `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` (flat single shadow) | Layered `--shadow-sm/md/lg` |
| `border-radius: 24px` (too rounded for cards) | `--radius-lg: 12px` for cards |
| Emojis as icons | Lucide, Heroicons, Material Icons, or inline SVG |

---

## 9. Domo logo (engagement context app only)

Two variants only — Domo Blue (#99CCEE) fills or white fills. Never generate, recreate, or approximate the logo. Never stretch, rotate, add gradients, or add effects.

**Nav size:** 36-40px. **Footer:** 48-60px. **Hero:** 80-120px.

The SVG paths are available in the canonical playbook source. Use the exact SVG — never approximate.

---

## 10. HTML boilerplate (engagement context app)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Domo — [Page Title]</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --domo-blue: #99CCEE;
      --accent-orange: #FF9922;
      --neutral-50: #F1F6FA;
      --neutral-100: #DCE4EA;
      --neutral-200: #B7C1CB;
      --neutral-600: #68737F;
      --neutral-900: #3F454D;
      --font-primary: 'Open Sans', -apple-system, sans-serif;
      --shadow-sm: 0 1px 3px rgba(63,69,77,0.08), 0 1px 2px rgba(63,69,77,0.06);
      --shadow-lg: 0 8px 20px rgba(63,69,77,0.08), 0 4px 8px rgba(63,69,77,0.04);
      --radius-md: 8px;
      --radius-lg: 12px;
      --ease-smooth: cubic-bezier(0.83, 0, 0.17, 1);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--font-primary);
      color: var(--neutral-900);
      background: #FFFFFF;
      -webkit-font-smoothing: antialiased;
    }
  </style>
</head>
<body>
  <!-- content -->
</body>
</html>
```
