import { expect } from 'chai';
import { debug as rawDebug } from 'debug';
import { FlowManager, GenericValueMap } from '../src';
const debug = rawDebug('flowed:test');

class AlwaysErrorThrown {
  public async exec(): Promise<GenericValueMap> {
    throw new Error('This is an error in a task (using throw)');
  }
}

class AlwaysRejectPromise {
  public async exec(): Promise<GenericValueMap> {
    return Promise.reject(new Error('This is an error in a task (using Promise.reject)'));
  }
}

describe('error thrown in tasks', () => {
  it('are handled properly throwing error', async () => {
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
        throwError: AlwaysErrorThrown,
      },
    ).catch(error => {
      errorMsg = error.message;
      debug(errorMsg);
    });

    expect(errorMsg).to.be.eql('This is an error in a task (using throw)');
  });

  it('are handled properly throwing error', async () => {
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
        throwError: AlwaysRejectPromise,
      },
    ).catch(error => {
      errorMsg = error.message;
      debug(errorMsg);
    });

    expect(errorMsg).to.be.eql('This is an error in a task (using Promise.reject)');
  });
});
