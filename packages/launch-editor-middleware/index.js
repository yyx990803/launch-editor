const path = require('path')
const launch = require('launch-editor')

module.exports = (specifiedEditor, srcRoot, onErrorCallback) => {
  if (typeof specifiedEditor === 'function') {
    onErrorCallback = specifiedEditor
    specifiedEditor = undefined
  }

  if (typeof srcRoot === 'function') {
    onErrorCallback = srcRoot
    srcRoot = undefined
  }

  srcRoot = srcRoot || process.cwd()

  return function launchEditorMiddleware(req, res) {
    let url

    try {
      url = new URL(req.url)
      // eslint-disable-next-line no-unused-vars
    } catch (_err) {
      res.statusCode = 500
      res.end(`launch-editor-middleware: invalid URL.`)
      return
    }

    const file = url.searchParams.get('file')
    if (!file) {
      res.statusCode = 500
      res.end(
        `launch-editor-middleware: required query param "file" is missing.`
      )
    } else {
      launch(path.resolve(srcRoot, file), specifiedEditor, onErrorCallback)
      res.end()
    }
  }
}
