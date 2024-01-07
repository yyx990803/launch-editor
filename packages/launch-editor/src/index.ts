/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/facebookincubator/create-react-app/blob/master/LICENSE
 *
 * Modified by Yuxi Evan You
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import colors from 'picocolors';
import childProcess, { ChildProcess } from 'child_process';

import guessEditor from './guess';
import getArgumentsForPosition from './get-args';
import { Editor } from './editor-info/Editor';

export type ErrorCallback = (
  fileName: string,
  errorMessage?: string | undefined | null,
) => void;
const wrapErrorCallback = (cb: ErrorCallback) =>
  ((fileName, errorMessage) => {
    console.log();
    console.log(
      colors.red(
        'Could not open ' + path.basename(fileName) + ' in the editor.',
      ),
    );
    if (errorMessage) {
      if (errorMessage[errorMessage.length - 1] !== '.') {
        errorMessage += '.';
      }
      console.log(
        colors.red('The editor process exited with an error: ' + errorMessage),
      );
    }
    console.log();
    if (cb) cb(fileName, errorMessage);
  }) satisfies ErrorCallback;

const isTerminalEditor = (editor: Editor) => {
  switch (editor) {
    case 'vim':
    case 'emacs':
    case 'nano':
      return true;
  }
  return false;
};

const positionRE = /:(\d+)(:(\d+))?$/;
const parseFile = (file: string) => {
  const fileName = file.replace(positionRE, '');
  const match = file.match(positionRE);
  const lineNumber = match && match[1];
  const columnNumber = match && match[3];
  return {
    fileName,
    lineNumber,
    columnNumber,
  };
};

let _childProcess: ChildProcess | null = null;

const launchEditor = (
  file: string,
  specifiedEditor: Editor | undefined | ErrorCallback,
  onErrorCallback?: ErrorCallback,
) => {
  const parsed = parseFile(file);
  let { fileName } = parsed;
  const { lineNumber, columnNumber } = parsed;

  if (!fs.existsSync(fileName)) {
    return;
  }

  if (typeof specifiedEditor === 'function') {
    onErrorCallback = specifiedEditor;
    specifiedEditor = undefined;
  }

  onErrorCallback = wrapErrorCallback(onErrorCallback!);

  const [editor, ...args] = guessEditor(specifiedEditor) as string[];
  if (!editor) {
    onErrorCallback(fileName, null);
    return;
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
    fileName = path.relative('', fileName);
  }

  if (lineNumber) {
    const extraArgs = getArgumentsForPosition(
      editor.toString(),
      fileName,
      lineNumber,
      columnNumber,
    );
    args.push(...extraArgs);
  } else {
    args.push(fileName);
  }

  if (_childProcess && isTerminalEditor(editor)) {
    // There's an existing editor process already and it's attached
    // to the terminal, so go kill it. Otherwise two separate editor
    // instances attach to the stdin/stdout which gets confusing.
    _childProcess.kill('SIGKILL');
  }

  _childProcess =
    process.platform === 'win32'
      ? childProcess.spawn(
          'cmd.exe',
          ['/C', `${editor}`].concat(args.map(v => `${v}`)),
          {
            stdio: 'inherit',
          },
        )
      : childProcess.spawn(editor, args, { stdio: 'inherit' });

  _childProcess.on('exit', errorCode => {
    _childProcess = null;

    if (errorCode) {
      onErrorCallback?.(fileName, `(code ${errorCode})`);
    }
  });

  _childProcess.on('error', error => {
    onErrorCallback?.(fileName, error.message);
  });
};

export default launchEditor;
