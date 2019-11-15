import { FlowManager, Task } from './engine';
import { GenericValueMap } from './types';

// Do nothing and finish
export class NoopResolver {
  public async exec(): Promise<GenericValueMap> {
    return {};
  }
}

export class EchoResolver {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
    return { out: params.in };
  }
}

export class ThrowErrorResolver {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
    throw new Error(
      typeof params.message !== 'undefined' ? params.message : 'ThrowErrorResolver resolver has thrown an error',
    );
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
  public async exec(params: GenericValueMap, context: GenericValueMap): Promise<GenericValueMap> {
    // @todo add test with subflow task with flowContext

    const flowResult = await FlowManager.run(
      params.flowSpec,
      params.flowParams,
      params.flowExpectedResults,
      params.flowResolvers,
      context,
    );

    return { flowResult };
  }
}

// Run a task multiple times and finishes returning an array with all results.
// If one execution fails, the repeater resolver ends with an exception (this is valid for both parallel and not parallel modes).
export class RepeaterResolver {
  public async exec(params: GenericValueMap, context: GenericValueMap): Promise<GenericValueMap> {
    const resolver = context.$flowed.getResolverByName(params.resolver);
    if (resolver === null) {
      throw new Error(`Task resolver '${params.resolver}' for inner Repeater task has no definition.`);
    }

    const task = new Task('task-repeat-model', params.taskSpec);

    const resultPromises = [];
    let results = [];
    for (let i = 0; i < params.count; i++) {
      task.resetRunStatus();
      task.supplyReqs(params.taskParams);

      // @todo add test with repeater task with taskContext

      const result = task.run(
        resolver,
        context,
        !!params.resolverAutomapParams,
        !!params.resolverAutomapResults,
        params.flowId,
      );

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

// Do nothing and finish
export class ArrayMapResolver {
  public async exec(params: GenericValueMap, context: GenericValueMap): Promise<GenericValueMap> {
    const resolver = context.$flowed.getResolverByName(params.resolver);
    if (resolver === null) {
      throw new Error(`Task resolver '${params.resolver}' for inner ArrayMap task has no definition.`);
    }

    const task = new Task('task-loop-model', params.spec);

    const resultPromises = [];
    let results = [];
    for (const taskParams of params.params) {
      task.resetRunStatus();
      task.supplyReqs(taskParams);

      // @todo add test with loop task with context

      const result = task.run(resolver, context, !!params.automapParams, !!params.automapResults, params.flowId);

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
