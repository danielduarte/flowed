import { ValueMap, FlowManager } from '../../src';
import { ExampleFunction } from './types';

class DummyResolver {
  public async exec(): Promise<ValueMap> {
    return {};
  }
}

// noinspection JSUnusedGlobalSymbols
export const dependencies: ExampleFunction = () => {
  return FlowManager.run(
    {
      tasks: {
        A: {
          provides: ['a'],
          defaultResult: true,
          resolver: {
            name: 'dummy',
          },
        },
        B: {
          provides: ['b'],
          defaultResult: true,
          resolver: {
            name: 'dummy',
          },
        },
        C: {
          requires: ['a', 'b'],
          provides: ['c'],
          defaultResult: true,
          resolver: {
            name: 'dummy',
          },
        },
        D: {
          provides: ['d'],
          defaultResult: true,
          resolver: {
            name: 'dummy',
          },
        },
        E: {
          requires: ['c', 'd'],
          provides: ['e'],
          resolver: {
            name: 'dummy',
          },
        },
        F: {
          provides: ['f'],
          defaultResult: true,
          resolver: {
            name: 'dummy',
          },
        },
        G: {
          requires: ['e', 'f'],
          provides: ['g'],
          resolver: {
            name: 'dummy',
          },
        },
      },
    },
    {},
    [],
    {
      dummy: DummyResolver,
    },
  );
};
