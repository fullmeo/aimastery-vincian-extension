// This is the configuration file for running tests with @vscode/test-electron
// https://github.com/microsoft/vscode-test/blob/main/sample-test/package.json

const { downloadAndUnzipVSCode } = require('@vscode/test-electron');
const path = require('path');

// This function is called by the test runner to get the path to VS Code
async function getVSCodeExecutablePath() {
  const vscodeVersion = process.env.CODE_VERSION || 'stable'; // or 'insiders', '1.60.0', etc.
  
  try {
    const vscodeExecutablePath = await downloadAndUnzipVSCode(vscodeVersion);
    console.log(`Using VS Code executable at: ${vscodeExecutablePath}`);
    return vscodeExecutablePath;
  } catch (err) {
    console.error('Failed to download and unzip VS Code:', err);
    throw err;
  }
}

// This function returns the launch arguments for the extension tests
function getLaunchArgs() {
  const args = [
    // Disable other extensions
    '--disable-extensions',
    // Disable telemetry
    '--disable-telemetry',
    // Disable welcome page
    '--skip-welcome',
    '--skip-release-notes',
    // Disable update checks
    '--disable-updates',
    // Disable crash reporter
    '--disable-crash-reporter',
    // Disable GPU acceleration
    '--disable-gpu',
    // Disable renderer accessibility
    '--disable-renderer-accessibility',
    // Disable smooth scrolling
    '--disable-smooth-scrolling'
  ];

  // Add any additional arguments here
  return args;
}

module.exports = {
  getVSCodeExecutablePath,
  getLaunchArgs,
  // The extension development path
  extensionDevelopmentPath: path.resolve(__dirname, '.'),
  // The test runner script
  extensionTestsPath: path.resolve(__dirname, './out/test/suite/index'),
  // Launch arguments for VS Code
  launchArgs: getLaunchArgs(),
  // Timeout for tests (in milliseconds)
  launchTimeout: 60000,
  // Version of VS Code to test against
  version: process.env.CODE_VERSION || 'stable',
  // Extension development environment variables
  env: {
    // Add any environment variables needed for tests
    NODE_ENV: 'test',
    // Disable telemetry
    DISABLE_TELEMETRY: 'true',
    // Disable keytar (if used)
    AIMASTERY_DISABLE_KEYTAR: 'true',
    // Enable test mode
    AIMASTERY_TEST_MODE: 'true'
  }
};

// If this file is run directly, output the VS Code executable path
if (require.main === module) {
  getVSCodeExecutablePath()
    .then(path => console.log('VS Code executable path:', path))
    .catch(err => console.error('Error getting VS Code executable path:', err));
}
