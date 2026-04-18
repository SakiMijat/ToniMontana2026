# 🎨 SafeGate Design System & UI/UX Guidelines

**Theme:** Cyber-Automotive / Medical Precision
**Primary Goal:** High legibility for potentially impaired users, using high-contrast elements and large touch targets.

---

## 🌈 1. Color Palette (Tailwind Tokens)
We use a "Status-Driven" color palette to give immediate feedback without requiring the user to read fine print.

* **Background (Slate-950):** `#020617` — Deep matte black to reduce eye strain.
* **Surface (Slate-900):** `#0f172a` — Cards and game containers.
* **Primary (Cyan-400):** `#22d3ee` — The "SafeGate Glow" for active interactive elements.
* **Success (Emerald-500):** `#10b981` — Passing scores / Tier 1 status.
* **Warning (Amber-400):** `#fbbf24` — Tier 2 / Recalibration phase.
* **Danger (Rose-600):** `#e11d48` — Tier 3 / Denied access.

---

## 📐 2. Layout & Geometry
* **Border Radius:** `xl` (12px) for a modern, friendly but tech-focused feel.
* **Borders:** Use `border-slate-800` for subtle separation.
* **Shadows:** Glow effects for active games: `shadow-[0_0_20px_rgba(34,211,238,0.3)]`.
* **Touch Targets:** Minimum height of `48px` for all buttons (to account for motor-control issues).

---

## 🖋️ 3. Typography (shadcn/ui Standard)
* **Font:** Inter or Geist (Sans-serif).
* **Headings:** `font-bold tracking-tight text-slate-50`.
* **Instructions:** `text-slate-400 font-medium`.
* **Live Metrics:** Use a Monospace font (`font-mono`) for reaction times ($ms$) and coordinates $(x, y)$ to imply technical precision.

---

## 🎮 4. Component-Specific Design (Consistency Checklist)

### A. The Game Header
Every game must include a sticky top bar:
* **Left:** Game Title (e.g., "Ocular Pursuit").
* **Center:** Countdown Timer (Framer Motion "pulse" effect when < 3s).
* **Right:** Progress Dots (e.g., Game 1 of 3).

### B. The "WebGazer" Gaze Dot
* **Visual:** A ring-within-a-ring design.
* **Color:** `Primary (Cyan-400)` with a 50% opacity pulse.
* **Logic:** When the user is "off-target," the ring turns `Amber`.

### C. Tier Feedback (Result Screen)
* **Approved:** Emerald gradient background with a "Vehicle Unlocked" icon.
* **Denied:** Rose-600 glow with a "Call Taxi" button prominently displayed as the primary action.

---

## ✨ 5. Motion Guidelines (Framer Motion)
* **Transitions:** `type: "spring", stiffness: 300, damping: 30`.
* **Game Transitions:** Always use a `Slide-In` from the right for new games and `Slide-Out` to the left for completed ones.
* **Feedback:** Shake animation on `Danger` status or game errors.

---
 
## 🤖 6. AI Prompt Template for UI
*Copy/Paste this to your AI Chatbot when generating a new game:*
> "Act as a frontend expert. Build a [Game Name] component for SafeGate. Follow the SafeGate Design System: Background #020617, Cyan-400 primary accents, and shadcn/ui buttons. Ensure the component is mobile-responsive, uses Framer Motion for entry/exit, and follows the 'High-Contrast Automotive' aesthetic."