import { expect } from 'chai';
import { FlowManager, ValueMap } from '../src';

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
    );
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
    } catch (error) {
      expect(error.message).to.be.eql('Unexpected token } in JSON at position 11');
    }
  });
});
