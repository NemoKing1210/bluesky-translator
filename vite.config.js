import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import pkg from './package.json' with { type: 'json' };

const RAW_BASE =
  'https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: { passes: 2, pure_getters: true },
      mangle: true,
      format: { comments: false },
    },
    cssMinify: true,
    target: 'es2018',
    reportCompressedSize: true,
  },
  esbuild: {
    legalComments: 'none',
  },
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: {
          '': 'Bluesky Translator',
          ru: 'Bluesky Translator',
          'zh-CN': 'Bluesky Translator',
          es: 'Bluesky Translator',
          'pt-BR': 'Bluesky Translator',
          de: 'Bluesky Translator',
          fr: 'Bluesky Translator',
          ja: 'Bluesky Translator',
        },
        namespace: 'https://github.com/NemoKing1210/bluesky-translator',
        version: pkg.version,
        description: {
          '': 'Translate Bluesky posts in place on bsky.app',
          ru: 'Переводит посты Bluesky прямо на bsky.app',
          'zh-CN': '在 bsky.app 上就地翻译 Bluesky 帖子',
          es: 'Traduce publicaciones de Bluesky en bsky.app',
          'pt-BR': 'Traduz posts do Bluesky diretamente no bsky.app',
          de: 'Übersetzt Bluesky-Posts direkt auf bsky.app',
          fr: 'Traduit les posts Bluesky directement sur bsky.app',
          ja: 'bsky.app 上で Bluesky の投稿をその場で翻訳',
        },
        author: 'NemoKing1210',
        tag: ['bluesky', 'translate', 'bsky'],
        homepageURL: 'https://github.com/NemoKing1210/bluesky-translator',
        supportURL: 'https://github.com/NemoKing1210/bluesky-translator/issues',
        updateURL: `${RAW_BASE}/bluesky-translator.user.js`,
        downloadURL: `${RAW_BASE}/bluesky-translator.user.js`,
        license: 'MIT',
        icon: 'https://bsky.app/static/favicon-32x32.png',
        match: ['https://bsky.app/*', 'https://www.bsky.app/*'],
        connect: ['translate.googleapis.com'],
        'run-at': 'document-idle',
        noframes: true,
      },
      server: {
        prefix: 'dev:',
      },
      build: {
        fileName: 'bluesky-translator.user.js',
        metaFileName: true,
      },
    }),
  ],
});
