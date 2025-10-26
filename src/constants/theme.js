/**
 * 应用主题配置
 * 统一管理颜色、间距、字体等样式
 */

export const theme = {
  colors: {
    primary: '#1E90FF',
    secondary: '#4169E1',
    accent: '#FFB84D',
    background: '#F0F4F8',
    surface: '#FFFFFF',
    error: '#FF6B6B',
    success: '#4CAF50',
    warning: '#FFA726',
    text: {
      primary: '#333333',
      secondary: '#666666',
      disabled: '#999999',
      inverse: '#FFFFFF',
    },
    border: '#E0E0E0',
    divider: '#F0F0F0',
    overlay: 'rgba(0, 0, 0, 0.5)',
    robotBlue: '#5B9FFF',
    gradient: {
      primary: ['#1E90FF', '#87CEEB'],
      secondary: ['#4169E1', '#6A5ACD'],
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    display: 32,
  },
  
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  
  animation: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

export default theme;
