import React from 'react';
import { StatusBar } from 'expo-status-bar';
import './src/config/firebase'; // Importar configuração do Firebase
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
