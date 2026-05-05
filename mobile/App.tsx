import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/auth/AuthContext';
import { CGSalesmanProvider } from './src/cg/state';
import { PetsSalesmanProvider } from './src/pets/state';
import { ManagerProvider } from './src/manager/state';
import { CustomerProvider } from './src/customer/state';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PetsSalesmanProvider>
            <CGSalesmanProvider>
              <ManagerProvider>
                <CustomerProvider>
                  <RootNavigator />
                </CustomerProvider>
              </ManagerProvider>
            </CGSalesmanProvider>
          </PetsSalesmanProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
