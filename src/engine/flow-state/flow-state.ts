import { debug as rawDebug } from 'debug';
import {
  ArrayMapResolver,
  ConditionalResolver,
  EchoResolver,
  NoopResolver,
  RepeaterResolver,
  SubFlowResolver,
  ThrowErrorResolver,
  WaitResolver,
} from '../../resolver-library';
import { FlowStateEnum, FlowTransitionEnum, GenericValueMap, TaskResolverMap } from '../../types';
import { FlowRunStatus } from '../flow-run-status';
import { FlowSpec } from '../specs';
import { Task } from '../task';
import { IFlow } from './iflow';
const debug = rawDebug('flowed:flow');

export abstract class FlowState implements IFlow {
  /**
   * Built-in resolver library.
   * @type {TaskResolverMap}
   */
  protected static builtInResolvers: TaskResolverMap = {
    'flowed::Noop': NoopResolver,
    'flowed::Echo': EchoResolver,
    'flowed::ThrowError': ThrowErrorResolver,
    'flowed::Conditional': ConditionalResolver,
    'flowed::Wait': WaitResolver,
    'flowed::SubFlow': SubFlowResolver,
    'flowed::Repeater': RepeaterResolver,
    'flowed::ArrayMap': ArrayMapResolver,
  };

  protected runStatus: FlowRunStatus;

  public constructor(runStatus: FlowRunStatus) {
    this.runStatus = runStatus;
  }

  public initRunStatus(spec: FlowSpec) {
    this.runStatus.spec = spec;
    this.runStatus.tasks = {};

    const provisions: string[] = [];

    for (const [taskCode, taskSpec] of Object.entries(this.runStatus.spec.tasks || {})) {
      provisions.push.apply(provisions, taskSpec.provides || []);
      this.runStatus.tasks[taskCode] = new Task(taskCode, taskSpec);
    }

    // To be used later to check if expectedResults can be fulfilled.
    this.runStatus.taskProvisions = Array.from(new Set(provisions));

    this.runStatus.configs = this.runStatus.spec.configs || {};

    for (const taskCode in this.runStatus.tasks) {
      if (this.runStatus.tasks.hasOwnProperty(taskCode)) {
        const task = this.runStatus.tasks[taskCode];
        task.resetRunStatus();

        if (task.isReadyToRun()) {
          this.runStatus.tasksReady.push(task);
        }

        const taskReqs = task.getSpec().requires || [];
        for (const req of taskReqs) {
          if (!this.runStatus.tasksByReq.hasOwnProperty(req)) {
            this.runStatus.tasksByReq[req] = {};
          }
          this.runStatus.tasksByReq[req][task.getCode()] = task;
        }
      }
    }
  }

