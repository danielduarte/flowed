import { debug as rawDebug } from 'debug';
import {
  ConditionalResolver,
  NoopResolver,
  RepeaterResolver,
  SubFlowResolver,
  ThrowErrorResolver,
  WaitResolver,
} from '../resolver-library';
import { GenericValueMap, TaskResolverMap } from '../types';
import {
  FlowFinished,
  FlowPaused,
  FlowPausing,
  FlowReady,
  FlowRunning,
  FlowState,
  FlowStopped,
  FlowStopping,
} from './flow-state';
import { IFlow } from './flow-state/iflow';
import { FlowRunStatus, FlowStateEnum } from './flow-types';
import { FlowConfigs, FlowSpec } from './specs';
import { Task } from './task';
import { TaskMap } from './task-types';
const debug = rawDebug('flowed:flow');

// @todo Consider replace tslint with eslint

export class Flow implements IFlow {
  /**
   * Flow instance id to be assigned to the next Flow instance. Intended to be used for debugging.
   * @type {number}
   */
  public static nextId = 1;

  /**
   * Built-in resolver library.
   * @type {TaskResolverMap}
   */
  protected static builtInResolvers: TaskResolverMap = {
    'flowed::Noop': NoopResolver,
    'flowed::ThrowError': ThrowErrorResolver,
    'flowed::Conditional': ConditionalResolver,
    'flowed::Wait': WaitResolver,
    'flowed::SubFlow': SubFlowResolver,
    'flowed::Repeater': RepeaterResolver,
  };

  /**
   * Flow instance id. Intended to be used for debugging.
   * @type {number}
   */
  public id: number;

  /**
   * Flow specification in plain JS object format.
   */
  protected spec!: FlowSpec;

  /**
   * Current flow state with conditional functionality and state logic (state machine).
   */
  protected state!: FlowState;

  protected states: { [stateKey: string]: FlowState };

  /**
   * Flow run status information. It holds all the data related to the flow execution.
   */
  protected runStatus!: FlowRunStatus;

  /**
   * Callbacks to be called over different task events.
   */
  protected pauseResolve!: (result: GenericValueMap) => void;
  protected pauseReject!: (error: Error) => void;
  protected stopResolve!: (result: GenericValueMap) => void;
  protected stopReject!: (error: Error) => void;
  protected finishResolve!: (result: GenericValueMap) => void;
  protected finishReject!: (error: Error) => void;

  /**
   * Task objects map by code.
   */
  protected tasks!: TaskMap;

  protected taskProvisions!: string[];

  protected configs!: FlowConfigs;

  protected protectedScope = {
    createFinishPromise: this.createFinishPromise,
    execFinishResolve: this.execFinishResolve,
    execFinishReject: this.execFinishReject,

    createPausePromise: this.createPausePromise,
    execPauseResolve: this.execPauseResolve,
    execPauseReject: this.execPauseReject,

    createStopPromise: this.createStopPromise,
    execStopResolve: this.execStopResolve,
    execStopReject: this.execStopReject,

    setExpectedResults: this.setExpectedResults,
    setResolvers: this.setResolvers,
    setState: this.setState,
    setContext: this.setContext,

    initRunStatus: this.initRunStatus,
    startReadyTasks: this.startReadyTasks,
    supplyParameters: this.supplyParameters,
    finished: this.finished,
  };

  public constructor(spec: FlowSpec) {
    this.id = Flow.nextId;
    Flow.nextId++; // @todo Check overflow

    this.states = {
      Ready: new FlowReady(this),
      Running: new FlowRunning(this),
      Finished: new FlowFinished(this),
      Pausing: new FlowPausing(this),
      Paused: new FlowPaused(this),
      Stopping: new FlowStopping(this),
      Stopped: new FlowStopped(this),
    };

    this.parseSpec(spec);
    this.initRunStatus();
  }

  public start(
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: GenericValueMap = {},
  ): Promise<GenericValueMap> {
    return this.state.start(params, expectedResults, resolvers, context, this.protectedScope);
  }

  public pause(): Promise<GenericValueMap> {
    return this.state.pause(this.protectedScope);
  }

  public resume() {
    this.state.resume(this.protectedScope);
  }

  public stop(): Promise<GenericValueMap> {
    return this.state.stop(this.protectedScope);
  }

  public reset() {
    this.state.reset(this.protectedScope);
  }

  // @todo Add a step() feature, for step-by-step execution

  public isRunning() {
    return this.runStatus.runningTasks.length > 0;
  }

  public getSpec() {
    return this.spec;
  }

  public getResults() {
    return this.runStatus.results;
  }

  public getStateInstance(state: FlowStateEnum) {
    return this.states[state];
  }

  protected setState(newState: FlowState) {
    this.state = newState;
  }

