import { expect } from 'chai';
import { FlowManager, GenericValueMap } from '../src';

describe('context for flows', () => {
  it('are used without error', async () => {
    class SampleWithContext {
      public async exec(params: GenericValueMap, context: GenericValueMap): Promise<GenericValueMap> {
        return { result: context.prefix + params.text + context.sufix };
      }
    }

    const flowSpec = {
      tasks: {
        wrap1: {
          requires: [],
          provides: ['out1'],
          resolver: {
            name: 'SampleWithContext',
            params: {
              text: { value: 'this is the first task' },
            },
            results: { result: 'out1' },
          },
        },
        wrap2: {
          requires: [],
          provides: ['out2'],
          resolver: {
            name: 'SampleWithContext',
            params: {
              text: { value: 'this is the second task' },
            },
            results: { result: 'out2' },
          },
        },
      },
    };

    let texts;

    texts = await FlowManager.run(flowSpec, {}, ['out1', 'out2'], { SampleWithContext }, { prefix: '<<', sufix: '>>' });
    expect(texts).to.be.eql({
      out1: '<<this is the first task>>',
      out2: '<<this is the second task>>',
    });

    texts = await FlowManager.run(
      flowSpec,
      {},
      ['out1', 'out2'],
      { SampleWithContext },
      { prefix: '(', sufix: ')', moreStuff: 'ignored value' },
    );
    expect(texts).to.be.eql({
      out1: '(this is the first task)',
      out2: '(this is the second task)',
    });

    texts = await FlowManager.run(
      flowSpec,
      {},
      ['out1', 'out2'],
      { SampleWithContext },
      { prefix: 'AT THE BEGINNING ' /* missing sufix on purpose */ },
    );
    expect(texts).to.be.eql({
      out1: 'AT THE BEGINNING this is the first taskundefined',
      out2: 'AT THE BEGINNING this is the second taskundefined',
    });
  });
});
