import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, serverTimestamp, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import GlassCard from '../components/GlassCard';
import { useThemeColors } from '../theme/useTheme';

const expenseCategories = ['Alimentação', 'Transporte', 'Lazer', 'Moradia', 'Saúde', 'Outros'];
const incomeCategories = ['Salário', 'Renda Extra', 'Freelance', 'Investimentos', 'Presente', 'Outros'];

const AddTransactionScreen = ({ navigation }) => {
    const { colors } = useThemeColors();
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Outros');
    const [bank, setBank] = useState('Dia a Dia');
    const [banks, setBanks] = useState(['Dia a Dia']);
    const [isCreditCard, setIsCreditCard] = useState(false);
    const [installments, setInstallments] = useState('1');
    const [creditCards, setCreditCards] = useState([]);
    const [selectedCreditCard, setSelectedCreditCard] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Buscar bancos do usuário
        const q = query(collection(db, 'banks'), where('uid', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => {
            const bankList = snap.docs.map((d) => d.data().name);
            setBanks(['Dia a Dia', ...bankList]);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Buscar cartões de crédito do usuário
        const q = query(collection(db, 'creditCards'), where('uid', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => {
            const cardList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setCreditCards(cardList);
        });
        return () => unsub();
    }, []);

    // Atualizar categoria quando mudar o tipo
    useEffect(() => {
        if (type === 'income') {
            setCategory('Salário');
            setIsCreditCard(false);
        } else {
            setCategory('Outros');
        }
    }, [type]);

    // Resetar cartão quando mudar tipo
    useEffect(() => {
        if (type === 'income') {
            setSelectedCreditCard('');
        }
    }, [type]);

    const calculateInstallmentAmount = () => {
        const total = parseFloat(String(amount).replace(',', '.'));
        const installmentsCount = parseInt(installments);
        if (total && installmentsCount > 0) {
            return (total / installmentsCount).toFixed(2);
        }
        return '0.00';
    };

    const generateInstallmentDates = () => {
        const dates = [];
        const currentDate = new Date();

        for (let i = 0; i < parseInt(installments); i++) {
            const installmentDate = new Date(currentDate);
            installmentDate.setMonth(currentDate.getMonth() + i);
            dates.push(installmentDate);
        }

        return dates;
    };

    const onSave = async () => {
        const value = parseFloat(String(amount).replace(',', '.'));
        if (!value || !description) {
            Alert.alert('Atenção', 'Informe valor e descrição.');
            return;
        }

        if (isCreditCard && !selectedCreditCard) {
            Alert.alert('Atenção', 'Selecione um cartão de crédito.');
            return;
        }

        setSaving(true);
        try {
            const user = auth.currentUser;

            if (isCreditCard && type === 'expense') {
                // Criar parcelas do cartão de crédito
                const installmentAmount = value / parseInt(installments);
                const installmentDates = generateInstallmentDates();

                for (let i = 0; i < parseInt(installments); i++) {
                    await addDoc(collection(db, 'transactions'), {
                        uid: user?.uid || null,
                        type: 'expense',
                        amount: installmentAmount,
                        description: `${description} (${i + 1}/${installments})`,
                        category,
                        bank: selectedCreditCard,
                        isCreditCard: true,
                        installmentNumber: i + 1,
                        totalInstallments: parseInt(installments),
                        originalAmount: value,
                        installmentDate: installmentDates[i],
                        createdAt: serverTimestamp(),
                    });
                }
            } else {
                // Transação normal
                await addDoc(collection(db, 'transactions'), {
                    uid: user?.uid || null,
                    type,
                    amount: Math.abs(value),
                    description,
                    category,
                    bank,
                    isCreditCard: false,
                    createdAt: serverTimestamp(),
                });
            }

            navigation.goBack();
        } finally {
            setSaving(false);
        }
    };

    const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={[styles.backTxt, { color: colors.secondary }]}>‹ Voltar</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Adicionar Transação</Text>
                <View style={{ width: 68 }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <GlassCard>
                        <View>
                            <View style={styles.row}>
                                <TouchableOpacity style={[styles.typeBtn, type === 'income' && styles.typeActiveIncome]} onPress={() => setType('income')}>
                                    <Text style={[styles.typeText, type === 'income' && { color: colors.primary }]}>Receita</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.typeBtn, type === 'expense' && styles.typeActiveExpense]} onPress={() => setType('expense')}>
                                    <Text style={[styles.typeText, type === 'expense' && { color: '#d32f2f' }]}>Despesa</Text>
                                </TouchableOpacity>
                            </View>

                            {type === 'expense' && (
                                <View style={styles.creditCardSection}>
                                    <TouchableOpacity
                                        style={[styles.creditCardToggle, isCreditCard && { backgroundColor: colors.primary }]}
                                        onPress={() => setIsCreditCard(!isCreditCard)}
                                    >
                                        <Text style={[styles.creditCardText, isCreditCard && { color: '#fff' }]}>
                                            💳 Cartão de Crédito
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {isCreditCard && type === 'expense' && (
                                <>
                                    <Text style={[styles.label, { color: colors.text }]}>Cartão</Text>
                                    <View style={styles.creditCardRow}>
                                        {creditCards.map((card) => (
                                            <TouchableOpacity
                                                key={card.id}
                                                style={[
                                                    styles.chip,
                                                    { borderColor: colors.border },
                                                    selectedCreditCard === card.name && { backgroundColor: '#e3f2fd', borderColor: colors.secondary }
                                                ]}
                                                onPress={() => setSelectedCreditCard(card.name)}
                                            >
                                                <Text style={[
                                                    styles.chipText,
                                                    { color: colors.text },
                                                    selectedCreditCard === card.name && { color: colors.secondary, fontWeight: '700' }
                                                ]}>
                                                    {card.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={[styles.label, { color: colors.text }]}>Parcelas</Text>
                                    <View style={styles.installmentRow}>
                                        {['1', '2', '3', '6', '12'].map((num) => (
                                            <TouchableOpacity
                                                key={num}
                                                style={[
                                                    styles.chip,
                                                    { borderColor: colors.border },
                                                    installments === num && { backgroundColor: '#e3f2fd', borderColor: colors.secondary }
                                                ]}
                                                onPress={() => setInstallments(num)}
                                            >
                                                <Text style={[
                                                    styles.chipText,
                                                    { color: colors.text },
                                                    installments === num && { color: colors.secondary, fontWeight: '700' }
                                                ]}>
                                                    {num}x
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {parseInt(installments) > 1 && (
                                        <View style={styles.installmentInfo}>
                                            <Text style={[styles.installmentText, { color: colors.textMuted }]}>
                                                Valor da parcela: R$ {calculateInstallmentAmount()}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}

                            {!isCreditCard && (
                                <>
                                    <Text style={[styles.label, { color: colors.text }]}>Banco</Text>
                                    <View style={styles.bankRow}>
                                        {banks.map((b) => (
                                            <TouchableOpacity key={b} style={[styles.chip, { borderColor: colors.border }, bank === b && { backgroundColor: '#e3f2fd', borderColor: colors.secondary }]} onPress={() => setBank(b)}>
                                                <Text style={[styles.chipText, { color: colors.text }, bank === b && { color: colors.secondary, fontWeight: '700' }]}>{b}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}

                            <Text style={[styles.label, { color: colors.text }]}>Valor</Text>
                            <TextInput
                                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                placeholder="Ex: 120.50"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="decimal-pad"
                                value={amount}
                                onChangeText={setAmount}
                                returnKeyType="next"
                            />

                            <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
                            <TextInput
                                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                placeholder="Ex: Supermercado, Salário"
                                placeholderTextColor={colors.textMuted}
                                value={description}
                                onChangeText={setDescription}
                                returnKeyType="done"
                            />

                            <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
                            <View style={styles.categoryRow}>
                                {currentCategories.map((c) => (
                                    <TouchableOpacity key={c} style={[styles.chip, { borderColor: colors.border }, category === c && { backgroundColor: '#e3f2fd', borderColor: colors.secondary }]} onPress={() => setCategory(c)}>
                                        <Text style={[styles.chipText, { color: colors.text }, category === c && { color: colors.secondary, fontWeight: '700' }]}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={onSave} disabled={saving}>
                                <Text style={styles.saveText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
    backBtn: { paddingVertical: 6, paddingHorizontal: 6 },
    backTxt: { fontWeight: '700' },
    headerTitle: { fontSize: 16, fontWeight: '700' },

    container: { flexGrow: 1, padding: 20 },
    row: { flexDirection: 'row', marginBottom: 12 },
    typeBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginRight: 8, alignItems: 'center', backgroundColor: '#fafafa' },
    typeActiveIncome: { backgroundColor: '#e8f5e9', borderColor: '#2e7d32' },
    typeActiveExpense: { backgroundColor: '#ffebee', borderColor: '#d32f2f' },
    typeText: { color: '#555', fontWeight: '600' },

    creditCardSection: { marginBottom: 12 },
    creditCardToggle: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fafafa' },
    creditCardText: { fontWeight: '600' },

    label: { marginTop: 6, marginBottom: 6, fontWeight: '600' },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
    bankRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
    creditCardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
    installmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
    chip: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 16, marginRight: 8, marginBottom: 8 },
    chipText: {},

    installmentInfo: { marginVertical: 8, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 6 },
    installmentText: { fontSize: 12, textAlign: 'center' },

    saveBtn: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
    saveText: { color: '#fff', fontWeight: '700' },
});

export default AddTransactionScreen;

