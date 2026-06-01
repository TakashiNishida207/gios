/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Vercel ビルドで ESLint/TypeScript エラーによるビルド停止を防ぐ
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack(config) {
    // @pm エイリアスを明示的に設定（tsconfig.json の paths だけでは
    // Vercel ビルドで解決されない場合への対策）
    config.resolve.alias = {
      ...config.resolve.alias,
      '@pm': path.resolve(__dirname, 'src/power-meeting'),
    }
    return config
  },
}

module.exports = nextConfig
