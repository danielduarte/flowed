import { expect } from 'chai';
import { FlowManager, ValueMap } from '../src';
import { getMajorNodeVersion } from './utils/node-version';

class TimerResolver {
  public async exec(): Promise<ValueMap> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ a: 1 });
      }, 100);
    });
  }
}

class DirectResolver {
  public async exec(): Promise<ValueMap> {
    return { b: 2 };
  }
}

describe('can run a flow', () => {
  it('from a JSON string', () => {
    return FlowManager.runFromString(
      '{ "tasks": {} }',
      {
        param1: 'PARAM1',
        param2: 'PARAM2',
        param3: 'PARAM3',
      },
      ['g1', 'g2'],
      {
        timer: TimerResolver,
        direct: DirectResolver,
      },
      {},
    );
  });

  it('from a JSON string defaulting arguments', () => {
    return FlowManager.runFromString('{ "tasks": {} }');
  });

  it('from an JSON string with invalid format and throw an error', async () => {
    try {
      await FlowManager.runFromString(
        '{ "tasks": } }',
        {
          param1: 'PARAM1',
          param2: 'PARAM2',
          param3: 'PARAM3',
        },
        ['g1', 'g2'],
        {
          timer: TimerResolver,
          direct: DirectResolver,
        },
      );
    } catch (err) {
      const nodeVersion = getMajorNodeVersion();
      if (nodeVersion <= 18) {
        expect((err as Error).message).to.be.eql('Unexpected token } in JSON at position 11'); // Node.js 18
      } else {
        expect((err as Error).message).to.be.eql('Unexpected token \'}\', "{ "tasks": } }" is not valid JSON'); // Node.js 19, 20, 21, 22
      }
    }
  });
});
