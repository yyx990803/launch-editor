import path from 'path';
import shellQuote from 'shell-quote';
import childProcess from 'child_process';

// Map from full process name to binary that starts the process
// We can't just re-use full process name, because it will spawn a new instance
// of the app every time
import COMMON_EDITORS_OSX from './editor-info/osx';
import COMMON_EDITORS_LINUX from './editor-info/linux';
import COMMON_EDITORS_WIN from './editor-info/windows';

const guessEditor = (
  specifiedEditor?: undefined | Parameters<typeof shellQuote.parse>[0], // we don't care what the actual underlying type is; it's whatever shellQuote uses.
) => {
  if (specifiedEditor) return shellQuote.parse(specifiedEditor);
  if (process.env.LAUNCH_EDITOR) return [process.env.LAUNCH_EDITOR];
  if (process.versions.webcontainer) return [process.env.EDITOR || 'code'];

  // We can find out which editor is currently running by:
  // `ps x` on macOS and Linux
  // `Get-Process` on Windows
  try {
    switch (process.platform) {
      case 'darwin': {
        const output = childProcess
          .execSync('ps x -o comm=', {
            stdio: ['pipe', 'pipe', 'ignore'],
          })
          .toString();
        const processNames = Object.keys(COMMON_EDITORS_OSX);
        const processList = output.split('\n');
        for (let i = 0; i < processNames.length; i++) {
          const processName = processNames[i];
          // Find editor by exact match.
          if (output.indexOf(processName) !== -1) {
            return [COMMON_EDITORS_OSX[processName]];
          }
          const processNameWithoutApplications = processName.replace(
            '/Applications',
            '',
          );
          // Find editor installation not in /Applications.
          if (output.indexOf(processNameWithoutApplications) !== -1) {
            // Use the CLI command if one is specified
            if (processName !== COMMON_EDITORS_OSX[processName]) {
              return [COMMON_EDITORS_OSX[processName]];
            }
            // Use a partial match to find the running process path.  If one is found, use the
            // existing path since it can be running from anywhere.
            const runningProcess = processList.find(procName =>
              procName.endsWith(processNameWithoutApplications),
            );
            if (runningProcess !== undefined) {
              return [runningProcess];
            }
          }
        }
        break;
      }
      case 'win32': {
        const output = childProcess
          .execSync(
            'powershell -NoProfile -Command "Get-CimInstance -Query \\"select executablepath from win32_process where executablepath is not null\\" | % { $_.ExecutablePath }"',
            {
              stdio: ['pipe', 'pipe', 'ignore'],
            },
          )
          .toString();
        const runningProcesses = output.split('\r\n');
        for (let i = 0; i < runningProcesses.length; i++) {
          const fullProcessPath = runningProcesses[i].trim();
          const shortProcessName = path.basename(fullProcessPath);

          if (COMMON_EDITORS_WIN.indexOf(shortProcessName) !== -1) {
            return [fullProcessPath];
          }
        }
        break;
      }
      case 'linux': {
        // --no-heading No header line
        // x List all processes owned by you
        // -o comm Need only names column
        const output = childProcess
          .execSync('ps x --no-heading -o comm --sort=comm', {
            stdio: ['pipe', 'pipe', 'ignore'],
          })
          .toString();
        const processNames = Object.keys(COMMON_EDITORS_LINUX);
        for (let i = 0; i < processNames.length; i++) {
          const processName = processNames[i];
          if (output.indexOf(processName) !== -1) {
            return [COMMON_EDITORS_LINUX[processName]];
          }
        }
      }
    }
  } catch (error) {
    // Ignore...
  }

  // Last resort, use old skool env vars
  if (process.env.VISUAL) {
    return [process.env.VISUAL];
  } else if (process.env.EDITOR) {
    return [process.env.EDITOR];
  }

  return []; // was formerly [null]; omitting any value entirely makes more sense
};
export default guessEditor;
