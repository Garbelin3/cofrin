import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, doc, onSnapshot, query, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import GlassCard from '../components/GlassCard';
import { useThemeColors } from '../theme/useTheme';

const GoalItem = ({ item, onEdit, onAddValue, isCompleted = false }) => {
    const { colors } = useThemeColors();
    const pct = Math.min(100, Math.round(((item.current || 0) / item.target) * 100));
    return (
        <GlassCard style={[styles.goalCard, isCompleted && { opacity: 0.8 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.goalTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.goalSubtitle, { color: colors.textMuted }]}>R$ {(item.current || 0).toFixed(2)} de R$ {item.target.toFixed(2)}</Text>
                </View>
                {!isCompleted && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity onPress={() => onAddValue(item)} style={[styles.iconBtn, { backgroundColor: colors.primary }]}>
                            <Text style={styles.iconText}>+</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onEdit(item)} style={[styles.iconBtn, { backgroundColor: colors.secondary }]}>
                            <Text style={styles.iconText}>✏️</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {isCompleted && (
                    <View style={[styles.completedBadge, { backgroundColor: colors.success }]}>
                        <Text style={styles.completedText}>✓</Text>
                    </View>
                )}
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: isCompleted ? colors.success : colors.primary }]} />
            </View>
            <Text style={[styles.goalPct, { color: colors.text }]}>{pct}%</Text>
        </GlassCard>
    );
};

