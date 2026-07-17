/**
 * Global navigation ref for imperative navigation from components that
 * don't have access to a navigator (e.g., the ActiveTripBanner which
 * floats above every screen).
 */

import { createNavigationContainerRef } from '@react-navigation/native';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const navigationRef = createNavigationContainerRef<any>();
