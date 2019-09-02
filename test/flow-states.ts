import { expect } from 'chai';
import { Flow } from '../src/engine';

// @todo Add test to pause flow without tasks
// @todo Add test to stop flow without tasks

describe('a flow in state', () => {
  it('ready can only be started', async () => {
    // Prepare a flow is Ready state
    const flow = new Flow({ tasks: {} });

    // Invalid transitions
    expect(() => flow.pause()).to.throw('Cannot execute transition Pause in current state Ready.');
    expect(() => flow.resume()).to.throw('Cannot execute transition Resume in current state Ready.');
    expect(() => flow.stop()).to.throw('Cannot execute transition Stop in current state Ready.');
    expect(() => flow.reset()).to.throw('Cannot execute transition Reset in current state Ready.');

    // Valid transitions
    await flow.start();
  });

  it('finished can only be reset', async () => {
    // Prepare a flow is Finished state
    const flow = new Flow({ tasks: {} });
    await flow.start();

    // Invalid transitions
    expect(() => flow.start()).to.throw('Cannot execute transition Start in current state Finished.');
    expect(() => flow.pause()).to.throw('Cannot execute transition Pause in current state Finished.');
    expect(() => flow.resume()).to.throw('Cannot execute transition Resume in current state Finished.');
    expect(() => flow.stop()).to.throw('Cannot execute transition Stop in current state Finished.');

    // Valid transitions
    flow.reset();
  });

  // @todo Add tests for state Running
  // @todo Add tests for state Pausing
  // @todo Add tests for state Paused
  // @todo Add tests for state Stopping
  // @todo Add tests for state Stopped
});
