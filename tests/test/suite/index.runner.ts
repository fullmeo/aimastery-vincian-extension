import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import * as Mocha from 'mocha';
import * as glob from 'glob';

// This function is called by the test runner to run the tests
export async function run(_testRoot: string, callback: (error: any, failures?: number) => void) {
  try {
    // Create the mocha test
    const mocha = new Mocha({
      ui: 'bdd',
      color: true,
      timeout: 10000,
      reporter: 'mocha-multi-reporters',
      reporterOptions: {
        reporterEnabled: 'spec, mocha-junit-reporter',
        mochaJunitReporterReporterOptions: {
          mochaFile: path.join(__dirname, '..', '..', '..', 'test-results.xml')
        }
      }
    });

    // Add all test files to the mocha instance
    const testFiles = glob.sync('**/**.test.js', { cwd: __dirname });
    testFiles.forEach(f => mocha.addFile(path.resolve(__dirname, f)));

    // Run the mocha test
    const failures = await new Promise<number>(resolve => {
      mocha.run(failures => {
        resolve(failures);
      });
    });

    callback(null, failures);
  } catch (err) {
    console.error('Error running tests:', err);
    callback(err);
  }
}

// This is the entry point for the test runner
if (require.main === module) {
  // Run the tests
  run(process.cwd(), (err, failures) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(failures ? 1 : 0);
  });
}
