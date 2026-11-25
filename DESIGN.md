# Bramwell — design system

A contemporary business house with the manner of an old English one. The page is set like a
letterpress prospectus: a dark green cover, warm paper for the body, a dark close. Ornament is
engraver's geometry — hairlines, rules, a seal — never illustration, never a gradient.

## Colour

| Token | Hex | Role |
|---|---|---|
| `forest` | `#19352D` | Cover, contact, dark ground |
| `forest-deep` | `#11241D` | Panels sitting on forest |
| `ivory` | `#F5F1E8` | Paper ground, primary type on dark |
| `ivory-dim` | `#ECE7D9` | Tinted band (Our Approach) |
| `charcoal` | `#292B28` | Body type, footer ground |
| `brass` | `#B69A65` | Rules, diamonds, seals, type on dark |
| `brass-ink` | `#7C6435` | Brass text on paper (4.9:1) |
| `sage` | `#A5B2A0` | Scrollbar thumb, quiet marks |
| `sage-soft` | `#E7E9DD` | Service cell hover |
| `clay` | `#F0C6AE` | Form errors on forest |

Rules of use:

- Brass as **decoration** on paper is fine at hairline weight; brass as **text** on paper must be
  `brass-ink`. `brass` on paper is 2.3:1 and only ever a line or a fill.
- Body text on paper is `charcoal` at 70–80% (5.1:1 or better). Small labels on forest are ivory at
  60% or more; never below.
- Elevation is a border or a rule, never a shadow. No card has both.

## Type

- Display — **Cormorant Garamond**, weight 400, line-height 0.98, tracking −0.02em. Maximum 6rem.
  Used roman for statements, italic for the second hero line and nowhere else on the page.
- Text — **Manrope**, 400/500, 16–17px, line-height 1.7–1.8, measure 46–62ch.
- `.label` — Manrope 11px, 500, uppercase, tracking 0.2em. Navigation, eyebrows, captions,
  column headings, numerals.
- Numerals are tabular in all lists (`01`–`06`, `I`–`III`) so columns align.

## Structure

- `.gutter` — max 1400px, padding 24 / 40 / 56px. All sections share it.
- Vertical rhythm: `py-24 md:py-32 lg:py-40`; more space above a heading than below it.
- Section separators are a 1px `charcoal/15` rule; the approach band uses `.rule-double` (two
  1px rules 6px apart) as the one letterpress flourish.
- Services are a lattice: a `gap-px` grid over a `charcoal/15` ground, cells filled with the page
  colour. No radii, no shadows, no floating cards.
- The process timeline is one hairline with 7px brass diamonds set at 45°.

## Marks

`<Emblem />` is the house seal: concentric rings, a 72-tick ring rotating once every 200s,
four cardinal diamonds, a serif B. It is pure geometry — no pictorial SVG anywhere on the page.

## Motion

- One entrance language: 18px rise with opacity, 0.8s, `cubic-bezier(0.16, 1, 0.3, 1)`, once.
- Hero: two headline lines clip-reveal upward, 0.1s apart; copy and CTAs follow at 0.5s and 0.62s.
- Hover: a brass hairline grows across a service cell (700ms) while the ground warms one step.
- `prefers-reduced-motion` removes the seal rotation, collapses all transitions, and disables
  smooth scrolling and every entrance transform.

## Browser surfaces

Selection is brass on forest. The caret is forest on paper, ivory on dark. The scrollbar is a
floating sage thumb on a transparent track. Focus is a 2px brass outline, 3px offset, brass-ink on
paper and brass on dark.
