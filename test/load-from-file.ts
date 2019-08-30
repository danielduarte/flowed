import { expect } from 'chai';
import { FlowManager, GenericValueMap } from '../src';

class TimerResolver {
  public async exec(): Promise<GenericValueMap> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ a: 1 });
      }, 200);
    });
  }
}

class DirectResolver {
  public async exec(): Promise<GenericValueMap> {
    return { b: 2 };
  }
}

describe('can run a flow', () => {
  it('from a JSON file', () => {
    return FlowManager.runFromFile(
      'test/examples/example6.flowed.json',
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

  it('from a non existing JSON file and throw error', async () => {
    const filepath = 'invented/path/to/nowhere.flowed.json';

    try {
      await FlowManager.runFromFile(
        filepath,
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
      expect(error.message).to.be.eql(`ENOENT: no such file or directory, open '${filepath}'`);
    }
  });
});
