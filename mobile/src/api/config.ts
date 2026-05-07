/**
 * Backend API base URL.
 *
 * Resolution order:
 *  1. EXPO_PUBLIC_API_URL env var (read at build time by Expo).
 *     Set this in mobile/.env when deploying:
 *        EXPO_PUBLIC_API_URL=https://akvopura-backend.onrender.com
 *  2. Fall back to the dev LAN IP for local development. The phone has
 *     to be on the SAME Wi-Fi as the laptop. To find your laptop's IP
 *     run `ipconfig` (Windows) or `ifconfig` (mac/linux).
 *  3. On `expo start --web` the laptop IS the phone, so localhost works.
 *
 * After changing .env you MUST stop and restart `npx expo start` —
 * Expo only reads env vars on startup.
 */

import { Platform } from 'react-native';

/** The dev machine's LAN IP (visible to the phone). Update when you
 *  switch networks. */
const LAN_IP = '192.168.1.3';
const PORT = 3000;

const envUrl = process.env.EXPO_PUBLIC_API_URL;

function devFallback(): string {
  return Platform.OS === 'web'
    ? `http://localhost:${PORT}`
    : `http://${LAN_IP}:${PORT}`;
}

/** Trim trailing slash so callers can do `${API_BASE_URL}/orders`. */
function normalise(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export const API_BASE_URL = normalise(envUrl && envUrl.length > 0 ? envUrl : devFallback());
