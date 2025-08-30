import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, doc, onSnapshot, query, updateDoc, where, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import GlassCard from '../components/GlassCard';
import { useThemeColors } from '../theme/useTheme';

const CreditCardItem = ({ item, onEdit, onDelete }) => {
    const { colors } = useThemeColors();

    const formatDueDate = (day) => {
        return `${day}º dia do mês`;
    };

    return (
        <GlassCard style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                        Vencimento: {formatDueDate(item.dueDay)}
                    </Text>
                    <Text style={[styles.cardLimit, { color: colors.textMuted }]}>
                        Limite: R$ {item.limit?.toFixed(2) || '0.00'}
                    </Text>
                </View>
                <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => onEdit(item)} style={[styles.iconBtn, { backgroundColor: colors.secondary }]}>
                        <Text style={styles.iconText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(item)} style={[styles.iconBtn, { backgroundColor: colors.danger }]}>
                        <Text style={styles.iconText}>🗑️</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </GlassCard>
    );
};

const CreditCardsScreen = ({ navigation }) => {
    const { colors } = useThemeColors();
    const [creditCards, setCreditCards] = useState([]);
    const [addVisible, setAddVisible] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [editingCard, setEditingCard] = useState(null);

    // Estados para adicionar
    const [addName, setAddName] = useState('');
    const [addDueDay, setAddDueDay] = useState('');
    const [addLimit, setAddLimit] = useState('');
    const [adding, setAdding] = useState(false);

    // Estados para editar
    const [editName, setEditName] = useState('');
    const [editDueDay, setEditDueDay] = useState('');
    const [editLimit, setEditLimit] = useState('');
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(collection(db, 'creditCards'), where('uid', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setCreditCards(list);
        });
        return () => unsub();
    }, []);

    const addCreditCard = async () => {
        if (!addName.trim() || !addDueDay.trim()) {
            Alert.alert('Erro', 'Preencha nome e dia de vencimento.');
            return;
        }

        const dueDay = parseInt(addDueDay);
        if (dueDay < 1 || dueDay > 31) {
            Alert.alert('Erro', 'Dia de vencimento deve ser entre 1 e 31.');
            return;
        }

        const limit = parseFloat(String(addLimit).replace(',', '.')) || 0;

        setAdding(true);
        try {
            const user = auth.currentUser;
            await addDoc(collection(db, 'creditCards'), {
                uid: user?.uid || null,
                name: addName.trim(),
                dueDay: dueDay,
                limit: limit,
                createdAt: new Date(),
            });
            setAddName('');
            setAddDueDay('');
            setAddLimit('');
            setAddVisible(false);
        } finally {
            setAdding(false);
        }
    };

    const openEdit = (card) => {
        setEditingCard(card);
        setEditName(card.name);
        setEditDueDay(String(card.dueDay));
        setEditLimit(String(card.limit || 0));
        setEditVisible(true);
    };

    const saveEdit = async () => {
        if (!editingCard || !editName.trim() || !editDueDay.trim()) {
            Alert.alert('Erro', 'Preencha nome e dia de vencimento.');
            return;
        }

        const dueDay = parseInt(editDueDay);
        if (dueDay < 1 || dueDay > 31) {
            Alert.alert('Erro', 'Dia de vencimento deve ser entre 1 e 31.');
            return;
        }

        const limit = parseFloat(String(editLimit).replace(',', '.')) || 0;

        setEditing(true);
        try {
            const ref = doc(db, 'creditCards', editingCard.id);
            await updateDoc(ref, {
                name: editName.trim(),
                dueDay: dueDay,
                limit: limit,
            });
            setEditVisible(false);
            setEditingCard(null);
        } finally {
            setEditing(false);
        }
    };

    const handleDelete = (card) => {
        Alert.alert(
            'Confirmar exclusão',
            `Deseja excluir o cartão "${card.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'creditCards', card.id));
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível excluir o cartão.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={[styles.backTxt, { color: colors.secondary }]}>‹ Voltar</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Cartões de Crédito</Text>
                <View style={{ width: 68 }} />
            </View>

            <View style={styles.container}>
                <FlatList
                    data={creditCards}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <CreditCardItem
                            item={item}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListEmptyComponent={
                        <Text style={{ color: colors.textMuted, paddingVertical: 12, textAlign: 'center' }}>
                            Nenhum cartão cadastrado
                        </Text>
                    }
                />
            </View>

            <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setAddVisible(true)}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Modal para adicionar cartão */}
            <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Novo Cartão</Text>

                        <Text style={[styles.modalLabel, { color: colors.text }]}>Nome do cartão</Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            value={addName}
                            onChangeText={setAddName}
                            placeholder="Ex: Nubank, Itaú"
                            placeholderTextColor={colors.textMuted}
                        />

                        <Text style={[styles.modalLabel, { color: colors.text }]}>Dia de vencimento</Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            value={addDueDay}
                            onChangeText={setAddDueDay}
                            keyboardType="numeric"
                            placeholder="Ex: 15"
                            placeholderTextColor={colors.textMuted}
                        />

                        <Text style={[styles.modalLabel, { color: colors.text }]}>Limite (opcional)</Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            value={addLimit}
                            onChangeText={setAddLimit}
                            keyboardType="decimal-pad"
                            placeholder="Ex: 5000"
                            placeholderTextColor={colors.textMuted}
                        />

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                            <TouchableOpacity onPress={() => setAddVisible(false)} style={[styles.modalBtn, { backgroundColor: '#eee' }]}>
                                <Text style={[styles.modalBtnTxt, { color: '#333' }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={addCreditCard} style={[styles.modalBtn, { backgroundColor: colors.secondary }]}>
                                <Text style={styles.modalBtnTxt}>{adding ? 'Adicionando...' : 'Adicionar'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal para editar cartão */}
            <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Editar Cartão</Text>

                        <Text style={[styles.modalLabel, { color: colors.text }]}>Nome do cartão</Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            value={editName}
                            onChangeText={setEditName}
                        />

                        <Text style={[styles.modalLabel, { color: colors.text }]}>Dia de vencimento</Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            value={editDueDay}
                            onChangeText={setEditDueDay}
                            keyboardType="numeric"
                        />

                        <Text style={[styles.modalLabel, { color: colors.text }]}>Limite</Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            value={editLimit}
                            onChangeText={setEditLimit}
                            keyboardType="decimal-pad"
                        />

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                            <TouchableOpacity onPress={() => setEditVisible(false)} style={[styles.modalBtn, { backgroundColor: '#eee' }]}>
                                <Text style={[styles.modalBtnTxt, { color: '#333' }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={saveEdit} style={[styles.modalBtn, { backgroundColor: colors.secondary }]}>
                                <Text style={styles.modalBtnTxt}>{editing ? 'Salvando...' : 'Salvar'}</Text>
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
    backBtn: { paddingVertical: 6, paddingHorizontal: 6 },
    backTxt: { fontWeight: '700' },
    headerTitle: { fontSize: 16, fontWeight: '700' },

    container: { flex: 1, padding: 20 },
    cardTitle: { fontSize: 16, fontWeight: '700' },
    cardSubtitle: { fontSize: 14, marginTop: 2 },
    cardLimit: { fontSize: 12, marginTop: 2 },

    actionButtons: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    iconText: { fontSize: 16, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 24 },
    modalCard: { borderRadius: 12, padding: 16 },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
    modalLabel: { fontWeight: '600', marginTop: 8, marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: 8, padding: 10 },
    modalBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginLeft: 10 },
    modalBtnTxt: { color: '#fff', fontWeight: '700' },

    fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
    fabText: { color: '#fff', fontSize: 28, marginTop: -2 },
});

export default CreditCardsScreen;

