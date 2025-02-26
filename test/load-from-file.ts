import { expect } from 'chai';
import { FlowManager, ValueMap } from '../src';
import { getMajorNodeVersion } from './utils/node-version';

class TimerResolver {
  public async exec(): Promise<ValueMap> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ a: 1 });
      }, 10);
    });
  }
}

class DirectResolver {
  public async exec(): Promise<ValueMap> {
    return { b: 2 };
  }
}

describe('can run a flow', () => {
  it('from a JSON file', () => {
    return FlowManager.runFromFile(
      'test/examples/from-file.flowed.json',
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

  it('from a JSON file defaulting arguments', () => {
    return FlowManager.runFromFile('test/examples/from-file-defaulting-arguments.flowed.json');
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
    } catch (err) {
      expect((err as Error).message).to.be.contain('ENOENT: no such file or directory, open');
      expect((err as Error).message).to.be.contain('nowhere.flowed.json');
    }
  });

  it('from an JSON file with invalid format and throw an error', async () => {
    const filepath = 'test/examples/from-file.flowed.json.invalid';

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
    } catch (err) {
      const nodeVersion = getMajorNodeVersion();
      if (nodeVersion <= 18) {
        expect((err as Error).message).to.be.eql('Unexpected token \n in JSON at position 474'); // Node.js 18
      } else if (nodeVersion <= 20) {
        expect((err as Error).message).to.be.eql('Bad control character in string literal in JSON at position 474'); // Node.js 19, 20
      } else {
        expect((err as Error).message).to.be.eql('Bad control character in string literal in JSON at position 474 (line 24 column 19)'); // Node.js 21, 22
      }
    }
  });
});
