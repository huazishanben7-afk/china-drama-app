import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '中国ドラマ コンシェルジュ',
        short_name: '中国ドラマ',
        description: 'あなたにぴったりの中国ドラマを診断！',
        start_url: '/',
        display: 'standalone',
        background_color: '#fffbeb',
        theme_color: '#b45309',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
            {
                src: '/apple-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    }
}
