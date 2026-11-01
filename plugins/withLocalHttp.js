const { withAndroidManifest } = require('expo/config-plugins')

module.exports = function withLocalHttp(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0]
    if (!app) throw new Error('AndroidManifest is missing <application>')
    app.$['android:usesCleartextTraffic'] = 'true'
    return config
  })
}
