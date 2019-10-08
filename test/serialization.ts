import { expect } from 'chai';
import { debug as rawDebug } from 'debug';
import { Flow, GenericValueMap } from '../src';
import { Task } from '../src/engine';
const debug = rawDebug('flowed:test');

describe('a flow state can be', () => {
  it('serialized without error', async () => {
    // @todo Check if this test is redundant (already tested in flow-states.ts)
    const flow = new Flow();
    flow.getSerializableState();
  });

  it('serialized and recovered', async () => {
    const testRunState = (f: Flow, msg: string) => {
      const state = f.getSerializableState();
      debug(msg, state);
      // @todo Fix this test
      // expect(state).to.be.eql(JSON.parse(JSON.stringify(state)));
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
      flow.resume();
    };

    const flowTasksRan: string[] = [];

    class AppendString {
      public async exec(params: GenericValueMap, context: GenericValueMap, task: Task): Promise<GenericValueMap> {
        debug(`Starting to execute task ${task.getCode()}`);
        return new Promise<GenericValueMap>(resolve => {
          setTimeout(() => {
            if (task.getCode() === 'task2') {
              // noinspection JSIgnoredPromiseFromCall
              pauseFlow();
            }

            flowTasksRan.push(task.getCode());
            resolve({
              result: params.text1 + params.text2,
            });
          }, 100);
        });
      }
    }

    testRunState(flow, 'INITIAL RUN STATE');

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

    testRunState(flow, 'FINAL RUN STATE');

    expect(finalResult.finalStr).to.equal(text1 + text2 + text3 + text4);
    expect(flowTasksRan).to.be.eql(['task1', 'task2', 'task3', 'task4']);

    // ------------------------------

    const flowRestored = new Flow(spec, pausedState);

    const pauseFlow2 = async () => {
      debug('-- Pausing flow --');
      const partialResult = await flowRestored.pause();
      debug('-- Flow paused --');

      testRunState(flowRestored, 'PAUSED RUN STATE');

      expect(partialResult).to.deep.equal({
        result1: text1,
        result2: text1 + text2,
      });
      debug('-- Flow resumed --');
      flowRestored.resume();
    };

    const restoredFlowTasksRan: string[] = [];

    class AppendString2 {
      public async exec(params: GenericValueMap, context: GenericValueMap, task: Task): Promise<GenericValueMap> {
        debug(`Starting to execute task ${task.getCode()}`);
        return new Promise<GenericValueMap>(resolve => {
          setTimeout(() => {
            if (task.getCode() === 'task2') {
              // noinspection JSIgnoredPromiseFromCall
              pauseFlow2();
            }

            restoredFlowTasksRan.push(task.getCode());
            resolve({
              result: params.text1 + params.text2,
            });
          }, 100);
        });
      }
    }

    const finishRestoredPromise = flowRestored.start(
      {
        initialStr: '',
        text1,
        text2,
        text3,
        text4,
      },
      ['result1', 'result2', 'result3', 'finalStr'],
      {
        append: AppendString2,
      },
    );

    const finalResultRestored = await finishRestoredPromise;

    expect(finalResult.finalStr).to.equal(finalResultRestored.finalStr);

    // @todo Add support for this test:
    // expect(restoredFlowTasksRan).to.be.eql(['task3', 'task4']);
  });
});
