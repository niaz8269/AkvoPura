import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/auth/AuthContext';
import { CGSalesmanProvider } from './src/cg/state';
import { PetsSalesmanProvider } from './src/pets/state';
import { ManagerProvider } from './src/manager/state';
import { CustomerProvider } from './src/customer/state';
import { PricingProvider } from './src/pricing/state';
import { AssignmentsProvider } from './src/assignments/state';
import { EmployeesProvider } from './src/employees/state';
import { ProductionProvider } from './src/production/state';
import { TutorialProvider } from './src/tutorial/state';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PricingProvider>
            <PetsSalesmanProvider>
              <CGSalesmanProvider>
                <AssignmentsProvider>
                  <EmployeesProvider>
                    <ProductionProvider>
                      <ManagerProvider>
                        <CustomerProvider>
                          <TutorialProvider>
                            <RootNavigator />
                          </TutorialProvider>
                        </CustomerProvider>
                      </ManagerProvider>
                    </ProductionProvider>
                  </EmployeesProvider>
                </AssignmentsProvider>
              </CGSalesmanProvider>
            </PetsSalesmanProvider>
          </PricingProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
