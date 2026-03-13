export default {
  dev: {
    buildCommand: ['pnpm', 'run', 'dev:build'],
    deploy: {
      mode: 'copy',
      staticFiles: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'styles.css', to: 'styles.css' },
      ],
      watchFiles: [{ from: 'main.js', to: 'main.js' }],
    },
  },
  release: {
    pluginName: 'metadata-auto-classifier',
    copyFiles: ['main.js', 'manifest.json', 'styles.css'],
    publishFiles: [
      '${{ env.PLUGIN_NAME }}.zip',
      'main.js',
      'manifest.json',
      'styles.css',
      'versions.json',
    ],
  },
};
