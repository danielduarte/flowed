import { FlowManager } from '../../src/engine';
import { ExampleFunction } from '../examples/types';

// noinspection JSUnusedGlobalSymbols
export const syncAsync: ExampleFunction = () => {
  return FlowManager.run(
    {
      tasks: {
        B: {
          requires: ['param1'],
          provides: ['b1'],
          resolver: {
            name: 'timer',
            results: { a: 'b1' },
          },
        },
        C: {
          requires: ['param2'],
          provides: ['c1', 'c2'],
          defaultResult: undefined,
          resolver: {
            name: 'direct',
          },
        },
        A: {
          requires: ['b1', 'c1', 'c2'],
          provides: ['a4', 'a5'],
          defaultResult: null,
          resolver: {
            name: 'timer',
            results: { a: 'a4', b: 'a5' },
          },
        },
        D: {
          requires: ['a4', 'a5'],
          provides: ['d3'],
          defaultResult: true,
          resolver: {
            name: 'timer',
          },
        },
        E: {
          requires: ['a5', 'f1'],
          provides: ['e3'],
          defaultResult: false,
          resolver: {
            name: 'timer',
          },
        },
        F: {
          requires: ['param3'],
          provides: ['f1'],
          resolver: {
            name: 'direct',
            results: { b: 'f1' },
          },
        },
        G: {
          requires: ['d3', 'e3'],
          provides: ['g1', 'g2'],
          defaultResult: 8,
          resolver: {
            name: 'timer',
          },
        },
      },
    },
    {
      param1: 'PARAM1',
      param2: 'PARAM2',
      param3: 'PARAM3',
    },
    ['g1', 'g2'],
    {
      timer: () =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({ a: 1 });
          }, 10);
        }),
      direct: () => ({ b: 2 }),
    },
  );
};
