import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { connectSocket } from './src/services/socket.service';

LogBox.ignoreLogs(['Non-serializable values', 'Require cycle']);

function AppContent() {
  const token = store.getState().auth.token;

  useEffect(() => {
    if (token) {
      connectSocket(token);
    }
  }, [token]);

  return (
    <>
      <StatusBar barStyle="light-content" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <AppContent />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
