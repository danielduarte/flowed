import { expect } from 'chai';
import { Flow } from '../src';

describe('the ResolverLibrary / stop resolver', () => {
  const flowSpec = {
    tasks: {
      stop: {
        resolver: {
          name: 'flowed::Stop',
        },
      },
    },
  };

  it('can stop a flow', async () => {
    const flow = new Flow(flowSpec);
    await flow.start();
    expect(flow.getStateCode()).to.be.eql('Stopped');
  });
});
