# launch-editor

Open file with line numbers in editor from Node.js.

The main functionality is extracted from [react-dev-utils](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-dev-utils/launchEditor.js) with slight modifications so that it can be used as a standalone package. The original source code is licensed under MIT.

## Why

There are also a few other existing packages with the same purpose:

- [lahmatiy/open-in-editor](https://github.com/lahmatiy/open-in-editor)
- [sindresorhus/open-editor](https://github.com/sindresorhus/open-editor)

However, both expects env variables like `EDITOR` to be set in order to open files. This package infers the editor to open by checking current running processes before falling back to env variables.

On the other hand,`react-dev-tools` includes many other utilities and dependencies and is thus not suitable for standalone usage.

## Usage

``` js
const launch = require('launch-editor')

launch(
  // filename
  'foo.js',
  // lineNumber
  13,
  // try specific editor bin first (optional)
  'code',
  // callback if failed to launch (optional)
  (fileName, errorMsg) => {
    // log error if any
  }
)
```

### Middleware

An express/webpack-dev-server compatible middleware is also available:

``` js
const launchMiddleware = require('launch-editor-middleware')

app.use('/__open-in-editor', launchMiddleware())
```

The middleware factory function accepts two optional arguments:

1. a specific editor bin to try first.
2. a callback when it fails to launch the editor.

To launch files, send requests to the server like the following:

```
/__open-in-editor?file=src/main.js:13
```
