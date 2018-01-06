const launch = require('launch-editor')

module.exports = (specifiedEditor, onErrorCallback) => {
  return function launchEditorMiddleware (req, res, next) {
    const { file } = req.query
    if (!file) {
      res.status(500).end(`launch-editor-middleware: required query param "file" is missing.`)
    } else {
      launch(file, specifiedEditor, onErrorCallback)
      res.end()
    }
  }
}
