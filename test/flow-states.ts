import { expect } from 'chai';
import { NoopResolver } from '../src';
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

  it('running can only be paused, or stopped', async () => {
    const initRunningFlow = () => {
      const newFlow = new Flow({
        tasks: { aTask: { provides: [], requires: [], resolver: { name: 'r', params: {}, results: {} } } },
      });
      newFlow.start({}, [], { r: NoopResolver });
      return newFlow;
    };

    // Prepare a flow is Running state
    let flow = initRunningFlow();

    // Invalid transitions
    expect(() => flow.start()).to.throw('Cannot execute transition Start in current state Running.');
    expect(() => flow.resume()).to.throw('Cannot execute transition Resume in current state Running.');
    expect(() => flow.reset()).to.throw('Cannot execute transition Reset in current state Running.');

    // Valid transitions
    await flow.pause();
    flow = initRunningFlow(); // Prepare a new flow in Running state
    await flow.stop();
  });

  it('pausing has no valid public transitions', async () => {
    // Prepare a flow is Pausing state
    const flow = new Flow({
      tasks: { aTask: { provides: [], requires: [], resolver: { name: 'r', params: {}, results: {} } } },
    });
    flow.start({}, [], { r: NoopResolver });
    flow.pause();

    // Invalid transitions (all public transitions are invalid)
    expect(() => flow.pause()).to.throw('Cannot execute transition Pause in current state Pausing.');
    expect(() => flow.resume()).to.throw('Cannot execute transition Resume in current state Pausing.');
    expect(() => flow.stop()).to.throw('Cannot execute transition Stop in current state Pausing.');
    expect(() => flow.reset()).to.throw('Cannot execute transition Reset in current state Pausing.');
    expect(() => flow.start()).to.throw('Cannot execute transition Start in current state Pausing.');
  });

  it('paused can only be resumed or stopped', async () => {
    // Prepare a flow is Paused state
    const initPausedFlow = async () => {
      const newFlow = new Flow({
        tasks: { aTask: { provides: [], requires: [], resolver: { name: 'r', params: {}, results: {} } } },
      });
      newFlow.start({}, [], { r: NoopResolver });
      await newFlow.pause();

      return newFlow;
    };

    // Prepare a flow is Running state
    let flow = await initPausedFlow();

    // Invalid transitions
    expect(() => flow.pause()).to.throw('Cannot execute transition Pause in current state Paused.');
    expect(() => flow.reset()).to.throw('Cannot execute transition Reset in current state Paused.');
    expect(() => flow.start()).to.throw('Cannot execute transition Start in current state Paused.');

    // Valid transitions
    flow.resume();
    flow = await initPausedFlow(); // Prepare a new flow in Paused state
    await flow.stop();
    // @todo Check why here the flow remain in Stopping, and not is in Stopped.
  });

  it('stopping has no valid public transitions', async () => {
    // Prepare a flow is Stopping state
    const flow = new Flow({
      tasks: { aTask: { provides: [], requires: [], resolver: { name: 'r', params: {}, results: {} } } },
    });
    flow.start({}, [], { r: NoopResolver });
    flow.stop();

    // Invalid transitions (all public transitions are invalid)
    expect(() => flow.pause()).to.throw('Cannot execute transition Pause in current state Stopping.');
    expect(() => flow.resume()).to.throw('Cannot execute transition Resume in current state Stopping.');
    expect(() => flow.stop()).to.throw('Cannot execute transition Stop in current state Stopping.');
    expect(() => flow.reset()).to.throw('Cannot execute transition Reset in current state Stopping.');
    expect(() => flow.start()).to.throw('Cannot execute transition Start in current state Stopping.');
  });

  it('stopped can only be reset', async () => {
    // Prepare a flow is Stopped state
    const flow = new Flow({
      tasks: { aTask: { provides: [], requires: [], resolver: { name: 'r', params: {}, results: {} } } },
    });
    flow.start({}, [], { r: NoopResolver });
    await flow.stop();

    // Invalid transitions
    expect(() => flow.pause()).to.throw('Cannot execute transition Pause in current state Stopped.');
    expect(() => flow.resume()).to.throw('Cannot execute transition Resume in current state Stopped.');
    expect(() => flow.stop()).to.throw('Cannot execute transition Stop in current state Stopped.');
    expect(() => flow.start()).to.throw('Cannot execute transition Start in current state Stopped.');

    // Valid transitions
    flow.reset();
  });
});
