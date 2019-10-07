import { debug as rawDebug } from 'debug';
import { Flow } from '../src';
const debug = rawDebug('flowed:test');

describe('a flow state can be', () => {
  it('serialized without error', async () => {
    const flow = new Flow();

    const state = flow.getSerializableState();

    debug(state);
  });
});
