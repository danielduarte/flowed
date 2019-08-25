import { debug as rawDebug } from 'debug';
import * as Examples from './examples/index';
import { ExampleMap } from './examples/types';
const debug = rawDebug('flowed:test');

describe('the example', function() {
  this.timeout('2.5s');

  Object.keys(Examples).forEach(exampleName => {
    it(`${exampleName} runs without errors`, () => {
      debug(`Running example: ${exampleName}`);
      return (Examples as ExampleMap)[exampleName]();
    });
  });
});
