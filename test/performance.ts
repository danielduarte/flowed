import { debug as rawDebug } from 'debug';
import * as Examples from './examples/index';
import { ExampleMap } from './examples/types';
const debug = rawDebug('flowed:test');

const times = 60000;
const maxTime = '1s';

describe('a simple flow', function() {
  this.timeout(maxTime);

  it(`runs ${times} times in less than ${maxTime} ms`, async () => {
    const start = Date.now();

    for (let i = 0; i < times; i++) {
      await Examples.example2();
    }

    debug(`Ran flow ${times} times in ${Date.now() - start} ms`);
  });
});
