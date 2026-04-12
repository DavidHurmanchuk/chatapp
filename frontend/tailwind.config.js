/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        ui: ['Syne', 'sans-serif'],
      },
      colors: {
        // Основні фони
        bg: {
          base:    '#0a0e1a',
          sidebar: '#0f1420',
          chat:    '#111622',
          surface: '#161d2e',
          raised:  '#1a2035',
          input:   '#161d2e',
        },
        // Бордери
        line: {
          DEFAULT: '#1a2035',
          strong:  '#252d3d',
          focus:   '#4f7cff66',
        },
        // Текст
        txt: {
          primary:   '#e8eaf0',
          secondary: '#8891a8',
          muted:     '#4a5570',
          dim:       '#3a4560',
        },
        // Акценти
        brand: {
          DEFAULT: '#4f7cff',
          dark:    '#3b5fd4',
          bg:      '#4f7cff22',
          border:  '#4f7cff44',
        },
        // AI
        ai: {
          DEFAULT: '#00c896',
          bg:      '#1a2d25',
          border:  '#00c89630',
          badge:   '#00c89618',
        },
        // Групи
        group: {
          DEFAULT: '#ffd166',
          ai:      '#a78bfa',
          'ai-bg': '#a78bfa18',
          'ai-border': '#a78bfa40',
        },
        // Danger
        danger: {
          DEFAULT: '#ff6b6b',
          bg:      '#ff6b6b22',
          border:  '#ff6b6b44',
        },
        // Success
        success: '#22c55e',
        // Bubble кольори
        bubble: {
          own:    '#1e3a5f',
          'own-border': '#4f7cff40',
          other:  '#161d2e',
          'other-border': '#252d3d',
          ai:     '#1a2d25',
          'ai-border': '#00c89630',
        },
        // Active item у сайдбарі
        active: '#2a3554',
        hover:  '#1a2035',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
        bubble: '18px',
        'bubble-own': '18px 4px 18px 18px',
        'bubble-other': '4px 18px 18px 18px',
      },
      keyframes: {
        tgDot: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%':           { transform: 'translateY(-6px)', opacity: '1' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'tg-dot':  'tgDot 1.4s ease-in-out infinite',
        'spin':    'spin 0.8s linear infinite',
        'fade-in': 'fadeIn 0.15s ease',
      },
    },
  },
  plugins: [],
};