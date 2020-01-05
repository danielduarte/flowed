import { expect } from 'chai';
import { FlowManager, ValueMap } from '../src';

describe('resolvers with automap', () => {
  class Concat3 {
    public async exec(params: ValueMap): Promise<ValueMap> {
      return { x: (params.a || '1') + (params.b || '2') + (params.c || '3') };
    }
  }

  class Concat2 {
    public async exec(params: ValueMap): Promise<ValueMap> {
      return { z: (params.x || '8') + (params.y || '9') };
    }
  }

  // @todo Add test for cases where some params mapping is provided and some is automatic
  // @todo Add test for cases where some results mapping is provided and some is automatic

  const runFlow = async (automapParams?: boolean, automapResults?: boolean) => {
    return await FlowManager.run(
      {
        tasks: {
          T1: {
            requires: ['a', 'b', 'c'],
            provides: ['x'],
            resolver: {
              name: 'concat3',
              // Implicit mapping: params: { a: 'a', b: 'b', c: 'c' },
              // Implicit mapping: results: { x: 'x' },
            },
          },
          T2: {
            requires: ['x', 'y'],
            provides: ['z'],
            resolver: {
              name: 'concat2',
              // Implicit mapping: params: { x: 'x', y: 'y' },
              // Implicit mapping: results: { z: 'z' },
            },
          },
        },
        options: {
          resolverAutomapParams: automapParams,
          resolverAutomapResults: automapResults,
        },
      },
      {
        a: 'A',
        b: 'B',
        c: 'C',
        y: 'Y',
      },
      ['z'],
      {
        concat3: Concat3,
        concat2: Concat2,
      },
    );
  };

  it('guess mapping', async () => {
    // Without any automapping
    expect(await runFlow(false, false)).to.be.eql({});

    // With params only automapping
    expect(await runFlow(true, false)).to.be.eql({});

    // With results only automapping
    expect(await runFlow(false, true)).to.be.eql({ z: '89' });

    // With full automapping
    expect(await runFlow(true, true)).to.be.eql({ z: 'ABCY' });
  });
});
