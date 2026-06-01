/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
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
