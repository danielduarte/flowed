import { expect } from 'chai';
import * as Flowed from '../src/index';

describe('the module interface', () => {
  it('is preserved', async () => {
    // @todo Add static methods to test (e.g. for FlowManager)
    const expectedInterface = {
      // Enums
      FlowStateEnum: {
        Ready: 'Ready',
        Running: 'Running',
        Finished: 'Finished',
        Pausing: 'Pausing',
        Paused: 'Paused',
        Stopping: 'Stopping',
        Stopped: 'Stopped',
      },
      FlowTransitionEnum: {
        Start: 'Start',
        Finished: 'Finished',
        Reset: 'Reset',
        Pause: 'Pause',
        Paused: 'Paused',
        Resume: 'Resume',
        Stop: 'Stop',
        Stopped: 'Stopped',
      },

      // Classes & types
      Flow: ['constructor', 'debug', 'getSerializableState', 'getStateCode', 'pause', 'reset', 'resume', 'start', 'stop'],
      FlowManager: ['constructor'],
      Task: [
        'constructor',
        'getResolverName',
        'getResults',
        'getSerializableState',
        'isReadyToRun',
        'mapParamsForResolver',
        'mapResultsFromResolver',
        'parseSpec',
        'resetRunStatus',
        'setSerializableState',
        'supplyReq',
        'supplyReqs',
      ],
      TaskResolver: ['constructor', 'exec'],
      TaskResolverMap: ['constructor'],
      TaskSpecMap: ['constructor'],

      // Concrete resolvers
      ArrayMapResolver: ['constructor', 'exec'],
      ConditionalResolver: ['constructor', 'exec'],
      EchoResolver: ['constructor', 'exec'],
      NoopResolver: ['constructor', 'exec'],
      PauseResolver: ['constructor', 'exec'],
      RepeaterResolver: ['constructor', 'exec'],
      StopResolver: ['constructor', 'exec'],
      SubFlowResolver: ['constructor', 'exec'],
      ThrowErrorResolver: ['constructor', 'exec'],
      WaitResolver: ['constructor', 'exec'],
    };

    expect(
      JSON.parse(
        JSON.stringify(Flowed, (key, value) => {
          if (typeof value === 'function') {
            return Object.getOwnPropertyNames(value.prototype).sort();
          }
          return value;
        }),
      ),
    ).to.be.eql(expectedInterface);
  });
});
