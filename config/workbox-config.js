const paths = require('./paths.json') // specify paths to main working directories

// workbox config here
module.exports = {
  swSrc: `${paths.config}service-worker-src.js`,
  swDest: `${paths.public}service-worker.js`,
  globDirectory: paths.public,
  globPatterns: ['**/*.{html,png,jpg,json}'],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 100 // 500KB limit
}
