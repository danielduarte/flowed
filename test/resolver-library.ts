import { FlowManager } from '../src/engine/flow-manager';
import * as ResolverLibrary from '../src/resolver-library';
import { GenericValueMap } from '../src/engine/flow';


describe('the ResolverLibrary', () => {

  it('runs noop resolver', () => {

    return FlowManager.run({
        tasks: {
          doNothing: {
            requires: [],
            provides: [],
            resolver: {
              name: 'noop',
              params: {},
              results: {},
            },
          },
        },
      },
      {},
      [],
      {
        noop: ResolverLibrary.NoopResolver
      },
    );

  });

  it('runs wait resolver', () => {

    return FlowManager.run({
        tasks: {
          waitASec: {
            requires: ['time'],
            provides: [],
            resolver: {
              name: 'wait',
              params: { ms: 'time' },
              results: {},
            },
          },
        },
      },
      {
        time: 1000,
      },
      [],
      {
        wait: ResolverLibrary.WaitResolver
      },
    );

  });

  it('runs sub-flow resolver', () => {

    const subFlowSpec = {
      tasks: {
        dummyTask: {
          requires: [],
          provides: [],
          resolver: { name: 'noop', params: {}, results: {} },
        },
      },
    };

    const subFlowResulvers = {
      noop: ResolverLibrary.NoopResolver
    };

    return FlowManager.run({
        tasks: {
          runSubflow: {
            requires: ['subflow-spec', 'subflow-params', 'subflow-expected-results', 'subflow-resolvers'],
            provides: ['subflow-result'],
            resolver: {
              name: 'subflow',
              params: {
                flowSpec: 'subflow-spec',
                flowParams: 'subflow-params',
                flowExpectedResults: 'subflow-expected-results',
                flowResolvers: 'subflow-resolvers',
              },
              results: {
                flowResult: 'subflow-result',
              },
            },
          },
        },
      },
      {
        'subflow-spec': subFlowSpec,
        'subflow-params': {},
        'subflow-expected-results': [],
        'subflow-resolvers': subFlowResulvers,
      },
      ['subflow-result'],
      {
        subflow: ResolverLibrary.SubFlowResolver
      },
    );

  });

  it('runs repeater resolver', () => {

    const taskSpec = {
        requires: ['a-value'],
        provides: [],
        resolver: {
          name: 'repeat-5-times',
          params: {
            someValue: 'a-value',
          },
          results: {}
        }
    };

    // Do nothing and finish
    class LogTextSampleResolver {
      public async exec(params: GenericValueMap): Promise<GenericValueMap> {
        console.log('This is a text:', params.someValue);
        return {};
      }
    }

    return FlowManager.run({
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
      },
      {
        'task-spec': taskSpec,
        'task-resolver': LogTextSampleResolver,
        'task-params': { 'a-value': 'Hi!' },
        'count': 5,
        'parallel': false, // @todo add test for parallel and serial tasks with async resolvers
      },
      ['result-array'],
      {
        taskRepeater: ResolverLibrary.RepeaterResolver
      }
    );

  });
});
