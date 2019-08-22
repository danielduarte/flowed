import { FlowManager } from '../../src/engine/flow-manager';
import { Task } from '../../src/engine/task';
import { GenericValueMap } from '../../src/types';
import { ExampleFunction } from './types';

class TimerResolver {
  public async exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ a: 1 });
      }, 500);
    });
  }
}

class DirectResolver {
  public async exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {
    return { b: 2 };
  }
}

export const example6: ExampleFunction = () => {
  return FlowManager.runFromFile(
    'src/examples/example6.yafe.json',
    {
      param1: 'PARAM1',
      param2: 'PARAM2',
      param3: 'PARAM3',
    },
    ['g1', 'g2'],
    {
      timer: TimerResolver,
      direct: DirectResolver,
    },
  );
};
