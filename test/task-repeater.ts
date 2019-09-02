import { debug as rawDebug } from 'debug';
import { GenericValueMap } from '../src';
import { FlowManager } from '../src/engine';
import * as ResolverLibrary from '../src/resolver-library';
const debug = rawDebug('flowed:test');

describe('the ResolverLibrary / task repeater', () => {
  const taskSpec = {
    requires: ['a-value'],
    provides: [],
    resolver: {
      name: 'repeat-5-times',
      params: {
        someValue: 'a-value',
      },
      results: {},
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
            taskResolver: 'task-resolver',
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
    public async exec(params: GenericValueMap): Promise<GenericValueMap> {
      debug('This is a text:', params.someValue);
      return {};
    }
  }

  class DelayedLogTextSampleResolver {
    public async exec(params: GenericValueMap): Promise<GenericValueMap> {
      const rnd = 'Run ID: ' + Math.ceil(Math.random() * 1000);
      debug('Starts', rnd);

      return new Promise(resolve => {
        setTimeout(() => {
          debug('This is a delayed text:', params.someValue, rnd);
          resolve({});
        }, Math.ceil(Math.random() * 100));
      });
    }
  }

  it('runs repeater resolver with no parallel sync tasks', () => {
    return FlowManager.run(
      flowSpec,
      {
        'task-spec': taskSpec,
        'task-resolver': LogTextSampleResolver,
        'task-params': { 'a-value': 'Hi sync!' },
        count: 5,
        parallel: false,
      },
      ['result-array'],
      {
        taskRepeater: ResolverLibrary.RepeaterResolver,
      },
    );
  });

  it('runs repeater resolver with parallel sync tasks', () => {
    return FlowManager.run(
      flowSpec,
      {
        'task-spec': taskSpec,
        'task-resolver': LogTextSampleResolver,
        'task-params': { 'a-value': 'Hi sync in parallel!' },
        count: 5,
        parallel: true,
      },
      ['result-array'],
      {
        taskRepeater: ResolverLibrary.RepeaterResolver,
      },
    );
  });

  it('runs repeater resolver with no parallel async tasks', () => {
    return FlowManager.run(
      flowSpec,
      {
        'task-spec': taskSpec,
        'task-resolver': DelayedLogTextSampleResolver,
        'task-params': { 'a-value': 'Hi async!' },
        count: 5,
        parallel: false,
      },
      ['result-array'],
      {
        taskRepeater: ResolverLibrary.RepeaterResolver,
      },
    );
  });

  it('runs repeater resolver with parallel async tasks', () => {
    return FlowManager.run(
      flowSpec,
      {
        'task-spec': taskSpec,
        'task-resolver': DelayedLogTextSampleResolver,
        'task-params': { 'a-value': 'Hi async in parallel!' },
        count: 5,
        parallel: true,
      },
      ['result-array'],
      {
        taskRepeater: ResolverLibrary.RepeaterResolver,
      },
    );
  });
});
