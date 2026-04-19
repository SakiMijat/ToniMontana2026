/**
 * SafeGate — game registry.
 *
 * Single source of truth for the Control Panel tiles. When you consolidate
 * the games into a monorepo, just change each `href` from its localhost URL
 * to the final route (e.g. "/games/pisanje-unazad").
 */

export type GameStatus = "live" | "coming-soon";

export interface PanelGame {
  /** Short unique key — used for the URL-safe id and animation key */
  id: string;
  /** SI/HR display name */
  name: string;
  /** English subtitle — the cognitive domain it measures */
  subtitle: string;
  /** 1-sentence description of the mechanic */
  description: string;
  /** Test position in the 7-game suite (SafeGate spec §3) */
  position: string;
  /** Where clicking the tile takes the user */
  href: string;
  /** Whether the tile is fully playable */
  status: GameStatus;
  /** Lucide icon name — rendered via dynamic import in the tile */
  iconName: IconKey;
  /** Dominant accent color for the hover glow — uses SafeGate palette hex */
  accentHex: string;
}

/**
 * Supported icon keys. Kept as a narrow union so the tile component
 * can map safely at render time without pulling all lucide-react icons.
 */
export type IconKey =
  | "brain"
  | "zap"
  | "target"
  | "palette"
  | "route"
  | "eye"
  | "grid3x3"
  | "split";

/**
 * Six tiles — five built + one coming-soon for the flagship WebGazer test.
 * Order follows the SafeGate spec's numbering where possible.
 */
export const PANEL_GAMES: readonly PanelGame[] = [
  {
    id: "ocular",
    name: "Ocular Pursuit",
    subtitle: "Ocular Pursuit",
    description:
      "Follow a moving dot with your eyes. Measures smooth-pursuit eye movement via WebGazer.",
    position: "Test 01 / 07",
    href: "/ocular",
    status: "live",
    iconName: "eye",
    accentHex: "#22d3ee",
  },
  {
    id: "tajmer-dugme",
    name: "Fast Reaction Time",
    subtitle: "Reflex",
    description:
      "Tap when the button turns from red to green. Measures reaction latency across 5 trials.",
    position: "Test 02 / 07",
    href: "/tajmer-dugme",
    status: "live",
    iconName: "zap",
    accentHex: "#22d3ee",
  },
  {
    id: "lavirint",
    name: "The Maze",
    subtitle: "Motor Control",
    description:
      "Navigate from start to exit without touching walls. Tests coordination and steadiness.",
    position: "Test 03 / 07",
    href: "/maze",
    status: "live",
    iconName: "route",
    accentHex: "#22d3ee",
  },
  {
    id: "pisanje-unazad",
    name: "Writing Back",
    subtitle: "Executive Function",
    description:
      "Memorize a 5-letter word and type it backward. Tests working memory and impulse control.",
    position: "Test 04 / 07",
    href: "/pisanje-unazad",
    status: "live",
    iconName: "brain",
    accentHex: "#22d3ee",
  },
  {
    id: "balans-indikator",
    name: "Balance Indicator",
    subtitle: "Motor Tracking",
    description:
      "Use left/right buttons to keep a drifting indicator inside the green zone for 15 seconds.",
    position: "Test 08 / 07+",
    href: "/balans-indikator",
    status: "live",
    iconName: "target",
    accentHex: "#22d3ee",
  },
  {
    id: "kartice-boja",
    name: "Color Cards",
    subtitle: "Impulse Control",
    description:
      "Does the swatch color match the word? Tap DA or NE across 5 Stroop trials.",
    position: "Test 07 / 07",
    href: "/kartice-boja",
    status: "live",
    iconName: "palette",
    accentHex: "#22d3ee",
  },
];
