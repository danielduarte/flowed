import { expect } from 'chai';
import * as Flowed from '../src/index';

describe('the module interface', () => {
  it('is preserved', async () => {

    const expectedInterface = {
      'FlowStateEnum': {
        'Ready': 'Ready',
        'Running': 'Running',
        'Finished': 'Finished',
        'Pausing': 'Pausing',
        'Paused': 'Paused',
        'Stopping': 'Stopping',
        'Stopped': 'Stopped',
      },
      'FlowTransitionEnum': {
        'Start': 'Start',
        'Finished': 'Finished',
        'Reset': 'Reset',
        'Pause': 'Pause',
        'Paused': 'Paused',
        'Resume': 'Resume',
        'Stop': 'Stop',
        'Stopped': 'Stopped',
      },
    };
    expect(JSON.parse(JSON.stringify(Flowed))).to.be.eql(expectedInterface);

    const expectedMembers = [
      'TaskResolver',     'TaskResolverMap',
      'FlowManager',      'Flow',
      'FlowStateEnum',    'FlowTransitionEnum',
      'FlowRunStatus',    'TaskSpecMap',
      'Task',             'NoopResolver',
      'ThrowError',       'ConditionalResolver',
      'WaitResolver',     'SubFlowResolver',
      'RepeaterResolver', 'FlowCompiler'
    ];
    expect(Object.keys(Flowed)).to.be.eql(expectedMembers);

    const expectedProperties = [
      'constructor',         'start',
      'pause',               'resume',
      'stop',                'reset',
      'isRunning',           'getSpec',
      'getResults',          'setState',
      'createPausePromise',  'createStopPromise',
      'createFinishPromise', 'execFinishResolve',
      'execFinishReject',    'execPauseResolve',
      'execPauseReject',     'execStopResolve',
      'execStopReject',      'setExpectedResults',
      'setResolvers',        'setContext',
      'supplyParameters',    'startReadyTasks',
      'initRunStatus',       'supplyResult',
      'parseSpec',           'taskFinished',
      'finished',            'paused',
      'stopped'
    ];
    expect(Object.getOwnPropertyNames(Flowed.Flow.prototype)).to.be.eql(expectedProperties);
  });
});
