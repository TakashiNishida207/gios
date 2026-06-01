/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/ui/**/*.{ts,tsx}",
    "./src/power-meeting/**/*.{ts,tsx}",
  ],
  safelist: [
    // PowerMeeting で動的に参照される色クラスを保護（purge 防止）
    {
      pattern: /^bg-(green|blue|indigo|pink|sky|orange|gray|purple|red|yellow|amber|teal|cyan|violet|emerald|rose|white)-(50|100|200|300|400|500|600|700|800|900)$/,
      variants: ['hover', 'focus'],
    },
    {
      pattern: /^text-(green|blue|indigo|pink|sky|orange|gray|purple|red|yellow|amber|teal|cyan|violet|emerald|rose|white)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
    {
      pattern: /^border-(green|blue|indigo|pink|sky|orange|gray|purple|red|yellow|amber|teal|cyan|violet|emerald|rose|white)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
    // ポジショニング・z-index（モーダル等で使用）
    'fixed', 'absolute', 'relative', 'sticky',
    'inset-0', 'inset-x-0', 'inset-y-0',
    { pattern: /^z-(0|10|20|30|40|50|60|70|80|90|100)$/ },
    // グリッド（任意値を含む）
    { pattern: /^grid-cols-.+/ },
    // opacity（モーダルバックドロップ等）
    { pattern: /^bg-black\/.+/ },
    { pattern: /^bg-white\/.+/ },
    { pattern: /^opacity-.+/ },
    // アニメーション
    'animate-pulse', 'animate-spin', 'animate-bounce',
    // その他 PowerMeeting で使用する可能性のあるクラス
    { pattern: /^(line-clamp|truncate|whitespace-nowrap|shrink-0|grow|flex-1|flex-none|overflow-hidden|overflow-x-auto|overflow-y-auto)$/ },
  ],
  theme: {
    extend: {
      colors: {
        'gios-bg':        '#0c0c0b',
        'gios-bg2':       '#131312',
        'gios-bg3':       '#1a1a18',
        'gios-teal':      '#6eb5a0',
        'gios-amber':     '#c4975a',
        'gios-purple':    '#8b82c0',
        'gios-accent':    '#c8b89a',
        'gios-green':     '#7aaa80',
        'gios-red':       '#b56e6e',
        'gios-text':      '#e8e6e0',
        'gios-secondary': '#7a7870',
        'gios-tertiary':  '#4a4844',
      },
      fontFamily: {
        mono:  ['DM Mono', 'monospace'],
        serif: ['Instrument Serif', 'serif'],
        sans:  ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
