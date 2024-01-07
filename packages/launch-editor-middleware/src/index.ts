import url from 'url';
import path from 'path';
import launch from 'launch-editor';

export default (
  specifiedEditor: undefined,
  srcRoot: string | undefined,
  onErrorCallback: any,
) => {
  if (typeof specifiedEditor === 'function') {
    onErrorCallback = specifiedEditor;
    specifiedEditor = undefined;
  }

  if (typeof srcRoot === 'function') {
    onErrorCallback = srcRoot;
    srcRoot = undefined;
  }

  srcRoot = srcRoot || process.cwd();

  const launchEditorMiddleware = (
    req: {
      url: string;
    },
    res: { statusCode: number; end: (response?: string | undefined) => void },
  ) => {
    const { file } = url.parse(req.url, true).query || {};
    if (!file) {
      res.statusCode = 500;
      res.end(
        `launch-editor-middleware: required query param "file" is missing.`,
      );
    } else {
      launch(
        path.resolve(srcRoot!, ...(Array.isArray(file) ? file : [file])), // file can be an array for some reason, idk why/when
        specifiedEditor,
        onErrorCallback,
      );
      res.end();
    }
  };
  return launchEditorMiddleware;
};
