import { debug as rawDebug } from 'debug';
import { GenericValueMap, TaskResolverMap } from '../types';
import { FlowReady, FlowState } from './flow-state';
import { FlowRunStatus, FlowStateEnum } from './flow-types';
import { FlowConfigs, FlowSpec } from './specs';
import { Task } from './task';
import { TaskMap } from './task-types';
const debug = rawDebug('flowed:flow');

export class Flow {
  /**
   * Next flow instance id, used for debugging
   * @type {number}
   */
  public static nextId = 1;

  /**
   * Flow instance id, used for debugging
   * @type {number}
   */
  public id: number;

  protected spec!: FlowSpec;

  protected state!: FlowState;

  protected runStatus!: FlowRunStatus;

  protected pauseResolve!: (result: GenericValueMap) => void;
  protected pauseReject!: (error: Error) => void;

  protected stopResolve!: (result: GenericValueMap) => void;
  protected stopReject!: (error: Error) => void;

  protected finishResolve!: (result: GenericValueMap) => void;
  protected finishReject!: (error: Error) => void;

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
    this.id = Flow.nextId++;

    this.parseSpec(spec);
    this.initRunStatus();
  }

  public start(
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: GenericValueMap = {},
  ): Promise<GenericValueMap> {
    return this.state.start(this, this.protectedScope, params, expectedResults, resolvers, context);
  }

  public pause(): Promise<GenericValueMap> {
    return this.state.pause(this, this.protectedScope);
  }

  public resume() {
    this.state.resume(this, this.protectedScope);
  }

  public stop(): Promise<GenericValueMap> {
    return this.state.stop(this, this.protectedScope);
  }

  public reset() {
    this.state.reset(this, this.protectedScope);
  }

  // @todo Add a step() feature, for debugging

  public isRunning() {
    return this.runStatus.runningTasks.length > 0;
  }

  public getSpec() {
    return this.spec;
  }

  public getResults() {
    return this.runStatus.results;
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
      const msg = `Warning: The results [${missingExpected.join(', ')}] are not provided by any task`;
      debug(msg);
      if (this.configs.throwErrorOnUnsolvableResult) {
        throw new Error(msg);
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
    for (const paramCode in params) {
      if (params.hasOwnProperty(paramCode)) {
        const paramValue = params[paramCode];
        this.supplyResult(paramCode, paramValue);
      }
    }
  }

  protected startReadyTasks() {
    const readyTasks = this.runStatus.tasksReady;
    this.runStatus.tasksReady = [];

    for (const task of readyTasks) {
      const resolverName = task.getResolverName();
      const hasResolver = this.runStatus.resolvers.hasOwnProperty(resolverName);
      if (!hasResolver) {
        throw new Error(
          `Task resolver '${resolverName}' for task '${task.getCode()}' has no definition. Defined resolvers are: [${Object.keys(
            this.runStatus.resolvers,
          ).join(', ')}].`,
        );
      }

      this.runStatus.runningTasks.push(task.getCode());

      const taskResolver = this.runStatus.resolvers[resolverName];
      task.run(taskResolver, this.runStatus.context).then(
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

  protected initRunStatus() {
    this.state = FlowReady.getInstance();

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

    for (const taskCode in this.spec.tasks) {
      if (this.spec.tasks.hasOwnProperty(taskCode)) {
        const taskSpec = this.spec.tasks[taskCode];

        provisions.push.apply(provisions, taskSpec.provides || []);

        this.tasks[taskCode] = new Task(taskCode, taskSpec);
      }
    }

    // To be used later to check if expectedResults can be fulfilled.
    this.taskProvisions = Array.from(new Set(provisions));
  }

  protected taskFinished(task: Task, error: Error | boolean = false, stopFlowExecutionOnError: boolean = false) {
    const taskProvisions = task.getSpec().provides || [];
    const taskResults = task.getResults();
    const taskCode = task.getCode();

    if (error) {
      debug(`[${this.id}]   ✗ Error in task ${taskCode}, results:`, taskResults);
    } else {
      debug(`[${this.id}]   ✓ Finished task ${taskCode}, results:`, taskResults);
    }

    // Remove the task from running tasks collection
    this.runStatus.runningTasks.splice(this.runStatus.runningTasks.indexOf(taskCode), 1);

    const taskSpec = task.getSpec();

    for (const resultName of taskProvisions) {
      if (taskResults.hasOwnProperty(resultName)) {
        this.supplyResult(resultName, taskResults[resultName]);
      } else if (taskSpec.hasOwnProperty('defaultResult')) {
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

    const stopExecution = error && stopFlowExecutionOnError;

    if (this.state.getStateCode() === FlowStateEnum.Running) {
      if (!stopExecution) {
        this.startReadyTasks();
      }

      if (!this.isRunning()) {
        if (!error) {
          this.state.finished(this, this.protectedScope);
        } else {
          this.state.finished(this, this.protectedScope, error);
        }
      }
    }

    if (!this.isRunning()) {
      const currentState = this.state.getStateCode();

      if (currentState === FlowStateEnum.Pausing) {
        this.state.paused(this, this.protectedScope);
      } else if (currentState === FlowStateEnum.Stopping) {
        this.state.stopped(this, this.protectedScope);
      }
    }
  }

  protected finished() {
    this.state.finished(this, this.protectedScope);
  }

  protected paused() {
    this.state.paused(this, this.protectedScope);
  }

  protected stopped() {
    this.state.stopped(this, this.protectedScope);
  }
}
