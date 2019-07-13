import { expect } from 'chai';
import { FlowManager } from '../src/engine/flow-manager';
import * as ResolverLibrary from '../src/resolver-library';


describe('ResolverLibrary', () => {

  it('noop resolver', () => {

    return FlowManager.run({
        tasks: {
          doNothing: {
            requires: [],
            provides: [],
            resolver: {
              name: 'noop',
              params: {},
              results: {},
            }
          }
        },
      },
      {},
      [],
      {
        noop: ResolverLibrary.NoopResolver
      }
    );

  });

  it('wait resolver', () => {

    return FlowManager.run({
        tasks: {
          waitASec: {
            requires: ['time'],
            provides: [],
            resolver: {
              name: 'wait',
              params: { ms: 'time' },
              results: {},
            }
          }
        },
      },
      {
        time: 1000,
      },
      [],
      {
        wait: ResolverLibrary.WaitResolver
      }
    );

  });

  it('sub-flow resolver', () => {

    const subFlowSpec = {
      tasks: {
        dummyTask: {
          requires: [],
          provides: [],
          resolver: { name: 'noop', params: {}, results: {} }
        }
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
            }
          }
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
      }
    );

  });

});
