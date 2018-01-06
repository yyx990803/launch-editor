const launch = require('launch-editor')
const lineNumberRE = /:(\d+)$/

module.exports = (specifiedEditor, onErrorCallback) => {
  return function launchEditorMiddleware (req, res, next) {
    const { file } = req.query
    if (!file) {
      res.status(500).end(`launch-editor-middleware: required query param "file" is missing.`)
    } else {
      const fileName = file.replace(lineNumberRE, '')
      const lineNumberMatch = file.match(lineNumberRE)
      const lineNumber = lineNumberMatch && lineNumberMatch[1]
      launch(fileName, lineNumber, specifiedEditor, onErrorCallback)
      res.end()
    }
  }
}
