import { expect } from 'chai';
import { FlowManager, GenericValueMap } from '../src';

class TimerResolver {
  public async exec(): Promise<GenericValueMap> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ a: 1 });
      }, 100);
    });
  }
}

class DirectResolver {
  public async exec(): Promise<GenericValueMap> {
    return { b: 2 };
  }
}

describe('can run a flow', () => {
  it('from a JSON got from a URL', () => {
    return FlowManager.runFromUrl(
      'https://raw.githubusercontent.com/daniel-duarte/flowed/master/test/examples/example6.flowed.json',
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

  it('from a JSON got from a URL and throw error', async () => {
    const filepath = 'https://raw.githubusercontent.com/daniel-duarte/flowed/master/test/examples/invented.flowed.json';

    try {
      await FlowManager.runFromUrl(
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
      expect(error.message).to.be.eql(`Request failed with status code: 404`);
    }
  });

  it('from a JSON got from a URL with invalid format and throw an error', async () => {
    const filepath =
      'https://raw.githubusercontent.com/daniel-duarte/flowed/master/test/examples/example6.flowed.json.invalid';

    try {
      await FlowManager.runFromUrl(
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
      expect(error.message).to.be.eql('Unexpected token \n in JSON at position 474');
    }
  });
});
