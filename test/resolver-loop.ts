import { expect } from 'chai';
import { debug as rawDebug } from 'debug';
import { FlowManager, ValueMap } from '../src';
const debug = rawDebug('flowed:test');

describe('resolver loop', () => {
  const getFlowSpec = (runInParallel: boolean) => ({
    tasks: {
      concatArray: {
        requires: ['parameters'],
        provides: ['preResults'],
        resolver: {
          name: 'flowed::ArrayMap',
          params: {
            flowId: { value: '1.1' },
            parallel: { value: runInParallel },
            params: 'parameters',
            spec: {
              value: {
                requires: ['x', 'y'],
                provides: ['result'],
                resolver: {
                  name: 'customResolver', // @todo Use this value instead of the parameter "resolver"
                },
              },
            },
            resolver: { value: 'resConcat' },
            automapParams: { value: true },
            automapResults: { value: true },
          },
          results: {
            results: 'preResults',
          },
        },
      },
      postProcess: {
        requires: ['preResults'],
        provides: ['results'],
        resolver: {
          name: 'flowed::Echo',
          params: {
            in: { transform: { '{{#each preResults}}': '{{result}}' } },
          },
          results: {
            out: 'results',
          },
        },
      },
    },
    options: {
      resolverAutomapParams: true,
      resolverAutomapResults: true,
    },
  });

  class Concat {
    public async exec(params: ValueMap, context: ValueMap): Promise<ValueMap> {
      debug('Started sub-task');
      return new Promise((resolve, reject) => {
        setImmediate(() => {
          debug('Finished sub-task');
          resolve({ result: params.x + context.separator + params.y });
        });
      });
    }
  }

  it('run without error in sequence', async () => {
    // @todo Add test to check if flow finishes even when there are not ran tasks (put a non satisfied requirements in a task)

    const results = (
      await FlowManager.run(
        getFlowSpec(false),
        {
          parameters: [
            { x: 'x1', y: 'y1' },
            { x: 'x2', y: 'y2' },
            { x: 'x3', y: 'y3' },
            { x: 'x4', y: 'y4' },
          ],
        },
        ['results'],
        { resConcat: Concat },
        { separator: '-' },
      )
    ).results;

    expect(results).to.be.eql(['x1-y1', 'x2-y2', 'x3-y3', 'x4-y4']);
  });

  it('run without error in parallel', async () => {
    // @todo Add test to check if flow finishes even when there are not ran tasks (put a non satisfied requirements in a task)

    const results = (
      await FlowManager.run(
        getFlowSpec(true),
        {
          parameters: [
            { x: 'x1', y: 'y1' },
            { x: 'x2', y: 'y2' },
            { x: 'x3', y: 'y3' },
            { x: 'x4', y: 'y4' },
          ],
        },
        ['results'],
        { resConcat: Concat },
        { separator: '-' },
      )
    ).results;

    expect(results).to.be.eql(['x1-y1', 'x2-y2', 'x3-y3', 'x4-y4']);
  });

  it('run with error (incorrect resolver mapping) in sequence', async () => {
    let errorMsg = 'No error';

    try {
      await FlowManager.run(
        getFlowSpec(false),
        {
          parameters: [
            { x: 'x1', y: 'y1' },
            { x: 'x2', y: 'y2' },
            { x: 'x3', y: 'y3' },
            { x: 'x4', y: 'y4' },
          ],
        },
        ['results'],
        { resConcatIncorrectName: Concat },
        { separator: '-' },
      );
    } catch (error) {
      errorMsg = error.message;
    }

    expect(errorMsg).to.be.eql("Task resolver 'resConcat' for inner ArrayMap task has no definition.");
  });

  it('run with error (incorrect resolver mapping) in parallel', async () => {
    let errorMsg = 'No error';

    try {
      await FlowManager.run(
        getFlowSpec(true),
        {
          parameters: [
            { x: 'x1', y: 'y1' },
            { x: 'x2', y: 'y2' },
            { x: 'x3', y: 'y3' },
            { x: 'x4', y: 'y4' },
          ],
        },
        ['results'],
        { resConcatIncorrectName: Concat },
        { separator: '-' },
      );
    } catch (error) {
      errorMsg = error.message;
    }

    expect(errorMsg).to.be.eql("Task resolver 'resConcat' for inner ArrayMap task has no definition.");
  });
});
