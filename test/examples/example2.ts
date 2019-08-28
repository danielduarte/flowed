import { GenericValueMap } from '../../src';
import { FlowManager } from '../../src/engine';
import { Task } from '../../src/engine';
import { ExampleFunction } from './types';

class DummyResolver {
  public async exec(): Promise<GenericValueMap> {
    return {};
  }
}

// noinspection JSUnusedGlobalSymbols
export const example2: ExampleFunction = () => {
  return FlowManager.run(
    {
      tasks: {
        A: {
          requires: [],
          provides: ['a'],
          resolver: {
            name: 'dummy',
            params: {},
            results: {},
          },
        },
        B: {
          requires: [],
          provides: ['b'],
          resolver: {
            name: 'dummy',
            params: {},
            results: {},
          },
        },
        C: {
          requires: ['a', 'b'],
          provides: ['c'],
          resolver: {
            name: 'dummy',
            params: {},
            results: {},
          },
        },
        D: {
          requires: [],
          provides: ['d'],
          resolver: {
            name: 'dummy',
            params: {},
            results: {},
          },
        },
        E: {
          requires: ['c', 'd'],
          provides: ['e'],
          resolver: {
            name: 'dummy',
            params: {},
            results: {},
          },
        },
        F: {
          requires: [],
          provides: ['f'],
          resolver: {
            name: 'dummy',
            params: {},
            results: {},
          },
        },
        G: {
          requires: ['e', 'f'],
          provides: ['g'],
          resolver: {
            name: 'dummy',
            params: {},
            results: {},
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
