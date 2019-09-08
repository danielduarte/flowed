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

  it('from a JSON got from an incorrect URL and throw error', async () => {
    try {
      await FlowManager.runFromUrl(
        'https://raw.githubusercontent.com/daniel-duarte/flowed/master/test/examples/invented.flowed.json',
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

      throw new Error('An error should have been thrown');
    } catch (error) {
      expect(error.message).to.be.eql(`Request failed with status code: 404`);
    }
  });

  it('from a JSON got from a URL with unsupported protocol and throw error', async () => {
    try {
      await FlowManager.runFromUrl(
        'ftp://raw.githubusercontent.com/daniel-duarte/flowed/master/test/examples/invented.flowed.json',
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

      throw new Error('An error should have been thrown');
    } catch (error) {
      expect(error.message).to.be.eql(`Protocol not supported: ftp. Supported protocols are: [http, https]`);
    }
  });

  it('from a JSON got from a URL with invalid format and throw an error', async () => {
    try {
      await FlowManager.runFromUrl(
        'https://raw.githubusercontent.com/daniel-duarte/flowed/master/test/examples/example6.flowed.json.invalid',
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

      throw new Error('An error should have been thrown');
    } catch (error) {
      expect(error.message).to.be.eql('Unexpected token \n in JSON at position 474');
    }
  });
});
