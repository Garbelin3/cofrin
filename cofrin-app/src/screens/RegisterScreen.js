import React, { useState } from 'react';
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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import GlassCard from '../components/GlassCard';
import { useThemeColors } from '../theme/useTheme';

const RegisterScreen = ({ navigation }) => {
    const { colors } = useThemeColors();
    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const formatCPF = (text) => {
        // Remove tudo que não é dígito
        const numbers = text.replace(/\D/g, '');

        // Aplica a máscara do CPF
        if (numbers.length <= 3) {
            return numbers;
        } else if (numbers.length <= 6) {
            return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
        } else if (numbers.length <= 9) {
            return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
        } else {
            return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
        }
    };

    const validateCPF = (cpf) => {
        // Remove caracteres não numéricos
        const numbers = cpf.replace(/\D/g, '');

        if (numbers.length !== 11) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(numbers)) return false;

        // Validação do primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(numbers[i]) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(numbers[9])) return false;

        // Validação do segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(numbers[i]) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(numbers[10])) return false;

        return true;
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    const handleRegister = async () => {
        console.log('Iniciando processo de registro...');

        // Validações
        if (!name || !cpf || !email || !password || !confirmPassword) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos');
            return;
        }

        console.log('Validando CPF:', cpf);
        if (!validateCPF(cpf)) {
            Alert.alert('Erro', 'CPF inválido');
            return;
        }

        console.log('Validando email:', email);
        if (!validateEmail(email)) {
            Alert.alert('Erro', 'Email inválido');
            return;
        }

        console.log('Validando senha...');
        if (!validatePassword(password)) {
            Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem');
            return;
        }

        setLoading(true);
        try {
            console.log('Criando usuário no Firebase Auth...');
            // Criar usuário no Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('Usuário criado no Auth:', user.uid);

            console.log('Salvando dados no Firestore...');
            // Salvar dados adicionais no Firestore
            const cleanCPF = cpf.replace(/\D/g, '');
            await setDoc(doc(db, 'users', cleanCPF), {
                uid: user.uid,
                name: name,
                cpf: cleanCPF,
                email: email,
                createdAt: new Date(),
            });
            console.log('Dados salvos no Firestore com sucesso');

            Alert.alert(
                'Sucesso',
                'Conta criada com sucesso!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Login')
                    }
                ]
            );

        } catch (error) {
            console.error('Erro detalhado no registro:', error);
            console.error('Código do erro:', error.code);
            console.error('Mensagem do erro:', error.message);

            let errorMessage = 'Erro ao criar conta';

            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este email já está em uso';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'A senha é muito fraca';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Erro de conexão. Verifique sua internet';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
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
                        <Text style={[styles.title, { color: colors.primary }]}>Criar Conta</Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Preencha os dados para se cadastrar</Text>
                    </View>

                    <GlassCard style={styles.formCard}>
                        <View style={styles.form}>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    color: colors.text
                                }]}
                                placeholder="Nome completo"
                                placeholderTextColor={colors.textMuted}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />

                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    color: colors.text
                                }]}
                                placeholder="CPF"
                                placeholderTextColor={colors.textMuted}
                                value={cpf}
                                onChangeText={(text) => setCpf(formatCPF(text))}
                                keyboardType="numeric"
                                maxLength={14}
                            />

                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    color: colors.text
                                }]}
                                placeholder="Email"
                                placeholderTextColor={colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />

                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    color: colors.text
                                }]}
                                placeholder="Senha"
                                placeholderTextColor={colors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                            />

                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    color: colors.text
                                }]}
                                placeholder="Confirmar senha"
                                placeholderTextColor={colors.textMuted}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                autoCapitalize="none"
                            />

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    { backgroundColor: colors.primary },
                                    loading && { backgroundColor: colors.border }
                                ]}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? 'Criando conta...' : 'Criar conta'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.linkButton}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={[styles.linkText, { color: colors.secondary }]}>
                                    Já tem uma conta? Faça login
                                </Text>
                            </TouchableOpacity>
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
});

export default RegisterScreen;
