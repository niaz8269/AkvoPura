/**
 * AkvoPura color palette — water/freshness theme.
 * Status colors (white/yellow/red/green) match the spec for Cans/Gallons customer cards.
 */

export const colors = {
  // Brand
  primary: '#0A6CB7',        // deep water blue
  primaryDark: '#054E86',
  primaryLight: '#3FA0E0',
  accent: '#00B5C2',         // teal — fresh water

  // Surfaces
  background: '#F4FAFE',     // very light blue-white
  surface: '#FFFFFF',
  surfaceMuted: '#EAF3FA',

  // Text
  text: '#0E2233',
  textMuted: '#5C7184',
  textInverse: '#FFFFFF',

  // Borders / dividers
  border: '#D5E3EE',

  // Status colors (used for Cans/Gallons customer cards)
  statusWhite: '#FFFFFF',    // no dues, no empties
  statusYellow: '#FFD66E',   // empties held, no dues
  statusOrange: '#F2913A',   // debt only, no empties
  statusRed: '#E5564D',      // empties held + dues
  statusGreen: '#3DBE6C',    // delivered today

  // Semantic
  success: '#2EA66A',
  warning: '#E8A53C',
  danger: '#D9433A',
  info: '#1F8FCA',

  // Shadow (for cards)
  shadow: 'rgba(10, 108, 183, 0.12)',
};
