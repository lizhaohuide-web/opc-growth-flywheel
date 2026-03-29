import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 响应式断点（移动端优先）
      screens: {
        'sm': '640px',   // 大屏手机
        'md': '768px',   // 平板
        'lg': '1024px',  // 小屏电脑
        'xl': '1280px',  // 桌面
        '2xl': '1536px', // 大屏
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          light: 'var(--accent-light)',
          subtle: 'var(--accent-subtle)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
      },
      borderColor: {
        subtle: 'var(--border-subtle)',
        medium: 'var(--border-medium)',
      },
    },
  },
  plugins: [],
};
export default config;
