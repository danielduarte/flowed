import { expect } from 'chai';
import { debug as rawDebug } from 'debug';
import { Flow } from '../src/engine/flow';
import { Task } from '../src/engine/task';
import { GenericValueMap, TaskResolverMap } from '../src/types';
const debug = rawDebug('flowed:test');

describe('the flow', () => {
  it('can be paused and resumed', async () => {
    const text1 = '(text1)';
    const text2 = '(text2)';
    const text3 = '(text3)';
    const text4 = '(text4)';

    const flow = new Flow({
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
    });

    const pauseFlow = async () => {
      const partialResult = await flow.pause();
      expect(partialResult).to.deep.equal({
        result1: text1,
        result2: text1 + text2,
      });
      flow.resume();
    };

    class AppendString {
      public async exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {
        debug(`Starting to execute task ${task.getCode()}`);
        return new Promise<GenericValueMap>(resolve => {
          setTimeout(() => {
            if (task.getCode() === 'task2') {
              pauseFlow();
            }

            resolve({
              result: params.text1 + params.text2,
            });
          }, 300);
        });
      }
    }

    const finishPromise = flow.run(
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
});
