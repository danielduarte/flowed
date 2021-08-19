import rawDebug from '../src/debug';
import * as Examples from './examples-inline/index';
import { ExampleMap } from './examples/types';
const debug = rawDebug('test');

describe('the inline example', function () {
  this.timeout('2.5s');

  Object.keys(Examples).forEach(exampleName => {
    it(`${exampleName} runs without errors`, () => {
      debug(`Running example: ${exampleName}`);
      return (Examples as ExampleMap)[exampleName]();
    });
  });
});
