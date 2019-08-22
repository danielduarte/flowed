import { GenericValueMap } from '../src/engine/flow';
import * as Examples from  '../src/examples'
import { ExampleMap } from '../src/examples/types';

describe('the examples', function () {
  this.timeout('2.5s');

  it('run without errors', () => {
    type MapPromise = Promise<GenericValueMap>;
    const promises: MapPromise[] = [];

    Object.keys(Examples).forEach((exampleName) => {
      const exampleMap: ExampleMap = Examples;
      promises.push(exampleMap[exampleName]());
    });

    return Promise.all(promises);
  });
});
