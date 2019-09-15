import { FlowCompiler } from '../src';

describe('compiler', () => {
  it('can generate code for a flow', async () => {

    FlowCompiler.compile({
      tasks: {
        A: {
          requires: ['v1'],
          provides: ['v2', 'v3'],
          resolver: {
            name: 'dummy',
            params: {},
            results: {},
          },
        },
        B: {
          requires: ['v2'],
          provides: ['v4'],
          resolver: {
            name: 'dummy',
            params: {},
            results: {},
          },
        },
        C: {
          requires: ['v2'],
          provides: ['v5'],
          resolver: {
            name: 'dummy',
            params: {},
            results: {},
          },
        },
        D: {
          requires: ['v3'],
          provides: ['v7'],
          resolver: {
            name: 'dummy',
            params: {},
            results: {},
          },
        },
        E: {
          requires: ['v4', 'v5'],
          provides: ['v6'],
          resolver: {
            name: 'dummy',
            params: {},
            results: {},
          },
        },
        F: {
          requires: ['v6', 'v7'],
          provides: ['v8'],
          resolver: {
            name: 'dummy',
            params: {},
            results: {},
          },
        },
      },
    });

    // Uncommend this line to regenerate the compiled flow
    // fs.writeFileSync('./test/compiled.js', FlowCompiler.o);

    const runCompiledFlow = require('./compiled.js');
    runCompiledFlow({});
  });
});
