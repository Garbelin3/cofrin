import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const Toast = ({ message, duration = 2500, onHide }) => {
    const [visible, setVisible] = useState(Boolean(message));
    const translateY = new Animated.Value(-60);

    useEffect(() => {
        if (message) {
            setVisible(true);
            Animated.timing(translateY, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start(() => {
                setTimeout(() => {
                    Animated.timing(translateY, {
                        toValue: -60,
                        duration: 250,
                        useNativeDriver: true,
                    }).start(() => {
                        setVisible(false);
                        onHide && onHide();
                    });
                }, duration);
            });
        }
    }, [message]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
            <View style={styles.content}>
                <Text style={styles.text}>{message}</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 999,
        elevation: 10,
    },
    content: {
        marginTop: 10,
        backgroundColor: '#323232',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    text: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default Toast;

