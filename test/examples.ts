import { debug as rawDebug } from 'debug';
import { GenericValueMap } from '../src/types';
import * as Examples from './examples/index';
import { ExampleMap } from './examples/types';
const debug = rawDebug('yafe:test');

describe('the example', function() {
  this.timeout('2.5s');

  Object.keys(Examples).forEach(exampleName => {
    it(`${exampleName} runs without errors`, () => {
      debug(`Running example: ${exampleName}`);
      return (Examples as ExampleMap)[exampleName]();
    });
  });
});
