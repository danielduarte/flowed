import { expect } from 'chai';
import rawDebug from '../src/debug';
import { ValueMap } from '../src';
import { Flow, Task } from '../src';
const debug = rawDebug('test');

describe('the flow', () => {
  const text1 = '(text1)';
  const text2 = '(text2)';
  const text3 = '(text3)';
  const text4 = '(text4)';

  let testPromiseResolve: (value: unknown) => void;
  let testPromiseReject: (error: Error) => void;

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
    let success: (value?: unknown) => void;
    const successPromise = new Promise(resolve => {
      success = resolve;
    });

    const flow = new Flow(flowSpec);

    let finishPromise;

    const pauseFlow = async () => {
      debug('-- Pausing flow --');
      const partialResult = await flow.pause();
      debug('-- Flow paused --');
      expect(partialResult).to.deep.equal({
        result1: text1,
        result2: text1 + text2,
      });
      debug('-- Flow resumed --');
      finishPromise = flow.resume();

      const finalResult = await finishPromise;
      expect(finalResult.finalStr).to.equal(text1 + text2 + text3 + text4);

      success();
    };

    class AppendString {
      public async exec(params: ValueMap, context: ValueMap, task: Task): Promise<ValueMap> {
        debug(`Starting to execute task ${task.code}`);
        return new Promise<ValueMap>(resolve => {
          setTimeout(() => {
            if (task.code === 'task2') {
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

    return successPromise;
  });

  it('can be paused with error', async () => {
    const flow = new Flow(flowSpec);

    const testPromise = new Promise((resolve, reject) => {
      testPromiseResolve = resolve;
      testPromiseReject = reject;
    });

    class AppendString {
      public async exec(): Promise<ValueMap> {
        return new Promise<ValueMap>(() => {
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
