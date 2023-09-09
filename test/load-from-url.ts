import { expect } from 'chai';
import { FlowManager, ValueMap } from '../src';
import createTestServer from './test-server';

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

describe('can run a flow', function () {
  this.timeout(4000);

  it('from a JSON got from an HTTPS URL', () => {
    return FlowManager.runFromUrl(
      'https://raw.githubusercontent.com/danielduarte/flowed/main/test/examples/from-file.flowed.json',
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

  it('from a JSON got from an HTTPS URL defaulting arguments', () => {
    return FlowManager.runFromUrl(
      'https://raw.githubusercontent.com/danielduarte/flowed/main/test/examples/from-file-defaulting-arguments.flowed.json',
    );
  });

  it('from a JSON got from an HTTP URL', () => {
    createTestServer();

    return FlowManager.runFromUrl(
      'http://localhost:3333',
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

  it('from a JSON got from a URL with incorrect Content-Type', async () => {
    createTestServer('some-unknown/content-format');

    try {
      await FlowManager.runFromUrl(
        'http://localhost:3333',
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
    } catch (err) {
      expect((err as Error).message).to.be.eql(
        "Invalid content-type: Expected 'application/json' or 'text/plain' but received 'some-unknown/content-format'",
      );
    }
  });

  it('from a JSON got from an incorrect URL and throw error', async () => {
    try {
      await FlowManager.runFromUrl(
        'https://raw.githubusercontent.com/danielduarte/flowed/main/test/examples/invented.flowed.json',
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
    } catch (err) {
      expect((err as Error).message).to.be.eql('Request failed with status code: 404');
    }
  });

  it('from a JSON got from an unknown domain and throw error', async () => {
    try {
      await FlowManager.runFromUrl(
        'http://any-unknown-domain-here:3333',
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
    } catch (err) {
      expect((err as Error).message).to.contain.oneOf([
        'getaddrinfo EAI_AGAIN any-unknown-domain-here',
        'getaddrinfo ENOTFOUND any-unknown-domain-here',
      ]);
    }
  });

  it('from a JSON got from a URL with unsupported protocol and throw error', async () => {
    try {
      await FlowManager.runFromUrl(
        'ftp://raw.githubusercontent.com/danielduarte/flowed/main/test/examples/invented.flowed.json',
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
    } catch (err) {
      expect((err as Error).message).to.be.eql('Protocol not supported: ftp. Supported protocols are: [http, https]');
    }
  });

  it('from a JSON got from a URL with invalid URL and throw error', async () => {
    const invalidUrl = 'https//raw.githubusercontent.com/danielduarte/flowed/main/test/examples/invented.flowed.json';
    try {
      await FlowManager.runFromUrl(
        invalidUrl,
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
    } catch (err) {
      expect((err as Error).message).to.be.eql(`Invalid URL: ${invalidUrl}`);
    }
  });

  it('from a JSON got from a URL with invalid format and throw an error', async () => {
    try {
      await FlowManager.runFromUrl(
        'https://raw.githubusercontent.com/danielduarte/flowed/main/test/examples/from-file.flowed.json.invalid',
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
    } catch (err) {
      expect((err as Error).message).to.be.eql('Unexpected token \n in JSON at position 474');
    }
  });
});
