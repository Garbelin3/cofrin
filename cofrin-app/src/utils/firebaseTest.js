import { auth, db } from '../config/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
    try {
        console.log('Testando conexão com Firebase...');

        // Teste do Firestore
        console.log('Testando Firestore...');
        const querySnapshot = await getDocs(collection(db, 'users'));
        console.log('Firestore conectado! Número de documentos:', querySnapshot.size);

        // Teste do Auth
        console.log('Testando Auth...');
        console.log('Auth conectado! Usuário atual:', auth.currentUser);

        return true;
    } catch (error) {
        console.error('Erro na conexão com Firebase:', error);
        return false;
    }
};

export const checkUserExists = async (email) => {
    try {
        console.log('Verificando se o usuário existe no Firestore...');

        // Buscar por email no Firestore
        const querySnapshot = await getDocs(collection(db, 'users'));
        let userFound = null;

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.email === email) {
                userFound = { id: doc.id, ...userData };
            }
        });

        if (userFound) {
            console.log('Usuário encontrado no Firestore:', userFound);
            return userFound;
        } else {
            console.log('Usuário não encontrado no Firestore');
            return null;
        }
    } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        return null;
    }
};

export const listAllUsers = async () => {
    try {
        console.log('Listando todos os usuários no Firestore...');
        const querySnapshot = await getDocs(collection(db, 'users'));

        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });

        console.log('Usuários encontrados:', users);
        return users;
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        return [];
    }
};
