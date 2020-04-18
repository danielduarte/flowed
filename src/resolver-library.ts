import { FlowManager, Task } from './engine';
import { TaskProcess } from './engine/task-process';
import { ValueMap } from './types';

// Do nothing and finish
export class NoopResolver {
  public async exec(): Promise<ValueMap> {
    return {};
  }
}

export class EchoResolver {
  public async exec(params: ValueMap): Promise<ValueMap> {
    return { out: params.in };
  }
}

export class ThrowErrorResolver {
  public async exec(params: ValueMap): Promise<ValueMap> {
    throw new Error(typeof params.message !== 'undefined' ? params.message : 'ThrowErrorResolver resolver has thrown an error');
  }
}

export class ConditionalResolver {
  public async exec(params: ValueMap): Promise<ValueMap> {
    return params.condition ? { onTrue: params.trueResult } : { onFalse: params.falseResult };
  }
}

// Wait for 'ms' milliseconds and finish
export class WaitResolver {
  public async exec(params: ValueMap): Promise<ValueMap> {
    return new Promise<ValueMap>(resolve => {
      setTimeout(() => {
        resolve({ result: params.result });
      }, params.ms);
    });
  }
}

// Run a flow and finish
export class SubFlowResolver {
  public async exec(params: ValueMap, context: ValueMap): Promise<ValueMap> {
    // @todo add test with subflow task with flowContext

    const flowResult = await FlowManager.run(params.flowSpec, params.flowParams, params.flowExpectedResults, params.flowResolvers, context);

    return { flowResult };
  }
}

// Run a task multiple times and finishes returning an array with all results.
// If one execution fails, the repeater resolver ends with an exception (this is valid for both parallel and not parallel modes).
export class RepeaterResolver {
  public async exec(params: ValueMap, context: ValueMap, task: Task, debug: any): Promise<ValueMap> {
    const resolver = context.$flowed.getResolverByName(params.resolver);
    if (resolver === null) {
      throw new Error(`Task resolver '${params.resolver}' for inner Repeater task has no definition.`);
    }

    const innerTask = new Task('task-repeat-model', params.taskSpec);

    const resultPromises = [];
    let results = [];
    for (let i = 0; i < params.count; i++) {
      innerTask.resetRunStatus();
      innerTask.supplyReqs(params.taskParams);

      // @todo add test with repeater task with taskContext

      const process = new TaskProcess(
        context.$flowed.processManager,
        0,
        innerTask,
        resolver,
        context,
        !!params.resolverAutomapParams,
        !!params.resolverAutomapResults,
        params.flowId,
        debug,
      );

      const result = process.run();

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

export class ArrayMapResolver {
  public async exec(params: ValueMap, context: ValueMap, task: Task, debug: any): Promise<ValueMap> {
    const resolver = context.$flowed.getResolverByName(params.resolver);
    if (resolver === null) {
      throw new Error(`Task resolver '${params.resolver}' for inner ArrayMap task has no definition.`);
    }

    const innerTask = new Task('task-loop-model', params.spec);

    const resultPromises = [];
    let results = [];
    for (const taskParams of params.params) {
      innerTask.resetRunStatus();
      innerTask.supplyReqs(taskParams);

      // @todo add test with loop task with context

      const process = new TaskProcess(
        context.$flowed.processManager,
        0,
        innerTask,
        resolver,
        context,
        !!params.automapParams,
        !!params.automapResults,
        params.flowId,
        debug,
      );

      const result = process.run();

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

export class StopResolver {
  public async exec(params: ValueMap, context: ValueMap): Promise<ValueMap> {
    return { promise: context.$flowed.flow.stop() };
  }
}

export class PauseResolver {
  public async exec(params: ValueMap, context: ValueMap): Promise<ValueMap> {
    return { promise: context.$flowed.flow.pause() };
  }
}