  public start(
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: GenericValueMap = {},
  ): Promise<GenericValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Start);
  }

  public finished(error: Error | boolean = false) {
    throw this.createTransitionError(FlowTransitionEnum.Finished);
  }

  public pause(): Promise<GenericValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Pause);
  }

  public paused() {
    throw this.createTransitionError(FlowTransitionEnum.Paused);
  }

  public resume() {
    throw this.createTransitionError(FlowTransitionEnum.Resume);
  }

  public stop(): Promise<GenericValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Stop);
  }

  public stopped() {
    throw this.createTransitionError(FlowTransitionEnum.Stopped);
  }

  public reset() {
    throw this.createTransitionError(FlowTransitionEnum.Reset);
  }

  public abstract getStateCode(): FlowStateEnum;

  public execFinishResolve() {
    this.runStatus.finishResolve(this.runStatus.results);
  }

  public execFinishReject(error: Error) {
    this.runStatus.finishReject(error);
  }

  public execPauseResolve() {
    this.runStatus.pauseResolve(this.runStatus.results);
  }

  public execPauseReject(error: Error) {
    this.runStatus.pauseReject(error);
  }

  public execStopResolve() {
    this.runStatus.stopResolve(this.runStatus.results);
  }

  public execStopReject(error: Error) {
    this.runStatus.stopReject(error);
  }

  public isRunning() {
    return this.runStatus.runningTasks.length > 0;
  }

  public setExpectedResults(expectedResults: string[] = []) {
    // Check expected results that cannot be fulfilled
    const missingExpected = expectedResults.filter(r => !this.runStatus.taskProvisions.includes(r));
    if (missingExpected.length > 0) {
      const msg = `The results [${missingExpected.join(', ')}] are not provided by any task`;
      if (this.runStatus.configs.throwErrorOnUnsolvableResult) {
        throw new Error(msg);
      } else {
        debug(`Warning: ${msg}`);
      }
    }

    this.runStatus.expectedResults = [...expectedResults];
  }

  public getResults() {
    return this.runStatus.results;
  }

  public setResolvers(resolvers: TaskResolverMap = {}) {
    this.runStatus.resolvers = resolvers;
  }

  public setContext(context: GenericValueMap) {
    this.runStatus.context = context;
  }

  public supplyParameters(params: GenericValueMap) {
    for (const [paramCode, paramValue] of Object.entries(params)) {
      this.supplyResult(paramCode, paramValue);
    }
  }

  public getSpec() {
    return this.runStatus.spec;
  }

  public createFinishPromise(): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>((resolve, reject) => {
      this.runStatus.finishResolve = resolve;
      this.runStatus.finishReject = reject;
    });
  }

  public createPausePromise(): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>((resolve, reject) => {
      this.runStatus.pauseResolve = resolve;
      this.runStatus.pauseReject = reject;
    });
  }

  public createStopPromise(): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>((resolve, reject) => {
      this.runStatus.stopResolve = resolve;
      this.runStatus.stopReject = reject;
    });
  }

  public getResolverForTask(task: Task) {
    const name = task.getResolverName();

    // Look for custom resolvers
    const hasCustomResolver = this.runStatus.resolvers.hasOwnProperty(name);
    if (hasCustomResolver) {
      return this.runStatus.resolvers[name];
    }

    // Look for built-in resolvers
    const hasBuiltInResolver = FlowState.builtInResolvers.hasOwnProperty(name);
    if (hasBuiltInResolver) {
      return FlowState.builtInResolvers[name];
    }

    throw new Error(
      `Task resolver '${name}' for task '${task.getCode()}' has no definition. Defined custom resolvers are: [${Object.keys(
        this.runStatus.resolvers,
      ).join(', ')}].`,
    );
  }

  public supplyResult(resultName: string, result: any) {
    const suppliesSomeTask = this.runStatus.tasksByReq.hasOwnProperty(resultName);

    // Checks if the task result is required by other tasks.
    // If it is not, it is probably a flow output value.
    if (suppliesSomeTask) {
      const suppliedTasks = this.runStatus.tasksByReq[resultName];
      const suppliedTaskCodes = Object.keys(suppliedTasks);
      for (const taskCode of suppliedTaskCodes) {
        const suppliedTask = suppliedTasks[taskCode];

        suppliedTask.supplyReq(resultName, result);
        delete suppliedTasks[taskCode];
        if (Object.keys(suppliedTasks).length === 0) {
          delete this.runStatus.tasksByReq[resultName];
        }

        if (suppliedTask.isReadyToRun()) {
          this.runStatus.tasksReady.push(suppliedTask);
        }
      }
    }

    // If the result is required as flow output, it is provided
    const isExpectedResult = this.runStatus.expectedResults.indexOf(resultName) > -1;
    if (isExpectedResult) {
      this.runStatus.results[resultName] = result;
    }
  }

  public getStateInstance(state: FlowStateEnum) {
    return this.runStatus.states[state];
  }

  public startReadyTasks() {
    const readyTasks = this.runStatus.tasksReady;
    this.runStatus.tasksReady = [];

    for (const task of readyTasks) {
      this.runStatus.runningTasks.push(task.getCode());

      const taskResolver = this.runStatus.state.getResolverForTask(task);
      task
        .run(
          taskResolver,
          this.runStatus.context,
          !!this.runStatus.configs.resolverAutomapParams,
          !!this.runStatus.configs.resolverAutomapResults,
          this.runStatus.id,
        )
        .then(
          () => {
            this.taskFinished(task);
          },
          (error: Error) => {
            this.taskFinished(task, error, true);
          },
        );

      debug(`[${this.runStatus.id}] ` + `  ‣ Task ${task.getCode()} started, params:`, task.getParams());
    }
  }

  public setState(newState: FlowStateEnum) {
    this.runStatus.state = this.getStateInstance(newState);
  }

  protected taskFinished(task: Task, error: Error | boolean = false, stopFlowExecutionOnError: boolean = false) {
    const taskSpec = task.getSpec();
    const taskProvisions = taskSpec.provides || [];
    const taskResults = task.getResults();
    const taskCode = task.getCode();
    const hasDefaultResult = taskSpec.hasOwnProperty('defaultResult');

    if (error) {
      debug(`[${this.runStatus.id}]   ✗ Error in task ${taskCode}, results:`, taskResults);
    } else {
      debug(`[${this.runStatus.id}]   ✓ Finished task ${taskCode}, results:`, taskResults);
    }

    // Remove the task from running tasks collection
    this.runStatus.runningTasks.splice(this.runStatus.runningTasks.indexOf(taskCode), 1);

    for (const resultName of taskProvisions) {
      if (taskResults.hasOwnProperty(resultName)) {
        this.runStatus.state.supplyResult(resultName, taskResults[resultName]);
      } else if (hasDefaultResult) {
        // @todo add defaultResult to repeater task
        this.runStatus.state.supplyResult(resultName, taskSpec.defaultResult);
      } else {
        debug(
          `[${
            this.runStatus.id
          }] ⚠️ Expected value '${resultName}' was not provided by task '${taskCode}' with resolver '${task.getResolverName()}'`,
        );
      }
    }

    if (this.runStatus.state.getStateCode() === FlowStateEnum.Running) {
      const stopExecution = error && stopFlowExecutionOnError;
      if (!stopExecution) {
        this.startReadyTasks();
      }

      if (!this.runStatus.state.isRunning()) {
        this.runStatus.state.finished(error);
      }
    }

    if (!this.runStatus.state.isRunning()) {
      const currentState = this.runStatus.state.getStateCode();

      if (currentState === FlowStateEnum.Pausing) {
        this.runStatus.state.paused();
      } else if (currentState === FlowStateEnum.Stopping) {
        this.runStatus.state.stopped();
      }
    }
  }

  protected createTransitionError(transition: string) {
    return new Error(`Cannot execute transition ${transition} in current state ${this.getStateCode()}.`);
  }
}
