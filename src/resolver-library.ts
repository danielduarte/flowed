import { FlowManager, Task } from './engine';
import { GenericValueMap } from './types';

// Do nothing and finish
export class NoopResolver {
  public async exec(): Promise<GenericValueMap> {
    return {};
  }
}

// Wait for 'ms' milliseconds and finish
export class WaitResolver {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>(resolve => {
      setTimeout(() => {
        resolve({});
      }, params.ms);
    });
  }
}

// Run a flow and finish
export class SubFlowResolver {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
    const flowResult = await FlowManager.run(
      params.flowSpec,
      params.flowParams,
      params.flowExpectedResults,
      params.flowResolvers,
    );

    return { flowResult };
  }
}

// Run a task multiple times and finishes returning an array with all results
export class RepeaterResolver {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
    const task = new Task('task-repeat-model', params.taskSpec);

    const resultPromises = [];
    let results = [];
    for (let i = 0; i < params.count; i++) {
      task.resetRunStatus();
      task.supplyReqs(params.taskParams);

      // @todo add test with repeater and task that thrown error

      // @todo should handle rejected promise?
      const result = task.run(params.taskResolver);

      if (params.parallel) {
        resultPromises.push(result);
      } else {
        results.push(await result);
      }
    }

    if (params.parallel) {
      results = await Promise.all(resultPromises);
    }

    return { results };
  }
}

// @todo add ThrowErrorResolver
