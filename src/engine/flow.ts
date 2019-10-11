import { debug as rawDebug } from 'debug';
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
import { FlowSpec } from './specs';
import { Task } from './task';
import { TaskMap } from './task-types';
const debug = rawDebug('flowed:flow');

// @todo Consider replace tslint with eslint

export class Flow implements IFlow {

  public runStatus!: FlowRunStatus;

  /**
   * Flow specification in plain JS object format.
   */
  protected spec!: FlowSpec;

  /**
   * Current flow state with conditional functionality and state logic (state machine).
   */
  protected state!: FlowState;

  /**
   * Task objects map by code.
   */
  protected tasks!: TaskMap;

  public constructor(spec: FlowSpec) {
    this.parseSpec(spec);
    this.initRunStatus();
  }

  public start(
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: GenericValueMap = {},
  ): Promise<GenericValueMap> {
    return this.state.start(params, expectedResults, resolvers, context);
  }

  public pause(): Promise<GenericValueMap> {
    return this.state.pause();
  }

  public resume() {
    this.state.resume();
  }

  public stop(): Promise<GenericValueMap> {
    return this.state.stop();
  }

  public reset() {
    this.state.reset();
  }

  // @todo Add a step() feature, for step-by-step execution

  public isRunning() {
    return this.state.isRunning();
  }

  public getSpec() {
    return this.spec;
  }

  public getResults() {
    return this.state.getResults();
  }

  public createFinishPromise(): Promise<GenericValueMap> {
    return this.state.createFinishPromise();
  }

  public createPausePromise(): Promise<GenericValueMap> {
    return this.state.createPausePromise();
  }

  public createStopPromise(): Promise<GenericValueMap> {
    return this.state.createStopPromise();
  }

  public execFinishResolve() {
    this.state.execFinishResolve();
  }

  public execFinishReject(error: Error) {
    this.state.execFinishReject(error);
  }

  public execPauseResolve() {
    this.state.execPauseResolve();
  }

  public execPauseReject(error: Error) {
    this.state.execPauseReject(error);
  }

  public execStopResolve() {
    this.state.execStopResolve();
  }

  public execStopReject(error: Error) {
    this.state.execStopReject(error);
  }

  public setExpectedResults(expectedResults: string[] = []) {
    this.state.setExpectedResults(expectedResults);
  }

  public setResolvers(resolvers: TaskResolverMap = {}) {
    this.state.setResolvers(resolvers);
  }

  public setContext(context: GenericValueMap) {
    this.state.setContext(context);
  }

  public supplyParameters(params: GenericValueMap) {
    for (const [paramCode, paramValue] of Object.entries(params)) {
      this.state.supplyResult(paramCode, paramValue);
    }
  }

  public startReadyTasks() {
    const readyTasks = this.runStatus.tasksReady;
    this.runStatus.tasksReady = [];

    for (const task of readyTasks) {
      this.runStatus.runningTasks.push(task.getCode());

      const taskResolver = this.state.getResolverForTask(task);
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

  public initRunStatus() {
    this.runStatus = new FlowRunStatus();

    this.tasks = {};

    const provisions: string[] = [];

    for (const [taskCode, taskSpec] of Object.entries(this.spec.tasks || {})) {
      provisions.push.apply(provisions, taskSpec.provides || []);
      this.tasks[taskCode] = new Task(taskCode, taskSpec);
    }

    // To be used later to check if expectedResults can be fulfilled.
    this.runStatus.taskProvisions = Array.from(new Set(provisions));

    this.runStatus.configs = this.spec.configs || {};

    this.runStatus.states = {
      Ready: new FlowReady(this),
      Running: new FlowRunning(this),
      Finished: new FlowFinished(this),
      Pausing: new FlowPausing(this),
      Paused: new FlowPaused(this),
      Stopping: new FlowStopping(this),
      Stopped: new FlowStopped(this),
    };

    this.state = this.runStatus.states[FlowStateEnum.Ready];

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

  public finished(error: Error | boolean = false) {
    this.state.finished(error);
  }

  public setState(newState: FlowStateEnum) {
    this.state = this.state.getStateInstance(newState);
  }

  protected parseSpec(spec: FlowSpec) {
    // @todo process parsing here instead of doing it in initRunStatus()
    this.spec = spec;
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
        this.state.supplyResult(resultName, taskResults[resultName]);
      } else if (hasDefaultResult) {
        // @todo add defaultResult to repeater task
        this.state.supplyResult(resultName, taskSpec.defaultResult);
      } else {
        debug(
          `[${
            this.runStatus.id
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
        this.state.finished(error);
      }
    }

    if (!this.isRunning()) {
      const currentState = this.state.getStateCode();

      if (currentState === FlowStateEnum.Pausing) {
        this.state.paused();
      } else if (currentState === FlowStateEnum.Stopping) {
        this.state.stopped();
      }
    }
  }

  protected paused() {
    this.state.paused();
  }

  protected stopped() {
    this.state.stopped();
  }
}
