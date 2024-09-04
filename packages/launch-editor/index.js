/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/facebookincubator/create-react-app/blob/master/LICENSE
 *
 * Modified by Yuxi Evan You
 */

const fs = require('fs')
const os = require('os')
const path = require('path')
const colors = require('picocolors')
const childProcess = require('child_process')

const guessEditor = require('./guess')
const getArgumentsForPosition = require('./get-args')

function wrapErrorCallback (cb) {
  return (fileName, errorMessage) => {
    console.log()
    console.log(
      colors.red('Could not open ' + path.basename(fileName) + ' in the editor.')
    )
    if (errorMessage) {
      if (errorMessage[errorMessage.length - 1] !== '.') {
        errorMessage += '.'
      }
      console.log(
        colors.red('The editor process exited with an error: ' + errorMessage)
      )
    }
    console.log()
    if (cb) cb(fileName, errorMessage)
  }
}

function isTerminalEditor (editor) {
  switch (editor) {
    case 'vim':
    case 'emacs':
    case 'nano':
      return true
  }
  return false
}

const positionRE = /:(\d+)(:(\d+))?$/
function parseFile (file) {
  const fileName = file.replace(positionRE, '')
  const match = file.match(positionRE)
  const lineNumber = match && match[1]
  const columnNumber = match && match[3]
  return {
    fileName,
    lineNumber,
    columnNumber
  }
}

let _childProcess = null

function launchEditor (file, specifiedEditor, onErrorCallback) {
  const parsed = parseFile(file)
  let { fileName } = parsed
  const { lineNumber, columnNumber } = parsed

  if (!fs.existsSync(fileName)) {
    return
  }

  if (typeof specifiedEditor === 'function') {
    onErrorCallback = specifiedEditor
    specifiedEditor = undefined
  }

  onErrorCallback = wrapErrorCallback(onErrorCallback)

  const [editor, ...args] = guessEditor(specifiedEditor)
  if (!editor) {
    onErrorCallback(fileName, null)
    return
  }

  if (
    process.platform === 'linux' &&
    fileName.startsWith('/mnt/') &&
    /Microsoft/i.test(os.release())
  ) {
    // Assume WSL / "Bash on Ubuntu on Windows" is being used, and
    // that the file exists on the Windows file system.
    // `os.release()` is "4.4.0-43-Microsoft" in the current release
    // build of WSL, see: https://github.com/Microsoft/BashOnWindows/issues/423#issuecomment-221627364
    // When a Windows editor is specified, interop functionality can
    // handle the path translation, but only if a relative path is used.
    fileName = path.relative('', fileName)
  }

  if (lineNumber) {
    const extraArgs = getArgumentsForPosition(editor, fileName, lineNumber, columnNumber)
    args.push.apply(args, extraArgs)
  } else {
    args.push(fileName)
  }

  if (_childProcess && isTerminalEditor(editor)) {
    // There's an existing editor process already and it's attached
    // to the terminal, so go kill it. Otherwise two separate editor
    // instances attach to the stdin/stdout which gets confusing.
    _childProcess.kill('SIGKILL')
  }

  if (process.platform === 'win32') {
    // On Windows, launch the editor in a shell because spawn can only
    // launch .exe files.

    // However, CMD.exe on Windows is vulnerable to RCE attacks given a file name of the
    // form "C:\Users\myusername\Downloads\& curl 172.21.93.52".
    // `create-react-app` used a safe file name pattern to validate user-provided file names:
    // - https://github.com/facebook/create-react-app/pull/4866
    // - https://github.com/facebook/create-react-app/pull/5431
    // But that's not a viable solution for this package because
    // it's depended on by so many meta frameworks that heavily rely on
    // special characters in file names for filesystem-based routing.
    // We need to at least:
    // - Support `+` because it's used in SvelteKit and Vike
    // - Support `$` because it's used in Remix
    // - Support `(` and `)` because they are used in Analog, SolidStart, and Vike
    // - Support `@` because it's used in Vike
    // - Support `[` and `]` because they are widely used for [slug]
    // So here we choose to use `^` to escape special characters instead.

    const doubleQuote = (str) => `"${str}"`
    // Need to double quote the editor path in case it contains spaces;

    // If the fileName contains spaces, we also need to double quote it in the arguments
    // However, there's a case that it's concatenated with line number and column number
    // which is separated by `:`. We need to double quote the whole string in this case.
    function doubleQuoteIfNeeded(str) {
      return str.includes(' ') ? doubleQuote(str) : str
    }
    const launchCommand = doubleQuote(
      [doubleQuote(editor), ...args.map(doubleQuoteIfNeeded)].join(' ')
    )

    // According to https://ss64.com/nt/syntax-esc.html,
    // we can use `^` to escape `&`, `<`, `>`, `|`, `%`, and `^
    function escapeCmdArgs (cmdArgs) {
      return cmdArgs.replace(/([&|<>,;= \t^])/g, '^$1')
    }

    _childProcess = childProcess.spawn(
      'cmd.exe',
      ['/C', escapeCmdArgs(launchCommand)],
      { stdio: 'inherit' }
    )
  } else {
    _childProcess = childProcess.spawn(editor, args, { stdio: 'inherit' })
  }
  _childProcess.on('exit', function (errorCode) {
    _childProcess = null

    if (errorCode) {
      onErrorCallback(fileName, '(code ' + errorCode + ')')
    }
  })

  _childProcess.on('error', function (error) {
    let { code, message } = error
    if ('ENOENT' === code) {
      message = `${message} ('${editor}' command does not exist in 'PATH')`
    }
    onErrorCallback(fileName, message);
  })
}

module.exports = launchEditor
