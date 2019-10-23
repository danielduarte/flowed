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
});
