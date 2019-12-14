import { expect } from 'chai';
import { debug as rawDebug } from 'debug';
import { FlowManager, ValueMap } from '../src';
const debug = rawDebug('flowed:test');

describe('flow with non solvable results', () => {
  it('throws an error (configurable)', async () => {
    class Echo {
      public async exec(params: ValueMap): Promise<ValueMap> {
        return { out1: params.in1, out2: params.in2 };
      }
    }

    const flowSpec = {
      tasks: {
        t1: {
          provides: ['B', 'E'],
          resolver: {
            name: 'runner',
            params: {
              in1: { value: 'b' },
              in2: { value: 'e' },
            },
            results: {
              out1: 'B',
              out2: 'E',
            },
          },
        },
        t2: {
          provides: ['F', 'G'],
          resolver: {
            name: 'runner',
            params: {
              in1: { value: 'f' },
              in2: { value: 'g' },
            },
            results: {
              out1: 'F',
              out2: 'G',
            },
          },
        },
        t3: {
          provides: ['H', 'B'],
          resolver: {
            name: 'runner',
            params: {
              in1: { value: 'h' },
              in2: { value: 'b2' },
            },
            results: {
              out1: 'H',
              out2: 'B',
            },
          },
        },
      },
      configs: {
        throwErrorOnUnsolvableResult: true,
      },
    };

    const expected = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

    // Should throw an error
    let errorMsg = 'No error';
    try {
      await FlowManager.run(flowSpec, {}, expected, {
        runner: Echo,
      });
    } catch (error) {
      errorMsg = error.message;
      debug(errorMsg);
    }
    expect(errorMsg).to.be.eql('The results [A, C, D] are not provided by any task');

    // Should NOT throw an error (turning of throwErrorOnUnsolvableResult)
    flowSpec.configs.throwErrorOnUnsolvableResult = false;
    errorMsg = 'No error';
    try {
      await FlowManager.run(flowSpec, {}, expected, {
        runner: Echo,
      });
    } catch (error) {
      errorMsg = error.message;
      debug(errorMsg);
    }
    expect(errorMsg).to.be.eql('No error');
  });
});
