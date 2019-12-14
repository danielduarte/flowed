import { GenericValueMap } from '../src';
import { FlowManager } from '../src/engine';

describe('when expected results are not provided', () => {
  it('the user is notified', async () => {

    class TwoValues {
      public async exec(): Promise<GenericValueMap> {
        return {
          X: 'value X',
          Z: 'value Z',
        };
      }
    }

    const result = await FlowManager.run(
      {
        tasks: {
          T: {
            requires: [],
            provides: ['X', 'Z'],
            resolver: {
              name: 'noop',
              params: {},
              results: {
                X: 'X',
                Z: 'Z',
              },
            },
          },
        },
      },
      {
      },
      ['X', 'Y', 'Z'],
      {
        noop: TwoValues,
      },
    );

   // console.log(result);

  });
});

// @todo ver esto: error dinamico: cuando un resolver no proveyó lo que se esperaba
//
// related issue: https://github.com/daniel-duarte/flowed/issues/2