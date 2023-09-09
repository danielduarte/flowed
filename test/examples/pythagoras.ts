import { ValueMap, FlowManager } from '../../src';
import { ExampleFunction } from './types';

class Sqr {
  public async exec(params: ValueMap): Promise<ValueMap> {
    return {
      result: params.x * params.x,
    };
  }
}

class Sqrt {
  public async exec(params: ValueMap): Promise<ValueMap> {
    return {
      result: Math.sqrt(params.x),
    };
  }
}

class Sum {
  public async exec(params: ValueMap): Promise<ValueMap> {
    return {
      result: params.x + params.y,
    };
  }
}

// noinspection JSUnusedGlobalSymbols
export const pythagoras: ExampleFunction = () => {
  return FlowManager.run(
    {
      tasks: {
        sqr1: {
          requires: ['c1'],
          provides: ['c1^2'],
          resolver: {
            name: 'sqr',
            params: { x: 'c1' },
            results: { result: 'c1^2' },
          },
        },
        sqr2: {
          requires: ['c2'],
          provides: ['c2^2'],
          resolver: {
            name: 'sqr',
            params: { x: 'c2' },
            results: { result: 'c2^2' },
          },
        },
        sum: {
          requires: ['c1^2', 'c2^2'],
          provides: ['sum'],
          resolver: {
            name: 'sum',
            params: { x: 'c1^2', y: 'c2^2' },
            results: { result: 'sum' },
          },
        },
        sqrt: {
          requires: ['sum'],
          provides: ['result'],
          resolver: {
            name: 'sqrt',
            params: { x: 'sum' },
            results: { result: 'result' },
          },
        },
      },
    },
    {
      c1: 3,
      c2: 4,
    },
    ['result'],
    {
      sqr: Sqr,
      sqrt: Sqrt,
      sum: Sum,
    },
  );
};