  protected createPausePromise(): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>((resolve, reject) => {
      this.pauseResolve = resolve;
      this.pauseReject = reject;
    });
  }

  protected createStopPromise(): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>((resolve, reject) => {
      this.stopResolve = resolve;
      this.stopReject = reject;
    });
  }

  protected createFinishPromise(): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>((resolve, reject) => {
      this.finishResolve = resolve;
      this.finishReject = reject;
    });
  }

  protected execFinishResolve() {
    this.finishResolve(this.runStatus.results);
  }

  protected execFinishReject(error: Error) {
    this.finishReject(error);
  }

  protected execPauseResolve() {
    this.pauseResolve(this.runStatus.results);
  }

  protected execPauseReject(error: Error) {
    this.pauseReject(error);
  }

  protected execStopResolve() {
    this.stopResolve(this.runStatus.results);
  }

  protected execStopReject(error: Error) {
    this.stopReject(error);
  }

  protected setExpectedResults(expectedResults: string[] = []) {
    // Check expected results that cannot be fulfilled
    const missingExpected = expectedResults.filter(r => !this.taskProvisions.includes(r));
    if (missingExpected.length > 0) {
      const msg = `The results [${missingExpected.join(', ')}] are not provided by any task`;
      if (this.configs.throwErrorOnUnsolvableResult) {
        throw new Error(msg);
      } else {
        debug(`Warning: ${msg}`);
      }
    }

    this.runStatus.expectedResults = [...expectedResults];
  }

  protected setResolvers(resolvers: TaskResolverMap = {}) {
    this.runStatus.resolvers = resolvers;
  }

  protected setContext(context: GenericValueMap) {
    this.runStatus.context = context;
  }

  protected supplyParameters(params: GenericValueMap) {
    for (const [paramCode, paramValue] of Object.entries(params)) {
      this.supplyResult(paramCode, paramValue);
    }
  }

  protected startReadyTasks() {
    const readyTasks = this.runStatus.tasksReady;
    this.runStatus.tasksReady = [];

    for (const task of readyTasks) {
      this.runStatus.runningTasks.push(task.getCode());

      const taskResolver = this.getResolverForTask(task);
      task
        .run(
          taskResolver,
          this.runStatus.context,
          !!this.configs.resolverAutomapParams,
          !!this.configs.resolverAutomapResults,
          this.id,
        )
        .then(
          () => {
            this.taskFinished(task);
          },
          (error: Error) => {
            this.taskFinished(task, error, true);
          },
        );

      debug(`[${this.id}] ` + `  ‣ Task ${task.getCode()} started, params:`, task.getParams());
    }
  }

  protected getResolverForTask(task: Task) {
    const name = task.getResolverName();

    // Look for custom resolvers
    const hasCustomResolver = this.runStatus.resolvers.hasOwnProperty(name);
    if (hasCustomResolver) {
      return this.runStatus.resolvers[name];
    }

    // Look for built-in resolvers
    const hasBuiltInResolver = Flow.builtInResolvers.hasOwnProperty(name);
    if (hasBuiltInResolver) {
      return Flow.builtInResolvers[name];
    }

    throw new Error(
      `Task resolver '${name}' for task '${task.getCode()}' has no definition. Defined custom resolvers are: [${Object.keys(
        this.runStatus.resolvers,
      ).join(', ')}].`,
    );
  }

  protected initRunStatus() {
    this.state = FlowReady.getInstance(this);

    this.runStatus = new FlowRunStatus();

    for (const taskCode in this.tasks) {
      if (this.tasks.hasOwnProperty(taskCode)) {
        const task = this.tasks[taskCode];
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

  protected supplyResult(resultName: string, result: any) {
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

  protected parseSpec(spec: FlowSpec) {
    this.spec = spec;
    this.tasks = {};
    this.configs = spec.configs || {};

    const provisions: string[] = [];

    for (const [taskCode, taskSpec] of Object.entries(this.spec.tasks || {})) {
      provisions.push.apply(provisions, taskSpec.provides || []);
      this.tasks[taskCode] = new Task(taskCode, taskSpec);
    }

    // To be used later to check if expectedResults can be fulfilled.
    this.taskProvisions = Array.from(new Set(provisions));
  }

  protected taskFinished(task: Task, error: Error | boolean = false, stopFlowExecutionOnError: boolean = false) {
    const taskSpec = task.getSpec();
    const taskProvisions = taskSpec.provides || [];
    const taskResults = task.getResults();
    const taskCode = task.getCode();
    const hasDefaultResult = taskSpec.hasOwnProperty('defaultResult');

    if (error) {
      debug(`[${this.id}]   ✗ Error in task ${taskCode}, results:`, taskResults);
    } else {
      debug(`[${this.id}]   ✓ Finished task ${taskCode}, results:`, taskResults);
    }

    // Remove the task from running tasks collection
    this.runStatus.runningTasks.splice(this.runStatus.runningTasks.indexOf(taskCode), 1);

    for (const resultName of taskProvisions) {
      if (taskResults.hasOwnProperty(resultName)) {
        this.supplyResult(resultName, taskResults[resultName]);
      } else if (hasDefaultResult) {
        // @todo add defaultResult to repeater task
        this.supplyResult(resultName, taskSpec.defaultResult);
      } else {
        debug(
          `[${
            this.id
          }] ⚠️ Expected value '${resultName}' was not provided by task '${taskCode}' with resolver '${task.getResolverName()}'`,
        );
      }
    }

    if (this.state.getStateCode() === FlowStateEnum.Running) {
      const stopExecution = error && stopFlowExecutionOnError;
      if (!stopExecution) {
        this.startReadyTasks();
      }

      if (!this.isRunning()) {
        this.state.finished(this.protectedScope, error);
      }
    }

    if (!this.isRunning()) {
      const currentState = this.state.getStateCode();

      if (currentState === FlowStateEnum.Pausing) {
        this.state.paused(this.protectedScope);
      } else if (currentState === FlowStateEnum.Stopping) {
        this.state.stopped(this.protectedScope);
      }
    }
  }

  protected finished() {
    this.state.finished(this.protectedScope);
  }

  protected paused() {
    this.state.paused(this.protectedScope);
  }

  protected stopped() {
    this.state.stopped(this.protectedScope);
  }
}
