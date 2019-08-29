import { expect } from 'chai';
import { FlowManager, GenericValueMap } from '../src';

describe('resolvers with direct value', () => {
  it('run without error', async () => {
    class Sum {
      public async exec(params: GenericValueMap): Promise<GenericValueMap> {
        return { z: params.x + params.y };
      }
    }

    const sum = (await FlowManager.run(
      {
        tasks: {
          sum: {
            requires: [],
            provides: ['result'],
            resolver: {
              name: 'sum',
              params: {
                x: { value: 111 },
                y: { value: 222 },
              },
              results: { z: 'result' },
            },
          },
        },
      },
      {},
      ['result'],
      {
        sum: Sum,
      },
    )).result;

    expect(sum).to.be.eql(111 + 222);
  });

  it('run without sharing values between tasks', async () => {
    class SumOrConcat {
      public async exec(params: GenericValueMap): Promise<GenericValueMap> {
        return { z: params.x + params.y };
      }
    }

    const results = await FlowManager.run(
      {
        tasks: {
          sum: {
            requires: [],
            provides: ['result1'],
            resolver: {
              name: 'sumOrConcat',
              params: {
                x: { value: 111 },
                y: { value: 222 },
              },
              results: { z: 'result1' },
            },
          },
          concat: {
            requires: ['text1', 'text2'],
            provides: ['result2'],
            resolver: {
              name: 'sumOrConcat',
              params: {
                x: 'text1',
                y: 'text2',
              },
              results: { z: 'result2' },
            },
          },
        },
      },
      {
        text1: 'this is ',
        text2: 'a result',
      },
      ['result1', 'result2'],
      {
        sumOrConcat: SumOrConcat,
      },
    );

    expect(results).to.be.eql({
      result1: 111 + 222,
      result2: 'this is a result',
    });
  });
});
