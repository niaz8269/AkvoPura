/**
 * Backend API base URL.
 *
 * Phone needs to be on the SAME Wi-Fi as the dev laptop. To find your
 * laptop's IP run `ipconfig` (Windows) or `ifconfig` (mac/linux) and
 * look for the IPv4 Address under your active Wi-Fi adapter.
 *
 * Update LAN_IP when you switch networks.
 *
 * Production builds will swap this for a hosted URL once we deploy.
 */

import { Platform } from 'react-native';

/** The dev machine's LAN IP (visible to the phone). */
const LAN_IP = '192.168.1.3';
const PORT = 3000;

/** When developing in a desktop browser via `expo start --web`,
 *  localhost works. Native (phone) needs the LAN IP. */
export const API_BASE_URL =
  Platform.OS === 'web'
    ? `http://localhost:${PORT}`
    : `http://${LAN_IP}:${PORT}`;
