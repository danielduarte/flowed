import { expect } from 'chai';
import { GenericValueMap } from '../src';
import { FlowManager } from '../src/engine';

describe('the ResolverLibrary', () => {
  it('runs noop resolver without mapping', () => {
    return FlowManager.run({
      tasks: {
        doNothing: {
          resolver: {
            name: 'flowed::Noop',
          },
        },
      },
    });
  });

  it('runs wait resolver without mapping', async () => {
    const result = await FlowManager.run(
      {
        tasks: {
          waitASec: {
            requires: ['time', 'providedResultAfterTimeout'],
            provides: ['timeoutResult'],
            resolver: {
              name: 'flowed::Wait',
              params: { ms: 'time', result: 'providedResultAfterTimeout' },
              results: { result: 'timeoutResult' },
            },
          },
        },
      },
      {
        time: 100,
        providedResultAfterTimeout: 'I am the correct result',
      },
      ['timeoutResult'],
    );

    expect(result.timeoutResult).to.be.eql('I am the correct result');
  });

  it('runs sub-flow resolver without mapping', () => {
    const subFlowSpec = {
      tasks: {
        dummyTask: {
          resolver: { name: 'flowed::Noop' },
        },
      },
    };

    return FlowManager.run(
      {
        tasks: {
          runSubflow: {
            requires: ['subflow-spec', 'subflow-params', 'subflow-expected-results', 'subflow-resolvers'],
            provides: ['subflow-result'],
            resolver: {
              name: 'flowed::SubFlow',
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
        'subflow-resolvers': {},
      },
      ['subflow-result'],
    );
  });

  it('runs conditional resolver without mapping', async () => {
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
                name: 'flowed::Conditional',
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

  it('runs error resolver without mapping', async () => {
    let msg = 'No error';

    try {
      await FlowManager.run({
        tasks: {
          throwAnError: {
            resolver: {
              name: 'flowed::ThrowError',
            },
          },
        },
      });
    } catch (error) {
      msg = error.message;
    }

    expect(msg).to.be.eql('ThrowErrorResolver resolver has thrown an error');
  });
});
