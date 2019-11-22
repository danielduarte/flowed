import { expect } from 'chai';
import { FlowManager, GenericValueMap } from '../src';
import { Task } from '../src/engine';

describe('edge cases', () => {
  it('manually provide unexpected requirement to task must throw an error', async () => {
    class R {
      public exec(params: GenericValueMap, context: GenericValueMap, task: Task): Promise<GenericValueMap> {
        task.supplyReq('someReq', 'Same value');
        return Promise.resolve({});
      }
    }

    let errorMsg = 'No error';
    try {
      await FlowManager.run(
        {
          tasks: {
            T: {
              resolver: {
                name: 'R',
              },
            },
          },
        },
        {},
        [],
        { R },
      );
    } catch (err) {
      errorMsg = err.message;
    }

    expect(errorMsg).to.be.eql("Requirement 'someReq' for task 'T' is not valid or has already been supplied.");
  });

  // Added to improve error messaging when resolvers does not return as expected.
  // This would be an error in the developing of the resolver, but this improvement helps the developer to find out which is the error.
  // Related issue https://github.com/daniel-duarte/flowed/issues/19
  it('resolver not returning object throws an expressive error', async () => {
    // Resolver returning a Promise that does not resolve to an object
    class R1 {
      public exec(params: GenericValueMap, context: GenericValueMap, task: Task): Promise<GenericValueMap> {
        return Promise.resolve((undefined as unknown) as GenericValueMap);
      }
    }

    // Resolver returning undefined or equivalently, not returning at all
    class R2 {
      public exec(params: GenericValueMap, context: GenericValueMap, task: Task): Promise<GenericValueMap> {
        return (undefined as unknown) as Promise<GenericValueMap>;
      }
    }
    const spec = {
      tasks: {
        T: {
          resolver: {
            name: 'R',
            results: {
              a: 'a',
            },
          },
        },
      },
    };

    const expectedMsg =
      "Expected resolver for task 'T' to return an object or Promise that resolves to object. Returned value is of type 'undefined'.";

    let errorMsg = 'No error';
    try {
      await FlowManager.run(spec, {}, [], { R: R1 });
    } catch (err) {
      errorMsg = err.message;
    }
    expect(errorMsg).to.be.eql(expectedMsg);

    errorMsg = 'No error';
    try {
      await FlowManager.run(spec, {}, [], { R: R2 });
    } catch (err) {
      errorMsg = err.message;
    }
    expect(errorMsg).to.be.eql(expectedMsg);
  });
});
