import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, query, where, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import GlassCard from '../components/GlassCard';
import { useThemeColors } from '../theme/useTheme';

const categoriesPalette = {
    Alimentação: '#FF6384',
    Transporte: '#36A2EB',
    Lazer: '#FFCE56',
    Moradia: '#4BC0C0',
    Saúde: '#9966FF',
    Outros: '#888',
};

const CategoryBar = ({ data }) => {
    const total = data.reduce((acc, item) => acc + Math.abs(item.total), 0) || 1;
    return (
        <View style={styles.categoryBar}>
            {data.map((c) => (
                <View
                    key={c.category}
                    style={{
                        width: `${(Math.abs(c.total) / total) * 100}%`,
                        backgroundColor: categoriesPalette[c.category] || '#999',
                        height: 10,
                    }}
                />
            ))}
        </View>
    );
};

const TransactionItem = ({ item, onDelete }) => {
    const { colors } = useThemeColors();

    const handleDelete = () => {
        Alert.alert(
            'Confirmar exclusão',
            `Deseja excluir "${item.description}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Excluir', style: 'destructive', onPress: () => onDelete(item.id) }
            ]
        );
    };

    return (
        <GlassCard style={{ marginBottom: 10 }}>
            <View style={styles.txItemRow}>
                <View style={styles.txInfo}>
                    <Text style={[styles.txDesc, { color: colors.text }]}>{item.description}</Text>
                    <Text style={[styles.txCategory, { color: colors.textMuted }]}>{item.category} • {item.bank}</Text>
                </View>
                <View style={styles.txActions}>
                    <Text style={[styles.txValue, item.type === 'income' ? styles.income : styles.expense]}>
                        {item.type === 'income' ? '+' : '-'} R$ {Math.abs(item.amount).toFixed(2)}
                    </Text>
                    <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                        <Text style={[styles.deleteText, { color: colors.error }]}>×</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </GlassCard>
    );
};

const HomeScreen = ({ navigation }) => {
    const { colors } = useThemeColors();
    const [transactions, setTransactions] = useState([]);
    const [banks, setBanks] = useState(['Dia a Dia']);
    const [selectedBank, setSelectedBank] = useState('Dia a Dia');
    const [showAddBank, setShowAddBank] = useState(false);
    const [newBankName, setNewBankName] = useState('');

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Buscar transações
        const q = query(collection(db, 'transactions'), where('uid', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setTransactions(list);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Buscar bancos
        const q = query(collection(db, 'banks'), where('uid', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => {
            const bankList = snap.docs.map((d) => d.data().name);
            setBanks(['Dia a Dia', ...bankList]);
        });
        return () => unsub();
    }, []);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => t.bank === selectedBank);
    }, [transactions, selectedBank]);

    const balance = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
    }, [filteredTransactions]);

    const byCategory = useMemo(() => {
        const map = {};
        filteredTransactions
            .filter((t) => t.type === 'expense')
            .forEach((t) => {
                map[t.category] = (map[t.category] || 0) + t.amount;
            });
        return Object.keys(map).map((k) => ({ category: k, total: map[k] }));
    }, [filteredTransactions]);

    const handleDeleteTransaction = async (transactionId) => {
        try {
            await deleteDoc(doc(db, 'transactions', transactionId));
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível excluir a transação.');
        }
    };

    const handleAddBank = async () => {
        if (!newBankName.trim()) {
            Alert.alert('Erro', 'Informe o nome do banco.');
            return;
        }

        if (banks.includes(newBankName.trim())) {
            Alert.alert('Erro', 'Este banco já existe.');
            return;
        }

        try {
            const user = auth.currentUser;
            await addDoc(collection(db, 'banks'), {
                uid: user?.uid || null,
                name: newBankName.trim(),
                createdAt: serverTimestamp(),
            });
            setNewBankName('');
            setShowAddBank(false);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível adicionar o banco.');
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Gestão Financeira</Text>
                <TouchableOpacity
                    style={[styles.creditCardBtn, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('CreditCards')}
                >
                    <Text style={styles.creditCardBtnText}>💳</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.header, { backgroundColor: colors.secondary }]}>
                <Text style={{ color: '#e8f0fe' }}>Saldo Total - {selectedBank}</Text>
                <Text style={styles.balance}>R$ {balance.toFixed(2)}</Text>
            </View>

            {/* Tabs de Bancos */}
            <View style={[styles.bankTabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={banks}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.bankTab,
                                selectedBank === item && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                            ]}
                            onPress={() => setSelectedBank(item)}
                        >
                            <Text style={[
                                styles.bankTabText,
                                { color: selectedBank === item ? colors.primary : colors.textMuted }
                            ]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.bankTabsContainer}
                />
                <TouchableOpacity
                    style={[styles.addBankBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setShowAddBank(true)}
                >
                    <Text style={styles.addBankText}>+</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Visão Geral (Despesas) - {selectedBank}</Text>
                <GlassCard>
                    {byCategory.length > 0 ? (
                        <CategoryBar data={byCategory} />
                    ) : (
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhuma despesa registrada</Text>
                    )}
                </GlassCard>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Transações Recentes - {selectedBank}</Text>
                <FlatList
                    contentContainerStyle={{ paddingBottom: 100 }}
                    data={filteredTransactions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TransactionItem
                            item={item}
                            onDelete={handleDeleteTransaction}
                        />
                    )}
                    ListEmptyComponent={<Text style={{ color: colors.textMuted, paddingVertical: 12 }}>Nenhuma transação</Text>}
                />
            </View>

            <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('AddTransaction')}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Modal para adicionar banco */}
            <Modal visible={showAddBank} transparent animationType="slide" onRequestClose={() => setShowAddBank(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Adicionar Banco</Text>
                        <Text style={[styles.modalLabel, { color: colors.text }]}>Nome do banco</Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            value={newBankName}
                            onChangeText={setNewBankName}
                            placeholder="Ex: Banco do Brasil"
                            placeholderTextColor={colors.textMuted}
                        />

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                            <TouchableOpacity onPress={() => setShowAddBank(false)} style={[styles.modalBtn, { backgroundColor: '#eee' }]}>
                                <Text style={[styles.modalBtnTxt, { color: '#333' }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddBank} style={[styles.modalBtn, { backgroundColor: colors.secondary }]}>
                                <Text style={styles.modalBtnTxt}>Adicionar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    creditCardBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    creditCardBtnText: { fontSize: 20 },

    header: { padding: 20, backgroundColor: '#007AFF' },
    balance: { color: '#fff', fontSize: 28, fontWeight: '800' },

    bankTabs: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
    bankTabsContainer: { paddingHorizontal: 12 },
    bankTab: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 8 },
    bankTabText: { fontSize: 14, fontWeight: '600' },
    addBankBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },

    section: { paddingHorizontal: 20, paddingTop: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    categoryBar: { flexDirection: 'row', overflow: 'hidden', borderRadius: 6, height: 10, backgroundColor: '#e6e6e6' },
    emptyText: { textAlign: 'center', paddingVertical: 20 },

    txItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    txInfo: { flex: 1 },
    txDesc: { fontWeight: '600' },
    txCategory: { fontSize: 12, marginTop: 2 },
    txActions: { flexDirection: 'row', alignItems: 'center' },
    txValue: { fontWeight: '700', marginRight: 12 },
    income: { color: '#22c55e' },
    expense: { color: '#dc2626' },
    deleteBtn: { padding: 8 },
    deleteText: { fontSize: 20, fontWeight: 'bold' },

    fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
    fabText: { color: '#fff', fontSize: 28, marginTop: -2 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 24 },
    modalCard: { borderRadius: 12, padding: 16 },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
    modalLabel: { fontWeight: '600', marginTop: 8, marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: 8, padding: 10 },
    modalBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginLeft: 10 },
    modalBtnTxt: { color: '#fff', fontWeight: '700' },
    addBankText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default HomeScreen;

