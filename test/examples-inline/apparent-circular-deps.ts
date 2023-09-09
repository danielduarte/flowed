import { FlowManager } from '../../src';
import { ExampleFunction } from '../examples/types';

function dummyResolver() {
  return {};
}

// noinspection JSUnusedGlobalSymbols
export const apparentCircularDeps: ExampleFunction = () => {
  return FlowManager.run(
    {
      tasks: {
        A: {
          requires: ['b'],
          provides: ['a'],
          resolver: { name: 'r' },
        },
        B: {
          requires: ['a'],
          provides: ['b'],
          resolver: { name: 'r' },
        },
      },
    },
    {
      b: 1,
    },
    [],
    {
      r: dummyResolver,
    },
  );
};
