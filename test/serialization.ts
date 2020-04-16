import { expect } from 'chai';
import rawDebug from '../src/debug';
import { Flow, ValueMap } from '../src';
import { Task } from '../src/engine';
const debug = rawDebug('test');

describe('a flow state can be', () => {
  it('serialized without error', async () => {
    // @todo Check if this test is redundant (already tested in flow-states.ts)
    const flow = new Flow();
    flow.getSerializableState();
  });

  it('serialized and recovered', async () => {
    let success: (value?: unknown) => void;
    const successPromise = new Promise(resolve => {
      success = resolve;
    });

    const testRunState = (f: Flow, msg: string) => {
      const state = f.getSerializableState();
      debug(msg, state);
      expect(state).to.be.eql(JSON.parse(JSON.stringify(state)));
    };

    const text1 = '(text1)';
    const text2 = '(text2)';
    const text3 = '(text3)';
    const text4 = '(text4)';

    const spec = {
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

    const flow = new Flow(spec);

    let pausedState;

    const pauseFlow = async () => {
      debug('-- Pausing flow --');
      const partialResult = await flow.pause();
      debug('-- Flow paused --');

      testRunState(flow, 'PAUSED RUN STATE');
      pausedState = flow.getSerializableState();

      expect(partialResult).to.deep.equal({
        result1: text1,
        result2: text1 + text2,
      });
      debug('-- Flow resumed --');
      const finishPromise = flow.resume();

      const finalResult = await finishPromise;

      testRunState(flow, 'FINAL RUN STATE');

      expect(finalResult.finalStr).to.equal(text1 + text2 + text3 + text4);
      expect(flowTasksRan).to.be.eql(['task1', 'task2', 'task3', 'task4']);

      // ------------------------------

      const flowRestored = new Flow(spec, pausedState);
      expect(flowRestored.getSerializableState()).to.be.deep.equal(pausedState);

      const pauseFlow2 = async () => {
        debug('-- Pausing flow --');
        const partialResult2 = await flowRestored.pause();
        debug('-- Flow paused --');

        testRunState(flowRestored, 'PAUSED RUN STATE');

        expect(partialResult2).to.deep.equal({
          result1: text1,
          result2: text1 + text2,
        });
        debug('-- Flow resumed --');
        flowRestored.resume();
      };

      const restoredFlowTasksRan: string[] = [];

      class AppendString2 {
        public async exec(params: ValueMap, context: ValueMap, task: Task): Promise<ValueMap> {
          debug(`Starting to execute task ${task.code}`);
          return new Promise<ValueMap>(resolve => {
            setTimeout(() => {
              if (task.code === 'task2') {
                // noinspection JSIgnoredPromiseFromCall
                pauseFlow2();
              }

              restoredFlowTasksRan.push(task.code);
              resolve({
                result: params.text1 + params.text2,
              });
            }, 10);
          });
        }
      }

      // Note that when restarting a serialized flow, params must NOT be provided.
      const finishRestoredPromise = flowRestored.start({}, ['result1', 'result2', 'result3', 'finalStr'], {
        append: AppendString2,
      });

      const finalResultRestored = await finishRestoredPromise;

      expect(finalResult.finalStr).to.equal(finalResultRestored.finalStr);

      expect(restoredFlowTasksRan).to.be.eql(['task3', 'task4']);

      success();
    };

    const flowTasksRan: string[] = [];

    class AppendString {
      public async exec(params: ValueMap, context: ValueMap, task: Task): Promise<ValueMap> {
        debug(`Starting to execute task ${task.code}`);
        return new Promise<ValueMap>(resolve => {
          setTimeout(() => {
            if (task.code === 'task2') {
              // noinspection JSIgnoredPromiseFromCall
              pauseFlow();
            }

            flowTasksRan.push(task.code);
            resolve({
              result: params.text1 + params.text2,
            });
          }, 10);
        });
      }
    }

    testRunState(flow, 'INITIAL RUN STATE');

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
});
