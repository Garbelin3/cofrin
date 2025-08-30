import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import { useThemeColors } from '../theme/useTheme';

const materials = [
    { id: '1', title: 'O Básico sobre Orçamento', description: 'Aprenda a planejar seus gastos e receitas.' },
    { id: '2', title: 'O que são Juros Compostos?', description: 'Entenda como juros compostos funcionam a seu favor.' },
    { id: '3', title: 'Dívidas: como organizar e sair do vermelho', description: 'Estratégias práticas para quitar dívidas.' },
];

const MaterialsScreen = ({ navigation }) => {
    const { colors } = useThemeColors();
    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={[styles.backTxt, { color: colors.secondary }]}>‹ Voltar</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Material Didático</Text>
                <View style={{ width: 68 }} />
            </View>

            <View style={styles.container}>
                <FlatList
                    data={materials}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <GlassCard style={{ marginBottom: 12 }}>
                            <TouchableOpacity onPress={() => navigation.navigate('MaterialDetail', { item })}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                                <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{item.description}</Text>
                            </TouchableOpacity>
                        </GlassCard>
                    )}
                    contentContainerStyle={{ paddingVertical: 12 }}
                />
            </View>
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
    cardDesc: { marginTop: 6 },
});

export default MaterialsScreen;

