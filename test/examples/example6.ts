import { GenericValueMap } from '../../src';
import { FlowManager } from '../../src/engine';
import { Task } from '../../src/engine';
import { ExampleFunction } from './types';

class TimerResolver {
  public async exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ a: 1 });
      }, 200);
    });
  }
}

class DirectResolver {
  public async exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {
    return { b: 2 };
  }
}

// noinspection JSUnusedGlobalSymbols
export const example6: ExampleFunction = () => {
  return FlowManager.runFromFile(
    'test/examples/example6.flowed.json',
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
