import { expect } from 'chai';
import { debug as rawDebug } from 'debug';
import { FlowManager, GenericValueMap } from '../src';
const debug = rawDebug('flowed:test');

describe('error thrown in tasks', () => {
  it('are handled properly', async () => {
    class AlwaysError {
      public async exec(): Promise<GenericValueMap> {
        // @todo add similar test with rejected promise
        throw new Error('This is an error in a task');
      }
    }

    let errorMsg;

    await FlowManager.run(
      {
        tasks: {
          T: {
            requires: [],
            provides: [],
            resolver: {
              name: 'throwError',
              params: {},
              results: {},
            },
          },
        },
      },
      {},
      [],
      {
        throwError: AlwaysError,
      },
    ).catch(error => {
      errorMsg = error.message;
      debug(errorMsg);
    });

    expect(errorMsg).to.be.eql('This is an error in a task');
  });
});
