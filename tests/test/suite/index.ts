import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import { getVSCodeExecutablePath, getLaunchArgs } from '../../../.vscode-test';

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to the extension test runner script
    const extensionTestsPath = path.resolve(__dirname, './index.runner');

    // Get the VS Code executable path
    const vscodeExecutablePath = await getVSCodeExecutablePath();

    // Get the launch arguments
    const launchArgs = getLaunchArgs();

    // Download and unzip VS Code if needed, then run the integration test
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs,
      extensionTestsEnv: {
        // Set any environment variables needed for testing
        NODE_ENV: 'test',
        AIMASTERY_TEST_MODE: 'true',
      },
    });
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();
