# UX & Design Spec

## Design Philosophy

> "Food tracking should feel motivating, not punishing."

Principles:
1. **Clarity over density** — show what matters now, hide the rest
2. **Optimistic UI** — log entries appear instantly, sync in background
3. **Celebrate progress** — streaks, milestones, positive reinforcement
4. **No shame, no moralizing** — remove color-coded good/bad food judgments (Foodvisor flaw)
5. **Accessible** — WCAG AA minimum, proper contrast ratios everywhere

---

## Design System

### Color Palette

```
Primary:     #16A34A   (green-600) — health, action, CTA
Primary-dark: #15803D  (green-700) — hover states
Accent:      #F59E0B   (amber-500) — calories, energy
Info:        #3B82F6   (blue-500)  — water, info
Surface:     #FFFFFF
Surface-alt: #F9FAFB   (gray-50)
Border:      #E5E7EB   (gray-200)
Text:        #111827   (gray-900)
Text-muted:  #6B7280   (gray-500)
```

**Macro colors** (consistent throughout — never reused for other meanings):
```
Protein:  #3B82F6   (blue-500)
Carbs:    #A855F7   (purple-500)   ← NOT amber (amber = calories accent)
Fat:      #EF4444   (red-500)
Fiber:    #10B981   (emerald-500)
```

**NO traffic-light food classification** (red = bad food). Status colors only for system states (error, warning, success).

### Typography

```
Font family: Inter (variable font)

Scale:
  display:  32px / 700 weight  — onboarding headlines
  h1:       24px / 600
  h2:       20px / 600
  h3:       16px / 600
  body:     14px / 400
  small:    12px / 400
  label:    11px / 500 / uppercase / tracking-wide
```

### Spacing

4px base unit. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

### Radii

```
sm:  6px   — chips, badges
md:  12px  — cards, inputs
lg:  16px  — sheets, modals
xl:  24px  — large cards
full: 9999px — pills, avatars
```

### Shadows

Minimal. Cards use `border + shadow-sm` only. No heavy elevation.

---

## Key UI Components

### Calorie Ring (Dashboard hero)
- Large donut chart (180px on mobile, 220px on tablet)
- Center: big number "850" (consumed), label "/ 1,850 kcal"
- Ring fill: primary green
- Overflow state (> 100%): ring turns rose-500 (#F43F5E), center text turns rose-500
- Animated fill on load (0 → current value, 600ms ease-out)

### Macro Bars
- 4 stacked horizontal bars below the ring
- Each: label, colored bar (fill %), "Xg / Yg"
- Tap to expand: full breakdown with food sources

### Meal Card
```
┌─────────────────────────────────────────┐
│ 🌅 Breakfast                 520 kcal  │
│ Greek yogurt, banana, oats...           │
│                              [+]       │
└─────────────────────────────────────────┘
```
- Tap to expand → list all entries
- Swipe left → edit / delete (per entry)
- "+" → log food modal

### Food Entry Row
```
Chicken breast (150g)        248 kcal
Protein ████░░░░  46g  Carbs ░░░░░ 0g  Fat ░ 3.6g
```

### Hydration Tile
- Water drop icon, fill animation
- "1,250 / 2,000 ml" progress
- Quick buttons: +250ml, +500ml, custom

### Log Food Bottom Sheet (mobile)
```
┌──────────────────────────────────┐
│  ▬▬▬▬▬                          │
│  Add to Lunch                   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │ 📷 │ │ 📊 │ │ 🔍 │ │ 🎙️ │   │
│  │Photo│ │Scan│ │Find│ │Voice│  │
│  └────┘ └────┘ └────┘ └────┘   │
│                                  │
│  Recent                         │
│  • Greek Yogurt (200g)          │
│  • Coffee, black                │
└──────────────────────────────────┘
```

### Streak Badge
```
🔥 12 days
```
- Shown on dashboard header
- Animation on new streak day: bounce + confetti (subtle)

---

## Empty States

Each empty state includes an illustration + guidance text + primary action.

| Screen | Empty state message | CTA |
|---|---|---|
| Journal (no logs) | "Start your day — log your first meal" | Log food |
| Analytics (< 3 days data) | "Log for 3+ days to see trends" | Go to journal |
| Recipes (no favorites) | "Save recipes you love here" | Browse recipes |
| Lessons (all done) | "You've completed today's lessons. Come back tomorrow." | Browse all |

---

## Onboarding UX

- One question per screen (not a wall of form)
- Large tap targets for selection options
- Immediate feedback: selecting an option shows subtle highlight, no "next" needed for single-select
- Progress bar at top (not a stepper — just a thin filled bar)
- Tone: warm, conversational copy ("How do you want to feel?")
- Final summary: animate the calorie number counting up to target

---

## Motion & Transitions

- Page transitions: fade (150ms)
- List items: stagger-fade in (30ms per item)
- Calorie ring: fill animation on mount
- Toast: slide up from bottom, auto-dismiss 3s
- Bottom sheet: spring animation up (CSS `transition + cubic-bezier(0.32, 0.72, 0, 1)`)
- Number changes: animate count (kcal updates after logging)

---

## Accessibility

- All interactive elements: min 44×44px tap target
- Focus rings: visible, custom styled (2px primary)
- Screen reader labels on all icon-only buttons
- Reduced motion: respect `prefers-reduced-motion`
- Color contrast: minimum 4.5:1 (text), 3:1 (large text, UI components)
- No information conveyed by color alone (always text/icon backup)

---

## Responsive Layout

### Mobile (< 640px)
- Bottom tab bar (5 items)
- Full-screen log flows
- Cards stack vertically
- FAB "+" button (bottom right)

### Tablet (640–1024px)
- Left side panel (collapsible)
- Log modal as side panel
- Dashboard: 2 columns (ring + macros left, meals right)

### Desktop (> 1024px)
- Fixed left sidebar
- Dashboard: 3 columns
- Journal: sidebar calendar + main content
- Analytics: large charts
