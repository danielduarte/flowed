import { expect } from 'chai';
import { TaskResolverMap, ValueMap, FlowManager, FlowSpec } from '../src';

class DummyResolver {
  public async exec(): Promise<ValueMap> {
    return {};
  }
}

describe('the FlowManager', () => {
  it('can run an empty flow', () => {
    const flowSpec: FlowSpec = {};

    return FlowManager.run(flowSpec);
  });

  it('can run a simple flow', () => {
    const flowSpec: FlowSpec = {
      tasks: {
        sampleTask: {
          resolver: {
            name: 'sampleResolver',
          },
        },
      },
    };

    const resolvers: TaskResolverMap = {
      sampleResolver: DummyResolver,
    };

    return FlowManager.run(flowSpec, {}, [], resolvers);
  });

  it('can calculate Pythagoras', () => {
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

    const c1 = 3;
    const c2 = 4;
    const h = Math.sqrt(c1 * c1 + c2 * c2);

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
            provides: ['h'],
            resolver: {
              name: 'sqrt',
              params: { x: 'sum' },
              results: { result: 'h' },
            },
          },
        },
      },
      {
        c1,
        c2,
      },
      ['h'],
      {
        sqr: Sqr,
        sqrt: Sqrt,
        sum: Sum,
      },
    ).then((result: ValueMap) => {
      expect(result.h).to.equal(h);
    });
  });
});
