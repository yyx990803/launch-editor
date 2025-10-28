const assert = require('node:assert/strict')
const { describe, test } = require('node:test')
const getArgumentsForPosition = require('./get-args.js')

describe('getArgumentsForPosition', () => {
  test('should format arguments for Visual Studio (devenv)', () => {
    const result = getArgumentsForPosition('devenv.exe', 'test.js', 10, 5)
    assert.deepEqual(result, ['/edit', 'test.js'])
  })

  test('should format arguments for Visual Studio (visualstudio)', () => {
    const result = getArgumentsForPosition('visualstudio', 'src/app.js', 42, 12)
    assert.deepEqual(result, ['/edit', 'src/app.js'])
  })

  test('should format arguments for Visual Studio with default column', () => {
    const result = getArgumentsForPosition('devenv.exe', 'main.cpp', 100)
    assert.deepEqual(result, ['/edit', 'main.cpp'])
  })

  test('should format arguments for VS Code for comparison', () => {
    const result = getArgumentsForPosition('code.exe', 'test.js', 10, 5)
    assert.deepEqual(result, ['-r', '-g', 'test.js:10:5'])
  })

  test('should format arguments for Notepad++ for comparison', () => {
    const result = getArgumentsForPosition('notepad++.exe', 'test.txt', 15, 8)
    assert.deepEqual(result, ['-n15', '-c8', 'test.txt'])
  })
})
