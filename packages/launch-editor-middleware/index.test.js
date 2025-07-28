const assert = require('node:assert/strict');
const {describe, test, mock} = require('node:test');

const noop = () => {};

mock.module('launch-editor', {
  defaultExport: noop
})
const launchEditorMiddleware = require('./index.js');

class MockResponse {
  constructor() {
    this.statusCode = -1;
    this.body = '';
  }

  end(body) {
    this.body = body || '';
  }
}

class MockRequest {
  constructor(url) {
    this.url = url;
  }
}

describe('launchEditorMiddleware', () => {
  test('returns a 500 if no file query param', async () => {
    const middleware = launchEditorMiddleware(
      'vim',
      undefined,
      noop
    );

    const req = new MockRequest('https://localhost/');
    const res = new MockResponse(null);

    middleware(req, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body, 'launch-editor-middleware: required query param "file" is missing.');
  });

  test('launches editor with specified file', async () => {
    const middleware = launchEditorMiddleware(
      'vim',
      undefined,
      noop
    );

    const file = 'mock/file:100';
    const req = new MockRequest(`https://localhost/?file=${file}`);
    const res = new MockResponse(null);

    middleware(req, res);

    // -1 here means it was never set
    assert.equal(res.statusCode, -1);
    assert.equal(res.body, '');
  });

  test('falsy file parameter returns 500', async () => {
    const middleware = launchEditorMiddleware(
      'vim',
      undefined,
      noop
    );

    const req = new MockRequest('https://localhost/?file=');
    const res = new MockResponse(null);

    middleware(req, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body, 'launch-editor-middleware: required query param "file" is missing.');
  });

  test('returns 500 on invalid URL', async () => {
    const middleware = launchEditorMiddleware(
      'vim',
      undefined,
      noop
    );

    const req = new MockRequest('some invalid URL');
    const res = new MockResponse(null);

    middleware(req, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body, 'launch-editor-middleware: invalid URL.');
  });
});
