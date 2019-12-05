import { GenericValueMap } from '../../src';
import { FlowManager } from '../../src/engine';
import { ExampleFunction } from './types';

class DummyResolver {
  public async exec(): Promise<GenericValueMap> {
    return {};
  }
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
      r: DummyResolver,
    },
  );
};
