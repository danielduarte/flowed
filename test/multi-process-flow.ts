import { expect } from 'chai';
import { FlowManager, ValueMap } from '../src';

describe('multi process flow', async () => {
  it('runs properly', async () => {
    let msgCount = 1;

    const output: string[] = [];

    class ProvideMessage {
      public async exec(): Promise<ValueMap> {
        return {
          message: `Message number ${msgCount++}`,
        };
      }
    }

    class ConsoleLog {
      public async exec(params: ValueMap): Promise<ValueMap> {
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
        options: {
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

  it('runs loop', async () => {
    class Loop {
      public async exec(params: ValueMap, context: ValueMap): Promise<ValueMap> {
        if (context.counter > 0) {
          return { result: context.counter-- };
        }

        return {};
      }
    }

    await FlowManager.run(
      {
        tasks: {
          loop5: {
            requires: ['result'],
            provides: ['result'],
            resolver: {
              name: 'loop',
              results: { result: 'result' },
            },
          },
        },
      },
      { result: true },
      [],
      { loop: Loop },
      { counter: 5 },
    );
  });
});
