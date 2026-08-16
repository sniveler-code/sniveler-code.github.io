# Roadmap to 10/10 — sniveler-code.github.io

## Phase 0: Foundation (Critical — Do First) ✅ **COMPLETE**
- [x] **0.1** Extract shared CSS/JS from docs template → `/assets/docs.css`, `/assets/docs.js`
- [x] **0.2** Extract inline styles/scripts from `index.html` → `/assets/main.css`, `/assets/main.js`
- [x] **0.3** Update `docs_template.html` and `index.html` to link external assets
- [x] **0.4** Add `preload` for fonts, `canonical`, `viewport` fixes

## Phase 1: SEO & Discoverability (Critical) ✅ **COMPLETE**
- [x] **1.1** Add Open Graph + Twitter Card meta to all HTML (template-driven)
- [x] **1.2** Add JSON-LD `SoftwareApplication` schema for each asset (auto-generated from data)
- [x] **1.3** Generate `sitemap.xml` in `build-docs.js`
- [x] **1.4** Add `robots.txt`
- [x] **1.5** Fix hardcoded copyright year (2026 → dynamic)

## Phase 2: Performance & Images (High) ✅ **COMPLETE**
- [x] **2.1** Convert all images to WebP + AVIF (Sharp in build script)
- [x] **2.2** Add `<picture>` with fallbacks + `loading="lazy"` on below-fold images
- [x] **2.3** Add `fetchpriority="high"` to hero image/logo
- [x] **2.4** Self-host highlight.js styles (remove CDN dependency)
- [ ] **2.5** Minify CSS/HTML in build (optional: `html-minifier-terser`, `clean-css`)

## Phase 3: Accessibility & Polish (High) ✅ **COMPLETE**
- [x] **3.1** Add `:focus-visible` styles globally
- [x] **3.2** Add skip link (`<a href="#main" class="skip-link">`)
- [x] **3.3** Respect `prefers-reduced-motion` in scroll reveal + CSS animations
- [x] **3.4** Add `text-wrap: balance` to headings
- [x] **3.5** Active section highlighting in docs sidebar (IntersectionObserver on headings)
- [x] **3.6** Fix `mask-image` for Firefox (unprefixed)
- [x] **3.7** YouTube embeds → `youtube-nocookie.com`

## Phase 4: Docs UX (Medium) ✅ **COMPLETE**
- [x] **4.1** Client-side search (Pagefind — zero-config, static)
- [x] **4.2** Copy code button on code blocks
- [x] **4.3** "Edit on GitHub" link per page
- [x] **4.4** Version badge
- [ ] **4.5** Dark/light theme toggle (persist in localStorage)

## Phase 5: Site Features (Medium) ✅ **COMPLETE**
- [x] **5.1** 404.html page
- [x] **5.2** RSS/Atom feed for asset updates
- [x] **5.3** GitHub stars/forks badges (shields.io)
- [x] **5.4** Discord widget / "Join Community" CTA
- [ ] **5.5** Changelog / blog section (MDX if migrating to Astro)

## Phase 6: Infrastructure (Medium) 🟡 **IN PROGRESS**
- [x] **6.1** GitHub Actions workflow: build → optimize → deploy
- [x] **6.2** Move to Cloudflare Pages / Netlify for custom headers (CSP, security) - configs ready
- [x] **6.3** Add `package.json` scripts: `build`, `dev`, `preview`
- [ ] **6.4** Dependabot / Renovate config

## Phase 7: Migration to Astro (Optional — Long Term)
- [ ] **7.1** Migrate to Astro (MDX, islands, image optimization, i18n, RSS built-in)
- [ ] **7.2** Partial hydration for interactive widgets
- [ ] **7.3** Content collections for assets/docs
- [ ] **7.4** View Transitions API for page transitions

---

## Data Source for Automation

Create `/site-data/assets.json` as single source of truth:

```json
{
  "assets": [
    {
      "id": "ai-behavior-architect",
      "name": "AI Behavior Architect",
      "tagline": "Pure DOTS / ECS Behavior Trees",
      "price": 69.99,
      "status": "pending",
      "tags": ["DOTS", "ECS"],
      "docs": "docs_ai-behavior-architect.html",
      "store": "https://assetstore.unity.com/publishers/80672",
      "image": "Images/ai_behavior_architect.jpg",
      "description": "Professional AI behavior logic with zero-allocation performance."
    },
    ...
  ],
  "author": {
    "name": "Sniveler Code",
    "email": "sniveler.code@gmail.com",
    "github": "https://github.com/sniveler-code",
    "youtube": "https://www.youtube.com/@SnivelerCode",
    "discord": "https://discord.gg/rQ5XK9x7N",
    "assetStore": "https://assetstore.unity.com/publishers/80672"
  }
}
```

Then `build-docs.js` reads this to:
- Generate asset cards in `index.html`
- Generate JSON-LD per asset
- Generate OG meta per page
- Generate `sitemap.xml`

---

## Step-by-Step Execution Order

| Step | Task | Files Touched |
|------|------|---------------|
| 1 | Create `/assets` dir, extract CSS/JS | `index.html`, `docs_template.html`, new files |
| 2 | Create `site-data/assets.json` | new file |
| 3 | Refactor `build-docs.js` to use assets.json + generate sitemap + inject OG/JSON-LD | `build-docs.js`, `docs_template.html` |
| 4 | Update `index.html` to use assets.json (or keep static but add OG/JSON-LD) | `index.html` |
| 5 | Image optimization script + WebP conversion | new `optimize-images.js`, `package.json` |
| 6 | Accessibility fixes (focus-visible, skip-link, reduced-motion) | `assets/main.css`, `assets/main.js` |
| 7 | Docs UX: active sidebar highlight, Pagefind search | `assets/docs.js`, `build-docs.js` |
| 8 | GitHub Actions workflow | `.github/workflows/deploy.yml` |
| 9 | 404.html, robots.txt | new files |
| 10 | Deploy to Cloudflare Pages + CSP headers | `_headers`, config |

---

## Current Step: **Phase 5.1 — Create 404.html Page**

Let's continue.