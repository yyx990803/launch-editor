const url = require('url')
const launch = require('launch-editor')

module.exports = (specifiedEditor, onErrorCallback) => {
  return function launchEditorMiddleware (req, res, next) {
    const { file } = url.parse(req.url, true).query || {}
    if (!file) {
      res.statusCode = 500
      res.end(`launch-editor-middleware: required query param "file" is missing.`)
    } else {
      launch(file, specifiedEditor, onErrorCallback)
      res.end()
    }
  }
}
