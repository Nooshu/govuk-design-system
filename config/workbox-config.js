const paths = require('./paths.json') // specify paths to main working directories

// workbox config here
module.exports = {
  swSrc: `${paths.config}service-worker-src.js`,
  swDest: `${paths.public}service-worker.js`,
  globDirectory: paths.public,
  globPatterns: [],
  maximumFileSizeToCacheInBytes: 1 * 1024 * 1024
}
