import { expect } from 'chai';
import { debug as rawDebug } from 'debug';
import { GenericValueMap } from '../src';
import { Flow, Task } from '../src/engine';
const debug = rawDebug('flowed:test');

// @todo run tests with branch coverage
// @todo Set coverage threshold for failure
// @todo Set coverage decrease threshold for failure

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

  it('can be paused and resumed', async () => {
    const flow = new Flow(flowSpec);

    const pauseFlow = async () => {
      const partialResult = await flow.pause();
      expect(partialResult).to.deep.equal({
        result1: text1,
        result2: text1 + text2,
      });
      flow.resume();
    };

    class AppendString {
      public async exec(params: GenericValueMap, context: GenericValueMap, task: Task): Promise<GenericValueMap> {
        debug(`Starting to execute task ${task.getCode()}`);
        return new Promise<GenericValueMap>(resolve => {
          setTimeout(() => {
            if (task.getCode() === 'task2') {
              // noinspection JSIgnoredPromiseFromCall
              pauseFlow();
            }

            resolve({
              result: params.text1 + params.text2,
            });
          }, 10);
        });
      }
    }

    const finishPromise = flow.start(
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

    const finalResult = await finishPromise;
    expect(finalResult.finalStr).to.equal(text1 + text2 + text3 + text4);
  });

  it('can be paused with error', async () => {
    const flow = new Flow(flowSpec);

    const testPromise = new Promise((resolve, reject) => {
      testPromiseResolve = resolve;
      testPromiseReject = reject;
    });

    class AppendString {
      public async exec(params: GenericValueMap, context: GenericValueMap, task: Task): Promise<GenericValueMap> {
        return new Promise<GenericValueMap>((resolve, reject) => {
          flow
            .pause()
            .then(() => testPromiseReject(new Error('Expected pause to fail'))) // Important: The test promise is rejected if the pause succeeds (pause is expected to fail)
            .catch(testPromiseResolve); // Important: The test promise is resolved if the pause fails (pause is expected to fail)

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
