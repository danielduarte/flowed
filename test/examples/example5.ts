import { GenericValueMap } from '../../src/types';
import { FlowManager } from '../../src/engine/flow-manager';
import { Task } from '../../src/engine/task';
import { ExampleFunction } from './types';

class DummyResolver {
  public async exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {
    return {};
  }
}

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