const GoalsScreen = ({ navigation }) => {
    const { colors } = useThemeColors();
    const [goals, setGoals] = useState([]);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'

    const [addVisible, setAddVisible] = useState(false);
    const [addTitle, setAddTitle] = useState('');
    const [addTarget, setAddTarget] = useState('');
    const [adding, setAdding] = useState(false);

    const [editVisible, setEditVisible] = useState(false);
    const [editGoal, setEditGoal] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editTarget, setEditTarget] = useState('');

    const [addValueVisible, setAddValueVisible] = useState(false);
    const [addValueGoal, setAddValueGoal] = useState(null);
    const [addValueAmount, setAddValueAmount] = useState('');

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;
        const q = query(collection(db, 'goals'), where('uid', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setGoals(list);
        });
        return () => unsub();
    }, []);

    const activeGoals = goals.filter(goal => !goal.completed);
    const completedGoals = goals.filter(goal => goal.completed);

    const checkGoalCompletion = async (goal, newCurrent) => {
        const pct = Math.round((newCurrent / goal.target) * 100);
        if (pct >= 100 && !goal.completed) {
            // Marcar como concluída
            const ref = doc(db, 'goals', goal.id);
            await updateDoc(ref, {
                completed: true,
                completedAt: serverTimestamp(),
                current: goal.target // Garantir que não passe de 100%
            });

            // Mostrar notificação de parabéns
            Alert.alert(
                '🎉 Parabéns!',
                `Você alcançou sua meta "${goal.title}"!`,
                [{ text: 'Ótimo!', style: 'default' }]
            );

            return true;
        }
        return false;
    };

    const addGoal = async () => {
        const t = parseFloat(String(addTarget).replace(',', '.'));
        if (!addTitle || !t) return;
        setAdding(true);
        try {
            const user = auth.currentUser;
            await addDoc(collection(db, 'goals'), {
                uid: user?.uid || null,
                title: addTitle,
                target: t,
                current: 0,
                completed: false,
                createdAt: new Date()
            });
            setAddTitle('');
            setAddTarget('');
            setAddVisible(false);
        } finally {
            setAdding(false);
        }
    };

    const openEdit = (goal) => {
        setEditGoal(goal);
        setEditTitle(goal.title);
        setEditTarget(String(goal.target));
        setEditVisible(true);
    };

    const saveEdit = async () => {
        if (!editGoal) return;
        const t = parseFloat(String(editTarget).replace(',', '.'));
        if (!editTitle || !t) return;
        const ref = doc(db, 'goals', editGoal.id);
        await updateDoc(ref, { title: editTitle, target: t });
        setEditVisible(false);
        setEditGoal(null);
    };

    const openAddValue = (goal) => {
        setAddValueGoal(goal);
        setAddValueAmount('');
        setAddValueVisible(true);
    };

    const handleAddValue = () => {
        const amount = parseFloat(String(addValueAmount).replace(',', '.'));
        if (!amount || amount <= 0) {
            Alert.alert('Erro', 'Informe um valor válido.');
            return;
        }

        Alert.alert(
            'Origem do dinheiro',
            'De onde vem este valor?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Dinheiro externo',
                    onPress: async () => {
                        try {
                            const ref = doc(db, 'goals', addValueGoal.id);
                            const newCurrent = (addValueGoal.current || 0) + amount;

                            // Verificar se completou a meta
                            const completed = await checkGoalCompletion(addValueGoal, newCurrent);

                            if (!completed) {
                                await updateDoc(ref, { current: newCurrent });
                            }

                            setAddValueVisible(false);
                            setAddValueGoal(null);
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível atualizar a meta.');
                        }
                    }
                },
                {
                    text: 'Do saldo total',
                    onPress: async () => {
                        try {
                            const user = auth.currentUser;
                            const ref = doc(db, 'goals', addValueGoal.id);
                            const newCurrent = (addValueGoal.current || 0) + amount;

                            // Adicionar transação de despesa
                            await addDoc(collection(db, 'transactions'), {
                                uid: user?.uid || null,
                                type: 'expense',
                                amount: amount,
                                description: `Meta: ${addValueGoal.title}`,
                                category: 'Outros',
                                createdAt: serverTimestamp(),
                            });

                            // Verificar se completou a meta
                            const completed = await checkGoalCompletion(addValueGoal, newCurrent);

                            if (!completed) {
                                await updateDoc(ref, { current: newCurrent });
                            }

                            setAddValueVisible(false);
                            setAddValueGoal(null);
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível registrar a transação.');
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Metas Financeiras</Text>
                <View style={{ width: 68 }} />
            </View>

            {/* Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'active' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                    ]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === 'active' ? colors.primary : colors.textMuted }
                    ]}>
                        Ativas ({activeGoals.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'completed' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                    ]}
                    onPress={() => setActiveTab('completed')}
                >
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === 'completed' ? colors.primary : colors.textMuted }
                    ]}>
                        Concluídas ({completedGoals.length})
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.container}>
                <FlatList
                    data={activeTab === 'active' ? activeGoals : completedGoals}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <GoalItem
                            item={item}
                            onEdit={openEdit}
                            onAddValue={openAddValue}
                            isCompleted={activeTab === 'completed'}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListEmptyComponent={
                        <Text style={{ color: colors.textMuted, paddingVertical: 12, textAlign: 'center' }}>
                            {activeTab === 'active' ? 'Nenhuma meta ativa' : 'Nenhuma meta concluída'}
                        </Text>
                    }
                />
            </View>

            {activeTab === 'active' && (
                <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setAddVisible(true)}>
                    <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
            )}

            {/* Modal para adicionar nova meta */}
            <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Nova Meta</Text>
                        <Text style={[styles.modalLabel, { color: colors.text }]}>Título</Text>
                        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={addTitle} onChangeText={setAddTitle} placeholder="Ex: Viagem" placeholderTextColor={colors.textMuted} />
                        <Text style={[styles.modalLabel, { color: colors.text }]}>Valor da meta</Text>
                        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={addTarget} onChangeText={setAddTarget} keyboardType="decimal-pad" placeholder="Ex: 5000" placeholderTextColor={colors.textMuted} />

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                            <TouchableOpacity onPress={() => setAddVisible(false)} style={[styles.modalBtn, { backgroundColor: '#eee' }]}>
                                <Text style={[styles.modalBtnTxt, { color: '#333' }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={addGoal} style={[styles.modalBtn, { backgroundColor: colors.secondary }]}>
                                <Text style={styles.modalBtnTxt}>{adding ? 'Adicionando...' : 'Adicionar'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal para editar meta */}
            <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Editar Meta</Text>
                        <Text style={[styles.modalLabel, { color: colors.text }]}>Título</Text>
                        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={editTitle} onChangeText={setEditTitle} />
                        <Text style={[styles.modalLabel, { color: colors.text }]}>Valor da meta</Text>
                        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={editTarget} onChangeText={setEditTarget} keyboardType="decimal-pad" />

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                            <TouchableOpacity onPress={() => setEditVisible(false)} style={[styles.modalBtn, { backgroundColor: '#eee' }]}>
                                <Text style={[styles.modalBtnTxt, { color: '#333' }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={saveEdit} style={[styles.modalBtn, { backgroundColor: colors.secondary }]}>
                                <Text style={styles.modalBtnTxt}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal para adicionar valor */}
            <Modal visible={addValueVisible} transparent animationType="slide" onRequestClose={() => setAddValueVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Adicionar Valor</Text>
                        <Text style={[styles.modalLabel, { color: colors.text }]}>Meta: {addValueGoal?.title}</Text>
                        <Text style={[styles.modalLabel, { color: colors.text }]}>Valor a adicionar</Text>
                        <TextInput
                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                            value={addValueAmount}
                            onChangeText={setAddValueAmount}
                            keyboardType="decimal-pad"
                            placeholder="Ex: 100"
                            placeholderTextColor={colors.textMuted}
                        />

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                            <TouchableOpacity onPress={() => setAddValueVisible(false)} style={[styles.modalBtn, { backgroundColor: '#eee' }]}>
                                <Text style={[styles.modalBtnTxt, { color: '#333' }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddValue} style={[styles.modalBtn, { backgroundColor: colors.secondary }]}>
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
    backBtn: { paddingVertical: 6, paddingHorizontal: 6 },
    backTxt: { fontWeight: '700' },
    headerTitle: { fontSize: 16, fontWeight: '700' },

    tabContainer: { flexDirection: 'row', borderBottomWidth: 1 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabText: { fontSize: 14, fontWeight: '600' },

    container: { flex: 1, padding: 20 },
    goalCard: { marginBottom: 12 },
    goalTitle: { fontSize: 16, fontWeight: '700' },
    goalSubtitle: {},
    progressBarBg: { height: 10, borderRadius: 6, marginTop: 8, overflow: 'hidden' },
    progressBarFill: { height: 10 },
    goalPct: { marginTop: 6, fontWeight: '600' },

    actionButtons: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    iconText: { fontSize: 16, fontWeight: 'bold' },
    completedBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    completedText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

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

export default GoalsScreen;
