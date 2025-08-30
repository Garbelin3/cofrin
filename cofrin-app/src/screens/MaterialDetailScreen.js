import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MaterialDetailScreen = ({ route, navigation }) => {
    const { item } = route.params || {};
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.headerBar}>
                <Text style={styles.backTouch} onPress={() => navigation.goBack()}>‹ Voltar</Text>
                <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{item?.title || 'Conteúdo'}</Text>
                <View style={{ width: 68 }} />
            </View>
            <ScrollView contentContainerStyle={styles.contentWrap} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>{item?.title}</Text>
                <Text style={styles.content}>{item?.description}</Text>
                <Text style={styles.content}>
                    Conteúdo completo em breve. Este é um placeholder para o material didático.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backTouch: { color: '#007AFF', fontWeight: '700' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#333', maxWidth: '70%' },

    contentWrap: { padding: 20 },
    title: { fontSize: 22, fontWeight: '800', color: '#333', marginBottom: 12 },
    content: { color: '#444', lineHeight: 22, marginBottom: 10, textAlign: 'justify' },
});

export default MaterialDetailScreen;

