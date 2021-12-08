import { FlowManager } from '../src';
import { FlowState } from '../src/engine/flow-state';
import { expect } from 'chai';

describe('loggers', () => {
  it('can install a logger', async () => {
    const myLogger = {
      log: () => {},
    };

    FlowManager.installLogger(myLogger);
  });

  it('cannot create a log entry with an invalid level', async () => {
    let errorMsg = 'No error';
    try {
      FlowState.createLogEntry({ m: '', l: 'weird level' });
    } catch (err) {
      errorMsg = (err as Error).message;
    }
    expect(errorMsg).to.be.eql('Not supported error level: "weird level"');
  });
});
