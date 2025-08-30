import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import GoalsScreen from '../screens/GoalsScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import MaterialDetailScreen from '../screens/MaterialDetailScreen';
import CreditCardsScreen from '../screens/CreditCardsScreen';
import Toast from '../components/Toast';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Gestão' }} />
            <Tab.Screen name="Goals" component={GoalsScreen} options={{ tabBarLabel: 'Metas' }} />
            <Tab.Screen name="Materials" component={MaterialsScreen} options={{ tabBarLabel: 'Didático' }} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const [toastMessage, setToastMessage] = useState('');

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login">
                    {(props) => <LoginScreen {...props} onLoginSuccess={() => setToastMessage('Login realizado com sucesso')} />}
                </Stack.Screen>
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
                <Stack.Screen name="MaterialDetail" component={MaterialDetailScreen} />
                <Stack.Screen name="CreditCards" component={CreditCardsScreen} />
            </Stack.Navigator>
            <Toast message={toastMessage} onHide={() => setToastMessage('')} />
        </NavigationContainer>
    );
};

export default AppNavigator;
