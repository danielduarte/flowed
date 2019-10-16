import { expect } from 'chai';
import { FlowManager, GenericValueMap } from '../src';

describe('resolver loop', () => {
  it('run without error', async () => {
    class Concat {
      public async exec(params: GenericValueMap, context: GenericValueMap): Promise<GenericValueMap> {
        return { result: params.x + context.separator + params.y };
      }
    }

    const results = (await FlowManager.run(
      {
        tasks: {
          concatArray: {
            requires: ['params', 'context'],
            provides: ['preResults'],
            resolver: {
              name: 'flowed::ArrayMap',
              params: {
                spec: {
                  value: {
                    requires: ['x', 'y'],
                    provides: ['result'],
                    resolver: {
                      name: 'customResolver',
                    },
                  },
                },
                resolver: { value: Concat }, // @todo Make this reference serializable instead of a constructor pointer
                automapParams: { value: true },
                automapResults: { value: true },
              },
              results: {
                results: 'preResults',
              },
            },
          },
          postProcess: {
            requires: ['preResults'],
            provides: ['results'],
            resolver: {
              name: 'flowed::Echo',
              params: {
                in: { transform: { '{{#each preResults}}': '{{result}}' } },
              },
              results: {
                out: 'results',
              },
            },
          },
        },
        configs: {
          resolverAutomapParams: true,
          resolverAutomapResults: true,
        },
      },
      {
        params: [{ x: 'x1', y: 'y1' }, { x: 'x2', y: 'y2' }, { x: 'x3', y: 'y3' }, { x: 'x4', y: 'y4' }],
        context: { separator: '-' },
      },
      ['results'],
    )).results;

    expect(results).to.be.eql(['x1-y1', 'x2-y2', 'x3-y3', 'x4-y4']);
  });
});
