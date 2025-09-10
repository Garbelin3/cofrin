import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/Feather';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { testFirebaseConnection, listAllUsers, checkUserExists } from '../utils/firebaseTest';
import GlassCard from '../components/GlassCard';
import { useThemeColors } from '../theme/useTheme';

const LoginScreen = ({ navigation, onLoginSuccess }) => {
    const { colors } = useThemeColors();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Testar conexão com Firebase quando a tela carregar
        testFirebaseConnection();
    }, []);

    const handleTestUsers = async () => {
        console.log('=== TESTANDO USUÁRIOS CADASTRADOS ===');
        const users = await listAllUsers();
        if (users.length > 0) {
            console.log('Usuários encontrados:', users);
            Alert.alert('Usuários Cadastrados', `Encontrados ${users.length} usuário(s) no sistema.`);
        } else {
            console.log('Nenhum usuário encontrado');
            Alert.alert('Usuários Cadastrados', 'Nenhum usuário encontrado no sistema.');
        }
    };

    const toggleShowPassword = () => setShowPassword(s => !s);

    const handleLogin = async () => {
        console.log('=== INICIANDO PROCESSO DE LOGIN ===');
        console.log('Identificador:', identifier);
        console.log('Senha fornecida:', password ? '***' : 'vazia');

        if (!identifier || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos');
            return;
        }

        setLoading(true);
        try {
            // Verificar se é email ou CPF
            const isEmail = identifier.includes('@');
            let email = identifier;

            console.log('Tipo de identificador:', isEmail ? 'Email' : 'CPF');

            if (!isEmail) {
                console.log('Buscando email pelo CPF:', identifier);
                // Se não for email, buscar o email pelo CPF no Firestore
                const usersRef = doc(db, 'users', identifier);
                const userDoc = await getDoc(usersRef);

                if (!userDoc.exists()) {
                    console.log('CPF não encontrado no Firestore');
                    Alert.alert('Erro', 'CPF não encontrado');
                    setLoading(false);
                    return;
                }

                email = userDoc.data().email;
                console.log('Email encontrado pelo CPF:', email);
            }

            console.log('Tentando fazer login com email:', email);
            // Fazer login com email e senha
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Login realizado com sucesso!');
            console.log('UID do usuário:', userCredential.user.uid);
            console.log('Email do usuário:', userCredential.user.email);

            // Navegar para a aba principal e disparar toast
            onLoginSuccess && onLoginSuccess();
            navigation.replace('Main');

        } catch (error) {
            console.error('=== ERRO NO LOGIN ===');
            console.error('Código do erro:', error.code);
            console.error('Mensagem do erro:', error.message);
            console.error('Stack trace:', error.stack);

            let errorMessage = 'Erro ao fazer login';

            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Usuário não encontrado';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Senha incorreta';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Erro de conexão. Verifique sua internet';
                    break;
                case 'auth/invalid-credential':
                    errorMessage = 'Credenciais inválidas';
                    break;
                default:
                    errorMessage = `Erro: ${error.message}`;
            }

            Alert.alert('Erro', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.primary }]}>Cofrin</Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Faça login para continuar</Text>
                    </View>

                    <GlassCard style={styles.formCard}>
                        <View style={styles.form}>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    color: colors.text
                                }]}
                                placeholder="CPF ou Email"
                                placeholderTextColor={colors.textMuted}
                                value={identifier}
                                onChangeText={setIdentifier}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                returnKeyType="next"
                                importantForAutofill="yes"
                                textContentType="username"
                            />

                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                        color: colors.text,
                                        paddingRight: 48
                                    }]}
                                    placeholder="Senha"
                                    placeholderTextColor={colors.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    returnKeyType="done"
                                    importantForAutofill="yes"
                                    textContentType="password"
                                    accessibilityLabel="Campo senha"
                                />

                                <TouchableOpacity
                                    onPress={toggleShowPassword}
                                    style={styles.iconButton}
                                    accessibilityRole="button"
                                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                    accessibilityState={{ pressed: showPassword }}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Icon
                                        name={showPassword ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={colors.textMuted}
                                        accessible={false}
                                    />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    { backgroundColor: colors.primary },
                                    loading && { backgroundColor: colors.border }
                                ]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? 'Entrando...' : 'Entrar'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.linkButton}
                                onPress={() => navigation.navigate('Register')}
                            >
                                <Text style={[styles.linkText, { color: colors.secondary }]}>
                                    Não tem uma conta? Cadastre-se
                                </Text>
                            </TouchableOpacity>

                            {/* Botão de teste para verificar usuários */}
                            {/*<TouchableOpacity
                                style={styles.testButton}
                                onPress={handleTestUsers}
                            >
                                <Text style={styles.testButtonText}>
                                    Verificar Usuários Cadastrados
                                </Text>
                            </TouchableOpacity>*/}
                        </View>
                    </GlassCard>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardContainer: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 42,
        fontWeight: '800',
        marginBottom: 10,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    formCard: {
        padding: 24,
        borderRadius: 16,
    },
    form: {
        width: '100%',
    },
    input: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
        borderWidth: 1,
        fontWeight: '500',
    },
    passwordContainer: {
        position: 'relative',
    },
    iconButton: {
        position: 'absolute',
        right: 8,
        top: 12,
        height: 36,
        width: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    iconText: {
        fontSize: 18,
    },
    button: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    linkButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        fontSize: 16,
        fontWeight: '600',
    },
    testButton: {
        backgroundColor: '#28a745',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginTop: 20,
    },
    testButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
