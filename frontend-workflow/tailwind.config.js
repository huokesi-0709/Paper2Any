/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // BioGDP-inspired light scientific workspace palette
        neon: {
          cyan: '#0ea5c6',
          'cyan-dim': 'rgba(14, 165, 198, 0.1)',
          'cyan-glow': 'rgba(14, 165, 198, 0.18)',
          purple: '#2563eb',
          'purple-dim': 'rgba(37, 99, 235, 0.1)',
          'purple-glow': 'rgba(37, 99, 235, 0.18)',
          pink: '#4f7ee8',
          'pink-dim': 'rgba(79, 126, 232, 0.1)',
          'pink-glow': 'rgba(79, 126, 232, 0.16)',
        },
        // Light surface hierarchy
        surface: {
          base: '#f4f7fb',
          DEFAULT: '#ffffff',
          raised: '#f7faff',
          card: '#ffffff',
          'card-hover': '#f5f9ff',
        },
        // Brand gold (muted)
        brand: {
          gold: '#f5c451',
          'gold-dim': 'rgba(245, 196, 81, 0.12)',
          'gold-glow': 'rgba(245, 196, 81, 0.26)',
        },
        // Text
        lab: {
          primary: '#0f2747',
          secondary: '#475569',
          muted: '#64748b',
          dim: '#94a3b8',
        },
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        'bento': '20px',
        'bento-sm': '16px',
        'bento-lg': '24px',
      },
      boxShadow: {
        'neon-cyan': '0 8px 24px rgba(14, 165, 198, 0.16)',
        'neon-purple': '0 8px 24px rgba(37, 99, 235, 0.16)',
        'neon-pink': '0 8px 24px rgba(79, 126, 232, 0.14)',
        'bento': '0 10px 30px rgba(15, 39, 71, 0.07), 0 0 0 1px rgba(15, 39, 71, 0.04)',
        'bento-hover': '0 18px 42px rgba(37, 99, 235, 0.12), 0 0 0 1px rgba(37, 99, 235, 0.1)',
      },
      backgroundImage: {
        'gradient-neon': 'linear-gradient(135deg, #0ea5c6, #2563eb, #4f7ee8)',
        'gradient-cyan-purple': 'linear-gradient(135deg, #0ea5c6, #2563eb)',
        'gradient-purple-pink': 'linear-gradient(135deg, #2563eb, #4f7ee8)',
        'gradient-gold': 'linear-gradient(135deg, #f5c451, #ffe39a)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'floatY 5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'grid-pulse': 'gridPulse 4s ease-in-out infinite',
        'scan': 'scanLine 4s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(94, 231, 228, 0.16), 0 0 40px rgba(79, 124, 255, 0.08)' },
          '50%': { boxShadow: '0 0 30px rgba(94, 231, 228, 0.26), 0 0 60px rgba(79, 124, 255, 0.14)' },
        },
        gridPulse: {
          '0%, 100%': { opacity: '0.025' },
          '50%': { opacity: '0.06' },
        },
        scanLine: {
          '0%': { top: '-100%' },
          '50%': { top: '100%' },
          '100%': { top: '100%' },
        },
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
