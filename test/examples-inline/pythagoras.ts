import { ValueMap, FlowManager } from '../../src';
import { ExampleFunction } from '../examples/types';

// Example of named function used as resolver
function sqr(params?: ValueMap) {
  return {
    result: params?.x * params?.x,
  };
}

// Example of arrow function used as resolver
const sqrt = (params?: ValueMap) => ({
  result: Math.sqrt(params?.x),
});

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
      sqr,
      sqrt,
      sum: (params?: ValueMap) => ({ result: params?.x + params?.y }),
    },
  );
};
