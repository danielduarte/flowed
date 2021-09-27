import { Debugger } from 'debug';
import { FlowManager, Task } from './engine';
import { TaskProcess } from './engine/task-process';
import { LoggerFn, ValueMap } from './types';

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
    // @todo document $flowed

    // If no resolvers specified as parameter, inherit from global scope
    let flowResolvers = params.flowResolvers;
    if (typeof flowResolvers === 'undefined') {
      flowResolvers = context.$flowed.getResolvers();
    }

    let flowResult = await FlowManager.run(
      params.flowSpec,
      params.flowParams,
      params.flowExpectedResults,
      flowResolvers,
      context,
      context.$flowed.flow.runStatus.runOptions,
    );

    // @todo document param uniqueResult
    if (typeof params.uniqueResult === 'string') {
      flowResult = flowResult[params.uniqueResult];
    }

    return { flowResult };
  }
}

// Run a task multiple times and finishes returning an array with all results.
// If one execution fails, the repeater resolver ends with an exception (this is valid for both parallel and not parallel modes).
export class RepeaterResolver {
  public async exec(params: ValueMap, context: ValueMap, task: Task, debug: Debugger, log: LoggerFn): Promise<ValueMap> {
    const resolver = context.$flowed.getResolverByName(params.resolver);
    if (resolver === null) {
      throw new Error(`Task resolver '${params.resolver}' for inner flowed::Repeater task has no definition.`);
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
        log,
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
  public async exec(params: ValueMap, context: ValueMap, task: Task, debug: Debugger, log: LoggerFn): Promise<ValueMap> {
    const resolver = context.$flowed.getResolverByName(params.resolver);
    if (resolver === null) {
      throw new Error(`Task resolver '${params.resolver}' for inner flowed::ArrayMap task has no definition.`);
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
        log,
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

// @todo document Loop resolver
export class LoopResolver {
  public async exec(params: ValueMap, context: ValueMap, task: Task, debug: Debugger, log: LoggerFn): Promise<ValueMap> {
    const resolverName = params.subtask.resolver.name;
    const resolver = context.$flowed.getResolverByName(resolverName);
    if (resolver === null) {
      throw new Error(`Task resolver '${resolverName}' for inner flowed::Loop task has no definition.`);
    }

    const innerTask = new Task('task-loop-model', params.subtask);

    const resultPromises = [];
    let outCollection = [];
    for (const item of params.inCollection) {
      const taskParams = { [params.inItemName]: item };

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
        log,
      );

      const itemResultPromise = process.run();

      if (params.parallel) {
        resultPromises.push(itemResultPromise);
      } else {
        const itemResult = await itemResultPromise;
        outCollection.push(itemResult[params.outItemName]); // If rejected, exception is not thrown here, it is delegated
      }
    }

    if (params.parallel) {
      const outCollectionResults = await Promise.all(resultPromises); // If rejected, exception is not thrown here, it is delegated
      outCollection = outCollectionResults.map(itemResult => itemResult[params.outItemName]);
    }

    return { outCollection };
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
