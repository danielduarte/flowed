import { expect } from 'chai';
import rawDebug from '../src/debug';
import { ValueMap } from '../src';
import { FlowManager } from '../src/engine';
import * as ResolverLibrary from '../src/resolver-library';
const debug = rawDebug('test');

describe('the ResolverLibrary / task repeater', () => {
  const taskSpec = {
    requires: ['a-value'],
    resolver: {
      name: 'repeat-5-times',
      params: {
        someValue: 'a-value',
      },
    },
  };

  const flowSpec = {
    tasks: {
      repeatTask: {
        requires: ['task-spec', 'task-resolver', 'task-params', 'count', 'parallel'],
        provides: ['result-array'],
        resolver: {
          name: 'taskRepeater',
          params: {
            taskSpec: 'task-spec',
            resolver: 'task-resolver',
            taskParams: 'task-params',
            count: 'count',
            parallel: 'parallel',
          },
          results: {
            flowResult: 'subflow-result',
          },
        },
      },
    },
  };

  class LogTextSampleResolver {
    public async exec(params: ValueMap): Promise<ValueMap> {
      debug('This is a text:', params.someValue);
      return {};
    }
  }

  class DelayedLogTextSampleResolver {
    public async exec(params: ValueMap): Promise<ValueMap> {
      const rnd = 'Run ID: ' + Math.ceil(Math.random() * 1000);
      debug('Starts', rnd);

      return new Promise(resolve => {
        setTimeout(() => {
          debug('This is a delayed text:', params.someValue, rnd);
          resolve({});
        }, Math.ceil(Math.random() * 20));
      });
    }
  }

  class LogTextSampleResolverError {
    public async exec(params: ValueMap): Promise<ValueMap> {
      throw new Error('Intentional error in resolver');
    }
  }

  class DelayedLogTextSampleResolverError {
    public async exec(params: ValueMap): Promise<ValueMap> {
      return new Promise((resolve, reject) => {
        throw new Error('Intentional error in resolver');
      });
    }
  }

  it('runs repeater resolver with no parallel sync tasks', () => {
    return FlowManager.run(
      flowSpec,
      {
        'task-spec': taskSpec,
        'task-resolver': 'LogTextSample',
        'task-params': { 'a-value': 'Hi sync!' },
        count: 5,
        parallel: false,
      },
      ['result-array'],
      {
        taskRepeater: ResolverLibrary.RepeaterResolver,
        LogTextSample: LogTextSampleResolver,
      },
    );
  });

  it('runs repeater resolver with parallel sync tasks', () => {
    return FlowManager.run(
      flowSpec,
      {
        'task-spec': taskSpec,
        'task-resolver': 'LogTextSample',
        'task-params': { 'a-value': 'Hi sync in parallel!' },
        count: 5,
        parallel: true,
      },
      ['result-array'],
      {
        taskRepeater: ResolverLibrary.RepeaterResolver,
        LogTextSample: LogTextSampleResolver,
      },
    );
  });

  it('runs repeater resolver with no parallel async tasks', () => {
    return FlowManager.run(
      flowSpec,
      {
        'task-spec': taskSpec,
        'task-resolver': 'DelayedLogTextSample',
        'task-params': { 'a-value': 'Hi async!' },
        count: 5,
        parallel: false,
      },
      ['result-array'],
      {
        taskRepeater: ResolverLibrary.RepeaterResolver,
        DelayedLogTextSample: DelayedLogTextSampleResolver,
      },
    );
  });

  it('runs repeater resolver with parallel async tasks', () => {
    return FlowManager.run(
      flowSpec,
      {
        'task-spec': taskSpec,
        'task-resolver': 'DelayedLogTextSample',
        'task-params': { 'a-value': 'Hi async in parallel!' },
        count: 5,
        parallel: true,
      },
      ['result-array'],
      {
        taskRepeater: ResolverLibrary.RepeaterResolver,
        DelayedLogTextSample: DelayedLogTextSampleResolver,
      },
    );
  });

  it('runs repeater resolver with no parallel sync tasks throwing error', async () => {
    let msg = 'No error';

    try {
      await FlowManager.run(
        flowSpec,
        {
          'task-spec': taskSpec,
          'task-resolver': 'LogTextSampleError',
          'task-params': { 'a-value': 'Hi sync!' },
          count: 5,
          parallel: false,
        },
        ['result-array'],
        {
          taskRepeater: ResolverLibrary.RepeaterResolver,
          LogTextSampleError: LogTextSampleResolverError,
        },
      );
    } catch (error) {
      msg = error.message;
    }

    expect(msg).to.be.eql('Intentional error in resolver');
  });

  it('runs repeater resolver with no parallel async tasks throwing error', async () => {
    let msg = 'No error';

    try {
      await FlowManager.run(
        flowSpec,
        {
          'task-spec': taskSpec,
          'task-resolver': 'DelayedLogTextSampleError',
          'task-params': { 'a-value': 'Hi sync!' },
          count: 5,
          parallel: true,
        },
        ['result-array'],
        {
          taskRepeater: ResolverLibrary.RepeaterResolver,
          DelayedLogTextSampleError: DelayedLogTextSampleResolverError,
        },
      );
    } catch (error) {
      msg = error.message;
    }

    expect(msg).to.be.eql('Intentional error in resolver');
  });

  it('runs repeater resolver with missing inner resolver', async () => {
    let msg = 'No error';

    try {
      await FlowManager.run(
        flowSpec,
        {
          'task-spec': taskSpec,
          'task-resolver': 'MissingResolver',
          'task-params': { 'a-value': 'Hi sync!' },
          count: 5,
          parallel: true,
        },
        ['result-array'],
        {
          taskRepeater: ResolverLibrary.RepeaterResolver,
        },
      );
    } catch (error) {
      msg = error.message;
    }

    expect(msg).to.be.eql("Task resolver 'MissingResolver' for inner flowed::Repeater task has no definition.");
  });
});
