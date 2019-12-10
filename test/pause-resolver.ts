import { expect } from 'chai';
import { Flow } from '../src';

describe('the ResolverLibrary / pause resolver', () => {
  const flowSpec = {
    tasks: {
      stop: {
        resolver: {
          name: 'flowed::Pause',
        },
      },
    },
  };

  it('can pause a flow', async () => {
    const flow = new Flow(flowSpec);
    await flow.start();
    expect(flow.getStateCode()).to.be.eql('Paused');
  });
});
