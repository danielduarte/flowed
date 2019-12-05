import { expect } from 'chai';
import { FlowManager, GenericValueMap } from '../src';

describe('multi process flow', async () => {
  it('runs properly', async () => {
    let msgCount = 1;

    const output: string[] = [];

    class ProvideMessage {
      public async exec(): Promise<GenericValueMap> {
        return {
          message: `Message number ${msgCount++}`,
        };
      }
    }

    class ConsoleLog {
      public async exec(params: GenericValueMap): Promise<GenericValueMap> {
        output.push('Incoming message: ' + params.text);
        return {};
      }
    }

    await FlowManager.run(
      {
        tasks: {
          msg1: {
            provides: ['message'],
            resolver: { name: 'provideMsg' },
          },
          msg2: {
            provides: ['message'],
            resolver: { name: 'provideMsg' },
          },
          msg3: {
            provides: ['message'],
            resolver: { name: 'provideMsg' },
          },
          print: {
            requires: ['message'],
            resolver: { name: 'consoleLog', params: { text: 'message' } },
          },
        },
        configs: {
          resolverAutomapResults: true,
        },
      },
      {},
      [],
      { provideMsg: ProvideMessage, consoleLog: ConsoleLog },
    );

    expect(output.sort()).to.be.eql([
      'Incoming message: Message number 1',
      'Incoming message: Message number 2',
      'Incoming message: Message number 3',
    ]);
  });
});
