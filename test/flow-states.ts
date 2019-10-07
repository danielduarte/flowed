import { expect } from 'chai';
import { Flow } from '../src/engine';

// @todo Add test to pause flow without tasks
// @todo Add test to stop flow without tasks

// Created this class to test protected and private methods in Flow
class PublicFlow extends Flow {
  public finished(error: Error | boolean = false) {
    this.runStatus.state.finished(error);
  }

  public paused(error: Error | boolean = false) {
    this.runStatus.state.paused(error);
  }

  public stopped(error: Error | boolean = false) {
    this.runStatus.state.stopped(error);
  }
}

describe('a flow in state', () => {
  it('ready can only be started', async () => {
    // Prepare a flow is Ready state
    const flow = new Flow();
    const pubFlow = new PublicFlow();

    // Invalid transitions/operations
    expect(() => flow.pause()).to.throw('Cannot execute transition Pause in current state Ready.');
    expect(() => flow.resume()).to.throw('Cannot execute transition Resume in current state Ready.');
    expect(() => flow.stop()).to.throw('Cannot execute transition Stop in current state Ready.');
    expect(() => flow.reset()).to.throw('Cannot execute transition Reset in current state Ready.');
    expect(() => pubFlow.finished()).to.throw('Cannot execute transition Finished in current state Ready.');
    expect(() => pubFlow.stopped()).to.throw('Cannot execute transition Stopped in current state Ready.');
    expect(() => pubFlow.paused()).to.throw('Cannot execute transition Paused in current state Ready.');

    // Valid transitions/operations
    flow.getSerializableState();
    await flow.start();
  });

  it('finished can only be reset', async () => {
    // Prepare a flow is Finished state
    const flow = new Flow();
    await flow.start();
    const pubFlow = new PublicFlow();
    await pubFlow.start();

    // Invalid transitions/operations
    expect(() => flow.start()).to.throw('Cannot execute transition Start in current state Finished.');
    expect(() => flow.pause()).to.throw('Cannot execute transition Pause in current state Finished.');
    expect(() => flow.resume()).to.throw('Cannot execute transition Resume in current state Finished.');
    expect(() => flow.stop()).to.throw('Cannot execute transition Stop in current state Finished.');
    expect(() => pubFlow.finished()).to.throw('Cannot execute transition Finished in current state Finished.');
    expect(() => pubFlow.stopped()).to.throw('Cannot execute transition Stopped in current state Finished.');
    expect(() => pubFlow.paused()).to.throw('Cannot execute transition Paused in current state Finished.');

    // Valid transitions/operations
    flow.getSerializableState();
    flow.reset();
  });

  it('running can only be paused, or stopped', async () => {
    const initRunningFlow = () => {
      const newFlow = new Flow({
        tasks: { aTask: { resolver: { name: 'flowed::Noop' } } },
      });
      newFlow.start();
      return newFlow;
    };

    const initRunningPublicFlow = () => {
      const newFlow = new PublicFlow({
        tasks: { aTask: { resolver: { name: 'flowed::Noop' } } },
      });
      newFlow.start();

      return newFlow;
    };

    // Prepare a flow is Running state
    let flow = initRunningFlow();
    let pubFlow = initRunningPublicFlow();

    // Invalid transitions/operations
    expect(() => flow.getSerializableState()).to.throw(
      'Cannot execute method getSerializableState in current state Running.',
    );
    expect(() => flow.start()).to.throw('Cannot execute transition Start in current state Running.');
    expect(() => flow.resume()).to.throw('Cannot execute transition Resume in current state Running.');
    expect(() => flow.reset()).to.throw('Cannot execute transition Reset in current state Running.');
    expect(() => pubFlow.stopped()).to.throw('Cannot execute transition Stopped in current state Running.');
    expect(() => pubFlow.paused()).to.throw('Cannot execute transition Paused in current state Running.');

    // Valid transitions/operations
    await flow.pause();
    flow = initRunningFlow(); // Prepare a new flow in Running state
    await flow.stop();
    pubFlow = initRunningPublicFlow(); // Prepare a new flow in Running state
    pubFlow.finished();
  });

  it('pausing has no valid public transitions', async () => {
    // Prepare a flow is Pausing state
    const flow = new Flow({
      tasks: { aTask: { resolver: { name: 'flowed::Noop' } } },
    });
    flow.start();
    flow.pause();

    const pubFlow = new PublicFlow({
      tasks: { aTask: { resolver: { name: 'flowed::Noop' } } },
    });
    pubFlow.start();
    pubFlow.pause();

    // Invalid transitions/operations (all public transitions are invalid)
    expect(() => flow.getSerializableState()).to.throw(
      'Cannot execute method getSerializableState in current state Pausing.',
    );
    expect(() => flow.pause()).to.throw('Cannot execute transition Pause in current state Pausing.');
    expect(() => flow.resume()).to.throw('Cannot execute transition Resume in current state Pausing.');
    expect(() => flow.stop()).to.throw('Cannot execute transition Stop in current state Pausing.');
    expect(() => flow.reset()).to.throw('Cannot execute transition Reset in current state Pausing.');
    expect(() => flow.start()).to.throw('Cannot execute transition Start in current state Pausing.');
    expect(() => pubFlow.finished()).to.throw('Cannot execute transition Finished in current state Pausing.');
    expect(() => pubFlow.stopped()).to.throw('Cannot execute transition Stopped in current state Pausing.');

    // Valid transitions/operations
    pubFlow.paused();
  });

  it('paused can only be resumed or stopped', async () => {
    // Prepare a flow is Paused state
    const initPausedFlow = async () => {
      const newFlow = new Flow({
        tasks: { aTask: { resolver: { name: 'flowed::Noop' } } },
      });
      newFlow.start();
      await newFlow.pause();

      return newFlow;
    };

    const initPausedPublicFlow = async () => {
      const newFlow = new PublicFlow({
        tasks: { aTask: { resolver: { name: 'flowed::Noop' } } },
      });
      newFlow.start();
      await newFlow.pause();

      return newFlow;
    };

    // Prepare a flow is Running state
    let flow = await initPausedFlow();
    const pubFlow = await initPausedPublicFlow();

    // Invalid transitions/operations
    expect(() => flow.pause()).to.throw('Cannot execute transition Pause in current state Paused.');
    expect(() => flow.reset()).to.throw('Cannot execute transition Reset in current state Paused.');
    expect(() => flow.start()).to.throw('Cannot execute transition Start in current state Paused.');
    expect(() => pubFlow.finished()).to.throw('Cannot execute transition Finished in current state Paused.');
    expect(() => pubFlow.stopped()).to.throw('Cannot execute transition Stopped in current state Paused.');
    expect(() => pubFlow.paused()).to.throw('Cannot execute transition Paused in current state Paused.');

    // Valid transitions/operations
    flow.getSerializableState();
    flow.resume();
    flow = await initPausedFlow(); // Prepare a new flow in Paused state
    await flow.stop();
    // @todo Check why here the flow remain in Stopping, and not is in Stopped.
  });

  it('stopping has no valid public transitions', async () => {
    // Prepare a flow is Stopping state
    const flow = new Flow({
      tasks: { aTask: { resolver: { name: 'flowed::Noop' } } },
    });
    flow.start();
    flow.stop();

    const pubFlow = new PublicFlow({
      tasks: { aTask: { resolver: { name: 'flowed::Noop' } } },
    });
    pubFlow.start();
    pubFlow.stop();

    // Invalid transitions/operations (all public transitions are invalid)
    expect(() => flow.getSerializableState()).to.throw(
      'Cannot execute method getSerializableState in current state Stopping.',
    );
    expect(() => flow.pause()).to.throw('Cannot execute transition Pause in current state Stopping.');
    expect(() => flow.resume()).to.throw('Cannot execute transition Resume in current state Stopping.');
    expect(() => flow.stop()).to.throw('Cannot execute transition Stop in current state Stopping.');
    expect(() => flow.reset()).to.throw('Cannot execute transition Reset in current state Stopping.');
    expect(() => flow.start()).to.throw('Cannot execute transition Start in current state Stopping.');
    expect(() => pubFlow.finished()).to.throw('Cannot execute transition Finished in current state Stopping.');
    expect(() => pubFlow.paused()).to.throw('Cannot execute transition Paused in current state Stopping.');

    // Valid transitions/operations
    pubFlow.stopped();
  });

  it('stopped can only be reset', async () => {
    // Prepare a flow is Stopped state
    const flow = new Flow({
      tasks: { aTask: { resolver: { name: 'flowed::Noop' } } },
    });
    flow.start();
    await flow.stop();

    const pubFlow = new PublicFlow({
      tasks: { aTask: { resolver: { name: 'flowed::Noop' } } },
    });
    pubFlow.start();
    await pubFlow.stop();

    // Invalid transitions/operations
    expect(() => flow.pause()).to.throw('Cannot execute transition Pause in current state Stopped.');
    expect(() => flow.resume()).to.throw('Cannot execute transition Resume in current state Stopped.');
    expect(() => flow.stop()).to.throw('Cannot execute transition Stop in current state Stopped.');
    expect(() => flow.start()).to.throw('Cannot execute transition Start in current state Stopped.');
    expect(() => pubFlow.finished()).to.throw('Cannot execute transition Finished in current state Stopped.');
    expect(() => pubFlow.stopped()).to.throw('Cannot execute transition Stopped in current state Stopped.');
    expect(() => pubFlow.paused()).to.throw('Cannot execute transition Paused in current state Stopped.');

    // Valid transitions/operations
    flow.getSerializableState();
    flow.reset();
  });

  // @todo add test for finished status
  // @todo add test for stopped status
  // @todo add test for paused status
});
