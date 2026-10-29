# Gemini handoff — refine the `/features` page

You are an implementation agent working in the repository at:

```
/Users/lokeshgandreddy/Desktop/journal
```

The page `/features` has already been built from scratch and is functional. Your job is **refinement only**. Read the files first, make targeted edits, and verify visually. Do not rebuild the page, rename files, add dependencies, or change the product architecture.

---

## 1. Mission

Finish the visual and interaction polish on the Sara `/features` page so it matches the quality bar of the reference:

- Reference: https://chatgpt.com/overview/
- Design language: clean white editorial page, oversized tight-tracking headlines, black pill buttons, light-gray feature cards, generous whitespace, a large CSS product window in the hero, and subtle brand gradients.
- Brand in this repo: **Sara** (not ChatGPT). The page is already wired into the navbar and router at `/features`.

The page currently renders all sections. The remaining work is layout correction, spacing, small copy changes, accessibility, and screenshot verification.

---

## 2. Current implementation (do not rebuild)

Route and composition:

- `frontend/src/features/chapters/pages/FeaturesPage.tsx`
  - Scrolls the page inside a `.openedup-home` container (`h-dvh overflow-y-auto`).
  - Renders `LandingNavbar`, `FeatureHero`, `CapabilityCarousel`, `PricingPanel`, `TrustSection`, `FeatureCta`, `SaraFooter`. (Note: `ModeShowcase` is no longer used in the page; `InspiredSection` was removed at the user's request. Verify against the current file before editing.)
- Route is already registered in `frontend/src/App.tsx` at `/features`.

Content model:

- `frontend/src/features/chapters/data/featuresContent.ts`
  - `modes` (Chat / Study / Build)
  - `capabilities` (Chat / Documents / Spend audit / Coding agents / Benchmarks / Plugins & skills)
  - `trustCards` (keys / files)
  - Copy edits should generally go here unless the text is a section heading defined in a component.

Components:

```
frontend/src/features/chapters/components/features/
  FeatureHero.tsx          hero headline, CTAs, ambient wash, floating audit card
  HeroWorkspaceMockup.tsx  pure CSS product window (chat + chapters + sources)
  ModeShowcase.tsx         Chat/Study/Build accordion + sticky visual
  ModeVisuals.tsx          ChatVisual / StudyVisual / BuildVisual
  CapabilityCarousel.tsx   horizontal snap carousel
  CapabilityVisuals.tsx    six small CSS visuals for the cards
  TrustSection.tsx         privacy cards
  PricingPanel.tsx         plans/pricing panel → /#pricing
  (InspiredSection was removed at the user's request; do not re-add it)
  FeatureCta.tsx           final gradient CTA
  Reveal.tsx               IntersectionObserver fade/lift wrapper
```

Global CSS:

- `frontend/src/index.css`
  - Added `@keyframes feature-rise` and `.feature-rise` for the mode visual swap.
  - Do not remove it.

Hash scrolling:

- `frontend/src/features/chapters/components/LandingView.tsx`
  - A helper was added so `/#pricing` and other hash links scroll the home page's internal `.openedup-home` container.
  - Leave this behavior intact.

Current checks:

- `cd frontend && npm run typecheck` passes.
- `cd frontend && npm run build` passed before the last hero edit; rerun it after your changes.
- The dev server may already be running. Check `http://localhost:5173/features`; if 5173 is busy it may be on `http://localhost:5174/features`.

---

## 3. Required refinements (P0)

Do these first. They are confirmed from desktop and mobile screenshots.

### 3.1 Carousel left inset / snap bug

File: `frontend/src/features/chapters/components/features/CapabilityCarousel.tsx`

The scroller currently has:

```tsx
className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 [&::-webkit-scrollbar]:hidden"
```

Because of `snap-start`, the browser auto-scrolls to `scrollLeft: 48`, which cancels the left padding and makes the first card sit flush at the viewport edge (`x: 0` at 1440px). The heading is inset, so this looks broken.

Fix: add matching scroll padding:

```tsx
className="... scroll-pl-1 sm:scroll-pl-8 lg:scroll-pl-12 ..."
```

Keep the existing negative margins and padding so the carousel still bleeds off the right edge. After the fix, the first card should start at the same left inset as the section heading (48px at 1440px).

### 3.2 Capability cards have too much dead space below the visual

Files:

- `CapabilityCarousel.tsx`
- `CapabilityVisuals.tsx`

Current card class:

```tsx
className="flex min-h-[470px] w-[290px] shrink-0 snap-start flex-col rounded-[24px] bg-[#f5f5f5] p-6 ... sm:min-h-[500px] sm:w-[360px] sm:p-8 lg:w-[400px]"
```

Current visual wrapper in `CapabilityVisuals.tsx`:

```tsx
<div className="mt-8 flex-1">
```

Problems:
- The visuals sit at the top of a flexible area and leave a large empty strip at the bottom of each card.
- The cards are taller than they need to be.

Fix:
1. Change the visual wrapper to bottom-align:

```tsx
<div className="mt-8 flex flex-1 flex-col justify-end">
```

2. Reduce the card heights:

```tsx
min-h-[400px] ... sm:min-h-[460px]
```

3. Keep the card padding as-is (`p-6`, `sm:p-8`).

4. For the Chat card only, add a little more content so its visual is not noticeably shorter than the others. Recommended: one extra assistant sentence or a small `Sources · 3 files` row. Keep it compact and consistent with the existing mini-UI style.

### 3.3 Mode section heading orphan

File: `frontend/src/features/chapters/components/features/ModeShowcase.tsx`

Current:

```tsx
<Reveal className="mx-auto max-w-3xl text-center">
```

At 1440px the heading `One workspace. Three ways to work.` wraps with the single word `work.` on the second line. Fix:

```tsx
<Reveal className="mx-auto max-w-4xl text-center">
```

Verify the heading is on one line at 1440px and wraps naturally at smaller widths.

### 3.4 Privacy heading orphan

File: `frontend/src/features/chapters/components/features/TrustSection.tsx`

Current:

```tsx
<Reveal className="mx-auto max-w-2xl text-center">
```

At 1440px the heading `Designed to keep your work private` leaves `private` alone on a second line. Fix:

```tsx
<Reveal className="mx-auto max-w-4xl text-center">
```

Verify no single-word orphan at desktop widths.

### 3.5 Capabilities heading on mobile

File: `CapabilityCarousel.tsx`

At 390px the heading currently breaks as:

```
Use Sara for work, study,
and everything in
between.
```

The single-word last line looks weak. Fix by reducing the base size (keep the responsive sizes):

```tsx
className="mt-4 text-[28px] font-medium leading-[1.1] tracking-[-0.04em] text-neutral-950 sm:text-[46px] md:text-[54px]"
```

The existing `<br className="hidden sm:block" />` after `study,` should stay. Check at 390px and 360px that the heading is balanced (ideally two lines, no single-word orphan).

### 3.6 Chat mode visual has a large empty gap

File: `frontend/src/features/chapters/components/features/ModeVisuals.tsx`

In `ChatVisual`, the composer currently has `mt-auto`, leaving a large empty area between the “Switched model mid-thread” line and the composer.

Fix: add a compact suggestion row immediately before the composer:

```tsx
<div className="mt-auto flex flex-wrap gap-1.5 pb-3">
  {["Compare the top risks", "Draft a one-page summary"].map((suggestion) => (
    <span
      key={suggestion}
      className="rounded-full border border-black/[0.07] bg-white px-2.5 py-1 text-[9.5px] font-medium text-neutral-500"
    >
      {suggestion}
    </span>
  ))}
</div>
```

Then remove `mt-auto` from the composer container (keep `flex items-center gap-2 ...`).

Check the other two visuals (`StudyVisual`, `BuildVisual`) for the same issue; they looked acceptable in screenshots, so only change them if they have the same obvious gap.

### 3.7 Final CTA microcopy

File: `frontend/src/features/chapters/components/features/FeatureCta.tsx`

Current line:

```tsx
<p className="mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
  No setup required · Bring your own keys when you’re ready
</p>
```

The uppercase + wide tracking wraps awkwardly on mobile. Replace with sentence case:

```tsx
<p className="mt-4 text-[11.5px] text-neutral-500">
  No setup required. Bring your own keys when you’re ready.
</p>
```

### 3.8 Accordion accessibility

File: `ModeShowcase.tsx`

The collapsed panels are still in the DOM (`grid-rows-[0fr] opacity-0`), so screen readers can read all three descriptions at once. Add:

```tsx
aria-hidden={!isActive}
```

to the panel `<div>` that has `id={`mode-panel-${mode.id}`}`.

Also add visible keyboard focus to the accordion trigger and carousel arrows:

```tsx
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2
```

Apply to the accordion `<button>` and both carousel arrow `<button>`s. Do not remove the existing hover/disabled styles.

### 3.9 Hero float verification

File: `FeatureHero.tsx`

The previous floating PR/agent card was intentionally removed because it covered the mockup content. Do **not** re-add it.

The remaining audit card is positioned at:

```tsx
className="absolute -right-36 top-6 hidden w-[190px] rotate-[2deg] ... min-[1400px]:block"
```

Verify at 1440px:
- It sits mostly to the right of the product window.
- It does not cover the chapter rail, risk rows, or composer.
- It is hidden below 1400px (this is intentional).
- It does not create horizontal page overflow.

If it overlaps the chapter rail, move it further right (`-right-40`) or up (`-top-2`), but keep it outside the window.

Also verify the decorative blue blob and asterisk do not cover meaningful mockup content.

### 3.10 Hero headline safety at small widths

File: `FeatureHero.tsx`

The headline is currently `text-[42px]` at base. At 390px it fits, but at 360px or 320px `chat, study & build` may overflow. Check at 360px. If it overflows, reduce the base size to `text-[38px]` (or `text-[36px]`) and keep `sm:text-[64px]` onward. Do not add `whitespace-nowrap`.

While there, inspect the comma after `chat`; it should be black, not blue. The colored span should contain only the word:

```tsx
<span className="text-[#2f91fd]">chat</span>,{" "}
```

---

## 4. Optional polish — ask the user before changing

Do not do these unilaterally; they affect shared surfaces or product positioning.

1. **Footer bio inconsistency.** `SaraFooter` says “The AI coding agent built to drive real engineering work across your entire stack.” The Features page positions Sara as chat + documents + building. A more consistent line would be “The workspace for questions, documents, and the work that ships.” This footer is shared with the home page, so ask first.
2. **Active nav state.** The navbar does not mark `Features` as active on `/features`. Adding `aria-current="page"` and a subtle underline/darker color would be nice, but the navbar is shared. Ask first.
3. **Section order.** Current order is: Modes → Capabilities → Privacy → Pricing → Inspired → CTA. The reference is: Modes → Capabilities → Pricing → Safety → Inspired → CTA. Swapping Privacy and Pricing would match the reference more closely, but the current order is logical. Ask first.

---

## 5. Design system constraints

Use the existing tokens and patterns; do not introduce a new visual language.

- Background: pure white `bg-white`.
- Primary text: `text-neutral-950`; secondary: `text-neutral-600` / `text-neutral-500`.
- Light cards: `bg-[#f5f5f5]`.
- Borders: `border-neutral-200` or `border-black/[0.06]`.
- Black pills: `bg-neutral-950 text-white`, rounded-full, 44px tall for primary CTAs.
- Accent blue: `#2f91fd`.
- Accent amber: `#de9c2f` (headline) / `#f4bd50` (decorative).
- Accent lilac: `#7c7cf0`; periwinkle: `#b6affe`.
- Font: Figtree is global. Do not add a font.
- Tracking: headlines use `tracking-[-0.04em]` / `[-0.045em]`.
- Radii: cards `rounded-[24px]`, large panels `rounded-[28px]`, pills `rounded-full`.
- Section rhythm: `py-20 sm:py-28`, panels `pb-20 sm:pb-28`.
- All motion must respect `prefers-reduced-motion`; the existing `Reveal` component and `.feature-rise` already do.

Do not use raster screenshots or stock images. All product visuals must stay pure HTML/CSS/SVG.

---

## 6. Verification protocol

### 6.1 Static checks

From the repo root:

```bash
cd frontend && npm run typecheck
cd .. && npx eslint frontend/src/features/chapters/components/features frontend/src/features/chapters/pages/FeaturesPage.tsx frontend/src/features/chapters/data/featuresContent.ts
cd frontend && npm run build
```

Notes:
- `LandingView.tsx` has pre-existing unused-import warnings. Do not treat those as new failures.
- Your new files must produce **zero** new lint warnings or errors.
- `npm run build` must pass.

### 6.2 Run the page

```bash
cd frontend && npm run dev
```

If port 5173 is busy, Vite will choose 5174 or the next free port. Use the URL it prints.

### 6.3 Screenshots — important gotcha

The page scrolls inside `.openedup-home` (`h-dvh overflow-y-auto`), so a normal `--full-page` screenshot only captures the viewport. Two options:

**Option A — tall viewport (quick full-page check):**

```bash
npx playwright screenshot \
  --channel=chrome \
  --viewport-size=1440,7000 \
  --wait-for-timeout=3000 \
  http://localhost:5174/features /tmp/features-tall.png
```

**Option B — section-by-section (recommended):**

Create a temporary `.mjs` script in the repo root and delete it afterward:

```js
import { chromium } from "playwright";

const OUT = "/tmp/sara-features-shots";
const browser = await chromium.launch({ channel: "chrome" });

async function capture(name, width, height, positions) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto("http://localhost:5174/features", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  for (const [label, index, offset] of positions) {
    await page.evaluate(
      ({ index, offset }) => {
        const scroller = document.querySelector(".openedup-home");
        const sections = document.querySelectorAll("main > section");
        const target = index === -1 ? null : sections[index];
        const top = target
          ? target.getBoundingClientRect().top + scroller.scrollTop + offset
          : offset;
        scroller.scrollTo({ top, behavior: "instant" });
      },
      { index, offset }
    );
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${name}-${label}.png` });
  }
  await page.close();
}

