import { FlowManager, Task } from './engine';
import { GenericValueMap } from './types';

// Do nothing and finish
export class NoopResolver {
  public async exec(): Promise<GenericValueMap> {
    return {};
  }
}

export class ThrowError {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
    throw new Error(typeof params.message !== 'undefined' ? params.message : 'ThrowError resolver has thrown an error');
  }
}

export class ConditionalResolver {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
    return params.condition ? { onTrue: params.trueResult } : { onFalse: params.falseResult };
  }
}

// Wait for 'ms' milliseconds and finish
export class WaitResolver {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
    // @todo add value as param to resolve after time is out
    return new Promise<GenericValueMap>(resolve => {
      setTimeout(() => {
        resolve({ result: params.result });
      }, params.ms);
    });
  }
}

// Run a flow and finish
export class SubFlowResolver {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
    // @todo add test with subflow task with flowContext

    const flowResult = await FlowManager.run(
      params.flowSpec,
      params.flowParams,
      params.flowExpectedResults,
      params.flowResolvers,
      params.flowContext,
    );

    return { flowResult };
  }
}

// Run a task multiple times and finishes returning an array with all results.
// If one execution fails, the repeater resolver ends with an exception (this is valid for both parallel and not parallel modes).
export class RepeaterResolver {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
    const task = new Task('task-repeat-model', params.taskSpec);

    const resultPromises = [];
    let results = [];
    for (let i = 0; i < params.count; i++) {
      task.resetRunStatus();
      task.supplyReqs(params.taskParams);

      // @todo add test with repeater task with taskContext

      const result = task.run(params.taskResolver, params.taskContext);

      if (params.parallel) {
        resultPromises.push(result);
      } else {
        results.push(await result); // If rejected, exception is not thrown here, it is delegated
      }
    }

    if (params.parallel) {
      results = await Promise.all(resultPromises); // If rejected, exception is not thrown here, it is delegated
    }

    return { results };
  }
}
