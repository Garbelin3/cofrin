import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from './colors';

export const useThemeColors = () => {
    const scheme = useColorScheme();
    const colors = scheme === 'dark' ? darkColors : lightColors;
    return { scheme, colors };
};
