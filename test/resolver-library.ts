import { expect } from 'chai';
import { GenericValueMap } from '../src';
import { FlowManager } from '../src/engine';
import * as ResolverLibrary from '../src/resolver-library';

describe('the ResolverLibrary', () => {
  it('runs noop resolver', () => {
    return FlowManager.run(
      {
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
        noop: ResolverLibrary.NoopResolver,
      },
    );
  });

  it('runs wait resolver', () => {
    return FlowManager.run(
      {
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
        wait: ResolverLibrary.WaitResolver,
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

    const subFlowResolvers = {
      noop: ResolverLibrary.NoopResolver,
    };

    return FlowManager.run(
      {
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
        'subflow-resolvers': subFlowResolvers,
      },
      ['subflow-result'],
      {
        subflow: ResolverLibrary.SubFlowResolver,
      },
    );
  });

  it('runs conditional resolver', async () => {
    class TrueTask {
      public async exec(params: GenericValueMap): Promise<GenericValueMap> {
        return { msg: `This is the TRUE branch: ${params.text}` };
      }
    }

    class FalseTask {
      public async exec(params: GenericValueMap): Promise<GenericValueMap> {
        return { msg: `This is the FALSE branch: ${params.text}` };
      }
    }

    const runFlow = async (testCondition: boolean) => {
      return await FlowManager.run(
        {
          tasks: {
            if: {
              requires: ['condition', 'true-text', 'false-text'],
              provides: ['on-true', 'on-false'],
              resolver: {
                name: 'if',
                params: { condition: 'condition', trueResult: 'true-text', falseResult: 'false-text' },
                results: { onTrue: 'on-true', onFalse: 'on-false' },
              },
            },
            trueTask: {
              requires: ['on-true'],
              provides: ['true-msg'],
              resolver: {
                name: 'true',
                params: { text: 'on-true' },
                results: { msg: 'true-msg' },
              },
            },
            falseTask: {
              requires: ['on-false'],
              provides: ['false-msg'],
              resolver: {
                name: 'false',
                params: { text: 'on-false' },
                results: { msg: 'false-msg' },
              },
            },
          },
        },
        {
          condition: testCondition,
          'true-text': '(YES)',
          'false-text': '(NO)',
        },
        ['on-true', 'on-false', 'true-msg', 'false-msg'],
        {
          if: ResolverLibrary.ConditionalResolver,
          true: TrueTask,
          false: FalseTask,
        },
      );
    };

    const resultTrue = await runFlow(true);
    expect(resultTrue).to.be.eql({
      'on-true': '(YES)',
      'true-msg': 'This is the TRUE branch: (YES)',
    });

    const resultFalse = await runFlow(false);
    expect(resultFalse).to.be.eql({
      'on-false': '(NO)',
      'false-msg': 'This is the FALSE branch: (NO)',
    });
  });

  it('runs conditional resolver with the same result name', async () => {
    class TrueTask {
      public async exec(params: GenericValueMap): Promise<GenericValueMap> {
        return { msg: `This is the TRUE branch: ${params.text}` };
      }
    }

    class FalseTask {
      public async exec(params: GenericValueMap): Promise<GenericValueMap> {
        return { msg: `This is the FALSE branch: ${params.text}` };
      }
    }

    const runFlow = async (testCondition: boolean) => {
      return await FlowManager.run(
        {
          tasks: {
            if: {
              requires: ['condition', 'true-text', 'false-text'],
              provides: ['on-true', 'on-false'],
              resolver: {
                name: 'if',
                params: { condition: 'condition', trueResult: 'true-text', falseResult: 'false-text' },
                results: { onTrue: 'on-true', onFalse: 'on-false' },
              },
            },
            trueTask: {
              requires: ['on-true'],
              provides: ['msg'],
              resolver: {
                name: 'true',
                params: { text: 'on-true' },
                results: { msg: 'msg' },
              },
            },
            falseTask: {
              requires: ['on-false'],
              provides: ['msg'],
              resolver: {
                name: 'false',
                params: { text: 'on-false' },
                results: { msg: 'msg' },
              },
            },
          },
        },
        {
          condition: testCondition,
          'true-text': '(YES)',
          'false-text': '(NO)',
        },
        ['msg'],
        {
          if: ResolverLibrary.ConditionalResolver,
          true: TrueTask,
          false: FalseTask,
        },
      );
    };

    const resultTrue = await runFlow(true);
    expect(resultTrue).to.be.eql({
      msg: 'This is the TRUE branch: (YES)',
    });

    const resultFalse = await runFlow(false);
    expect(resultFalse).to.be.eql({
      msg: 'This is the FALSE branch: (NO)',
    });
  });

  it('runs conditional resolver with missing conditional results', async () => {
    class TrueTask {
      public async exec(params: GenericValueMap): Promise<GenericValueMap> {
        return { msg: `This is the TRUE branch: ${params.text}` };
      }
    }

    class FalseTask {
      public async exec(params: GenericValueMap): Promise<GenericValueMap> {
        return { msg: `This is the FALSE branch: ${params.text}` };
      }
    }

    const runFlow = async (testCondition: boolean) => {
      return await FlowManager.run(
        {
          tasks: {
            if: {
              requires: ['condition'],
              provides: ['on-true', 'on-false'],
              resolver: {
                name: 'if',
                params: { condition: 'condition', trueResult: 'true-text', falseResult: 'false-text' },
                results: { onTrue: 'on-true', onFalse: 'on-false' },
              },
            },
            trueTask: {
              requires: ['on-true'],
              provides: ['msg'],
              resolver: {
                name: 'true',
                params: { text: 'on-true' },
                results: { msg: 'msg' },
              },
            },
            falseTask: {
              requires: ['on-false'],
              provides: ['msg'],
              resolver: {
                name: 'false',
                params: { text: 'on-false' },
                results: { msg: 'msg' },
              },
            },
          },
        },
        {
          condition: testCondition,
        },
        ['msg'],
        {
          if: ResolverLibrary.ConditionalResolver,
          true: TrueTask,
          false: FalseTask,
        },
      );
    };

    const resultTrue = await runFlow(true);
    expect(resultTrue).to.be.eql({
      msg: 'This is the TRUE branch: undefined',
    });

    const resultFalse = await runFlow(false);
    expect(resultFalse).to.be.eql({
      msg: 'This is the FALSE branch: undefined',
    });
  });
});

// @todo add test to check error thrown on non resolver set in flow spec (check src/engine/flow.ts method startReadyTasks around line 190)
