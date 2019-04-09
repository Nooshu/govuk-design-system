'use strict'

const { injectManifest } = require('workbox-build')

module.exports = {
  generate: function () {
    return injectManifest(
      require('../config/workbox-config')
    ).then(() => {
      console.info('Service worker generation completed.')
    }).catch((error) => {
      console.warn('Service worker generation failed: ' + error)
    })
  },
  init: function () {
    this.generate()
  }
}
