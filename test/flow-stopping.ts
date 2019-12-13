import { expect } from 'chai';
import { GenericValueMap } from '../src';
import { Flow, Task } from '../src/engine';

describe('the flow', () => {
  const text1 = '(text1)';
  const text2 = '(text2)';
  const text3 = '(text3)';
  const text4 = '(text4)';

  let testPromiseResolve: () => void;
  let testPromiseReject: (error: any) => void;

  const flowSpec = {
    tasks: {
      task1: {
        requires: ['initialStr', 'text1'],
        provides: ['result1'],
        resolver: {
          name: 'append',
          params: { text1: 'initialStr', text2: 'text1' },
          results: { result: 'result1' },
        },
      },
      task2: {
        requires: ['result1', 'text2'],
        provides: ['result2'],
        resolver: {
          name: 'append',
          params: { text1: 'result1', text2: 'text2' },
          results: { result: 'result2' },
        },
      },
      task3: {
        requires: ['result2', 'text3'],
        provides: ['result3'],
        resolver: {
          name: 'append',
          params: { text1: 'result2', text2: 'text3' },
          results: { result: 'result3' },
        },
      },
      task4: {
        requires: ['result3', 'text4'],
        provides: ['finalStr'],
        resolver: {
          name: 'append',
          params: { text1: 'result3', text2: 'text4' },
          results: { result: 'finalStr' },
        },
      },
    },
  };

  it('can be stopped', async () => {
    const flow = new Flow(flowSpec);

    const testPromise = new Promise((resolve, reject) => {
      testPromiseResolve = resolve;
      testPromiseReject = reject;
    });

    class AppendString {
      public async exec(params: GenericValueMap, context: GenericValueMap, task: Task): Promise<GenericValueMap> {
        return new Promise<GenericValueMap>((resolve, reject) => {
          setTimeout(() => {
            if (task.code === 'task2' && !stoppedOnce) {
              stoppedOnce = true;
              // noinspection JSIgnoredPromiseFromCall
              stopFlow();
            }

            resolve({
              result: params.text1 + params.text2,
            });
          }, 100);
        });
      }
    }

    const runParams = {
      initialStr: '',
      text1,
      text2,
      text3,
      text4,
    };

    const expectedResults = ['result1', 'result2', 'result3', 'finalStr'];

    const resolvers = {
      append: AppendString,
    };

    let stoppedOnce = false;

    const stopFlow = async () => {
      await flow
        .stop()
        .then(partialResult => {
          // If this assertion is not satisfied, the .catch() branch is executed
          expect(partialResult).to.deep.equal({
            result1: text1,
            result2: text1 + text2,
          });

          testPromiseResolve();
          return partialResult;
        })
        .catch(() => {
          testPromiseReject(new Error('Error when trying to stop the flow'));
        });

      flow.reset();

      const finalResult = await flow.start(runParams, expectedResults, resolvers);
      expect(finalResult.finalStr).to.equal(text1 + text2 + text3 + text4);
    };

    // noinspection JSIgnoredPromiseFromCall
    flow.start(runParams, expectedResults, resolvers);

    return testPromise;
  });

  it('can be stopped with error', async () => {
    const flow = new Flow(flowSpec);

    const testPromise = new Promise((resolve, reject) => {
      testPromiseResolve = resolve;
      testPromiseReject = reject;
    });

    class AppendString {
      public async exec(params: GenericValueMap, context: GenericValueMap, task: Task): Promise<GenericValueMap> {
        return new Promise<GenericValueMap>((resolve, reject) => {
          flow
            .stop()
            .then(() => testPromiseReject(new Error('Expected stop to fail'))) // Important: The test promise is rejected if the stop succeeds (stop is expected to fail)
            .catch(testPromiseResolve); // Important: The test promise is resolved if the stop fails (stop is expected to fail)

          throw new Error('Intentional error during stopping process');
        });
      }
    }

    // noinspection JSIgnoredPromiseFromCall
    flow.start(
      {
        initialStr: '',
        text1,
        text2,
        text3,
        text4,
      },
      ['result1', 'result2', 'result3', 'finalStr'],
      {
        append: AppendString,
      },
    );

    return testPromise;
  });
});
