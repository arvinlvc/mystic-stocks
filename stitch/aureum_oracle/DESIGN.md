# Design System: Digital Divination & Financial Wisdom

## 1. Overview & Creative North Star: "The Celestial Ledger"
This design system is built upon the "Celestial Ledger" Creative North Star. It rejects the sterile, utilitarian aesthetic of modern fintech in favor of a high-end editorial experience that feels both ancient and prophetic. We are not just displaying market data; we are revealing a hidden order.

The experience is defined by **Intentional Asymmetry** and **Tonal Depth**. Instead of a rigid, centered grid, use staggered layouts that mimic the flow of *Qi*. Overlap elements—such as a data visualization bleeding into a background Bagua pattern—to create a sense of multi-dimensional intelligence. This is a "living" system where financial movements are treated as cosmic shifts.

---

## 2. Colors: The Palette of the Void
Our palette is rooted in the depth of the cosmos, accented by the materials of high alchemy.

| Role | Token | Hex | Application |
| :--- | :--- | :--- | :--- |
| **Background** | `surface` | `#0e131e` | The infinite void; base level for all screens. |
| **Primary (Imperial Gold)** | `primary` | `#f2ca50` | The spark of wisdom. Used for CTAs and critical insights. |
| **Secondary (Jade Green)** | `secondary` | `#59de9b` | Growth, vitality, and positive market momentum. |
| **Tertiary (Cinnabar Red)** | `tertiary_container` | `#ff9785` | Alerts, warnings, and market corrections. |
| **Surface (High)** | `surface_container_highest` | `#303541` | Floating cards or active navigation states. |

### The "No-Line" Rule
To maintain the "mysterious and authoritative" vibe, **1px solid borders are strictly prohibited** for sectioning. Separation must be achieved through:
- **Background Shifts:** A `surface_container_low` section sitting directly on a `surface` background.
- **Tonal Transitions:** Use a soft gradient transition from `surface` to `surface_container` to guide the eye.

### The "Glass & Gradient" Rule
For a premium "High-Tech" feel, floating elements (modals, tooltips) should use **Glassmorphism**. Apply `surface_variant` at 60% opacity with a `20px` backdrop-blur. Use a subtle linear gradient on primary buttons (transitioning from `primary` to `primary_container`) to give them a weight and "soul" that flat colors lack.

---

## 3. Typography: The Union of Two Worlds
We utilize a high-contrast typographic scale to bridge the gap between traditional wisdom and modern data.

*   **The Oracle (Headlines):** Use **Noto Serif** for all `display` and `headline` roles. This typeface carries the weight of history and authority. Its serifs should feel sharp, almost etched.
*   **The Analyst (Data/Body):** Use **Manrope** for `body` and `title` roles. It is a clean, geometric sans-serif that ensures financial data is legible and objective.
*   **The Cipher (Labels):** Use **Space Grotesk** for `label` roles. Its monospaced characteristics evoke high-tech terminal readouts and cryptographic precision.

**Hierarchy Tip:** Pair a `display-md` (Noto Serif) header with a `label-md` (Space Grotesk) sub-header in `primary_fixed_dim` for a look that feels like a modern manuscript.

---

## 4. Elevation & Depth: Tonal Layering
In this design system, depth is not "shadowed"—it is "revealed."

*   **The Layering Principle:** Stack `surface-container` tiers to create hierarchy.
    *   *Level 0:* `surface` (The Void).
    *   *Level 1:* `surface_container_low` (General content areas).
    *   *Level 2:* `surface_container_high` (Interactive modules or active cards).
*   **Ambient Shadows:** If an element must float (e.g., an Orrery navigation wheel), use a shadow with a `48px` blur at 6% opacity, tinted with the `on_surface` color. Avoid pure black shadows.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline_variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Artifacts of Insight

### Buttons
- **Primary:** Roundedness `md`. Background: `primary_container`. Text: `on_primary_container`. Use a subtle inner glow (top-down) for a tactile, metallic feel.
- **Secondary:** Transparent background with a "Ghost Border" of `primary` at 20%. 
- **Interaction:** On hover, the background should "breathe"—a slow pulse of `surface_bright`.

### Cards & Lists
- **The Forbid Rule:** Never use divider lines. Separate list items using `spacing-4` (vertical white space) or by alternating background tones between `surface_container_low` and `surface_container_lowest`.
- **Anatomy:** Cards should have a `xl` (0.75rem) corner radius. Incorporate a faint, low-opacity Bagua pattern in the corner of recommendation cards to signify the "Sector" of the stock.

### The Orrery (Navigation/Data Viz)
- A bespoke component representing the solar system of the user's portfolio. Use `secondary` (Jade) for the orbits of gaining stocks and `tertiary` (Cinnabar) for those in decline. The center of the Orrery is always `primary` (Imperial Gold).

### Input Fields
- Use "Underline" style rather than boxed. The line is `outline_variant` at 30% opacity, turning into a solid `primary` glow when focused. Labels use `label-md` in `on_surface_variant`.

---

## 6. Do's and Don'ts

### Do:
- **Use Qi Lines:** Use thin, flowing SVG paths (`outline` token at 20% opacity) to connect related data points across the screen, guiding the user's eye through the "financial flow."
- **Embrace Asymmetry:** Place a large `display-lg` headline off-center to create a modern, editorial composition.
- **Respect the Void:** Leave significant empty space (`spacing-12` or higher) to allow the "wisdom" to breathe.

### Don't:
- **No Sharp Red/Green:** Do not use default #FF0000 or #00FF00. Only use Cinnabar and Jade. We are sophisticated, not a generic trading app.
- **No 1px Borders:** This is the quickest way to make the app look like a template. Use background shifts instead.
- **No Standard Icons:** Avoid "Material Design" default icons. Use custom, thin-stroke icons that feel like alchemical symbols.

---

## 7. Signature Textures
To complete the aesthetic, apply a subtle grain filter over the entire `surface`. This "digital parchment" effect softens the glow of the Imperial Gold and makes the dark midnight blue backgrounds feel more tangible and premium.