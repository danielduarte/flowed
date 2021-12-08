import { FlowManager } from '../src';
import { expect } from 'chai';

describe('plugins', () => {
  it('can install a plugin', async () => {
    const functionalResolver = () => ({});
    const classResolver = class A {
      exec() {
        return Promise.resolve({});
      }
    };

    const myPlugin = {
      resolverLibrary: {
        r1: functionalResolver,
        r2: classResolver,
      },
    };

    FlowManager.installPlugin(myPlugin);
  });

  it('can use a plugin resolver', async () => {
    class A {
      exec() {
        return Promise.resolve({ x: 123 });
      }
    }

    const myPlugin = {
      resolverLibrary: { A },
    };

    const spec = {
      tasks: {
        dummy: {
          provides: ['result'],
          resolver: {
            name: 'A',
            results: {
              x: 'result',
            },
          },
        },
      },
    };

    try {
      // Run before plugin installation
      await FlowManager.run(spec, undefined, ['result']);
    } catch (err) {
      expect((err as Error).message).to.be.eql("Task resolver 'A' for task 'dummy' has no definition. Defined custom resolvers are: [].");
    }

    FlowManager.installPlugin(myPlugin);

    // Run after plugin installation
    const { result } = await FlowManager.run(spec, undefined, ['result']);

    expect(result).to.be.eql(123);
  });
});