await capture("d", 1440, 900, [
  ["hero", -1, 0],
  ["mockup", -1, 620],
  ["modes", 1, -60],
  ["capabilities", 2, -40],
  ["privacy", 3, -40],
  ["pricing", 4, -120],
  ["cta", 6, -60],
]);

await capture("m", 390, 844, [
  ["hero", -1, 0],
  ["hero2", -1, 700],
  ["modes", 1, -40],
  ["capabilities", 2, -30],
  ["privacy", 3, -30],
  ["pricing", 4, -40],
  ["cta", 6, -30],
]);

await browser.close();
```

`mkdir -p /tmp/sara-features-shots` first. Then inspect the PNGs.

### 6.4 Interaction checks

Use the browser or a Playwright script to verify:

| Interaction | Expected |
| --- | --- |
| Click `Study` in the mode accordion | Study panel expands, Chat collapses, right visual swaps to the PDF/chapter view |
| Click `Build` | Build panel expands, right visual swaps to the dark agent/diff view |
| Use keyboard Tab + Enter on the mode triggers | Each mode switches; focus ring is visible |
| Click carousel right arrow | Cards scroll one card width; left arrow enabled, right disabled at the end |
| Click carousel left arrow | Returns to first card; first card remains inset, not flush at x=0 |
| Click `See how it works` | Smooth-scrolls to `#modes` |
| Click `View pricing` | Navigates to `/` and scrolls to `#pricing` |
| Click `Get Started` / `Go to Cloud` | Navigate to `/chat` |
| Open mobile menu | Drawer opens and closes; links navigate correctly |
| Resize to 390px | No page-level horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`) |
| Check console | No uncaught errors or React warnings |

The carousel itself may scroll horizontally; the document must not.

---

## 7. Definition of done

The task is complete when:

1. All P0 items in section 3 are implemented.
2. The page is visually clean at `1440`, `1280`, `1024`, `768`, `390`, and `360` widths.
3. No decorative element covers the product mockup or real content.
4. No heading has a single-word orphan on desktop.
5. The first carousel card is inset like the heading, and the carousel arrows work.
6. The mode accordion, carousel, CTAs, and navigation all work with mouse and keyboard.
7. `npm run typecheck`, the targeted ESLint command, and `npm run build` pass.
8. No new dependencies, no new raster assets, no backend changes.
9. You provide a short summary of changes plus 3–5 final screenshots (desktop hero, modes, capabilities, mobile hero, mobile capabilities).

---

## 8. Do not

- Do not rewrite the page from scratch or rename files.
- Do not change the `/features` route or the `App.tsx` wiring.
- Do not modify the backend, contracts, chat, benchmarks, or results pages.
- Do not change the home landing page except for the existing hash-scroll helper in `LandingView.tsx`.
- Do not re-add the large floating PR/agent card in the hero. It was removed because it covered the mockup.
- Do not add stock photos, screenshots, or image assets.
- Do not add a UI library, animation library, or icon package.
- Do not commit or push. Leave the changes uncommitted for review.
- Do not change shared navbar/footer copy without asking the user first.

---

## 9. Reference notes (for taste, not copying)

The reference page communicates three things that this page should preserve:

1. **One product, several modes.** The Chat/Work/Codex accordion becomes Chat/Study/Build. The visual on the right should always show the mode being described.
2. **Breadth without a feature dump.** The horizontal capability carousel shows range in a compact, browsable strip. Keep the cards large and calm, not dense.
3. **A clean finish.** Large white space, a single light-gray pricing panel, and a soft branded CTA. Avoid adding more sections or more colors.
