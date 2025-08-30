import React, { useRef } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '../theme/useTheme';

const GlassCard = ({ children, style, onPress, accessibilityLabel }) => {
    const { colors } = useThemeColors();
    const scale = useRef(new Animated.Value(1)).current;

    const animate = (to) => {
        Animated.spring(scale, { toValue: to, useNativeDriver: true, friction: 7, tension: 120 }).start();
    };

    const content = (
        <Animated.View style={[styles.shadow(colors), { transform: [{ scale }] }, style]}>
            <BlurView intensity={30} tint="default" style={styles.blur}>
                <View style={[styles.inner, { borderColor: colors.border, backgroundColor: colors.surface + 'cc' }]}>
                    {children}
                </View>
            </BlurView>
        </Animated.View>
    );

    if (onPress) {
        return (
            <Pressable onPress={onPress} onPressIn={() => animate(0.98)} onPressOut={() => animate(1)} accessibilityLabel={accessibilityLabel}>
                {content}
            </Pressable>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    blur: { borderRadius: 16, overflow: 'hidden' },
    inner: { padding: 16, borderRadius: 16, borderWidth: 1 },
    shadow: (colors) => ({
        borderRadius: 16,
        backgroundColor: 'transparent',
        shadowColor: colors.secondary,
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    }),
});

export default GlassCard;
