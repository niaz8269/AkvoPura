import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/auth/AuthContext';
import { CGSalesmanProvider } from './src/cg/state';
import { PetsSalesmanProvider } from './src/pets/state';
import { ManagerProvider } from './src/manager/state';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PetsSalesmanProvider>
          <CGSalesmanProvider>
            <ManagerProvider>
              <RootNavigator />
            </ManagerProvider>
          </CGSalesmanProvider>
        </PetsSalesmanProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
