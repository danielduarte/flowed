import { debug as rawDebug } from 'debug';
import { Flow } from '..';
import {
  ConditionalResolver,
  NoopResolver,
  RepeaterResolver,
  SubFlowResolver,
  ThrowErrorResolver,
  WaitResolver,
} from '../../resolver-library';
import { GenericValueMap, TaskResolverMap } from '../../types';
import { FlowRunStatus, FlowStateEnum, FlowTransitionEnum } from '../flow-types';
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
    'flowed::ThrowError': ThrowErrorResolver,
    'flowed::Conditional': ConditionalResolver,
    'flowed::Wait': WaitResolver,
    'flowed::SubFlow': SubFlowResolver,
    'flowed::Repeater': RepeaterResolver,
  };

  public runStatus: FlowRunStatus;

  protected flow: Flow;

  public constructor(flow: Flow) {
    this.flow = flow;
    this.runStatus = flow.runStatus;
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

  public setState(newState: FlowStateEnum) {
    this.flow.setState(newState);
  }

  public initRunStatus() {
    this.flow.initRunStatus();
  }

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

  public startReadyTasks() {
    this.flow.startReadyTasks();
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
    return this.flow.getSpec();
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

  protected createTransitionError(transition: string) {
    return new Error(`Cannot execute transition ${transition} in current state ${this.getStateCode()}.`);
  }
}
