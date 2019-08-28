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
export const example5: ExampleFunction = () => {
  return FlowManager.run(
    {
      tasks: {
        A: {
          requires: ['b'],
          provides: ['a'],
          resolver: { name: 'r', params: {}, results: {} },
        },
        B: {
          requires: ['a'],
          provides: ['b'],
          resolver: { name: 'r', params: {}, results: {} },
        },
      },
    },
    {
      b: 1,
    },
    [],
    {
      r: DummyResolver,
    },
  );
};
