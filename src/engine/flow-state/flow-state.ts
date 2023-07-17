import { Debugger } from 'debug';
import rawDebug from '../../debug';
import {
  LoopResolver,
  ArrayMapResolver,
  ConditionalResolver,
  EchoResolver,
  NoopResolver,
  PauseResolver,
  RepeaterResolver,
  StopResolver,
  SubFlowResolver,
  ThrowErrorResolver,
  WaitResolver,
} from '../../resolver-library';
import {
  AnyValue,
  FlowedLogEntry,
  FlowStateEnum,
  FlowTransitionEnum,
  OptPromise,
  TaskResolverExecutor,
  TaskResolverMap,
  ValueMap,
} from '../../types';
import { FlowRunStatus, SerializedFlowRunStatus } from '../flow-run-status';
import { Task } from '../task';
import { TaskProcess } from '../task-process';
import { IFlow } from './iflow';
import { FlowManager } from '../flow-manager';

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
    'flowed::Loop': LoopResolver,
    'flowed::ArrayMap': ArrayMapResolver,
    'flowed::Stop': StopResolver,
    'flowed::Pause': PauseResolver,
  };

  protected runStatus: FlowRunStatus;

  public constructor(runStatus: FlowRunStatus) {
    this.runStatus = runStatus;
  }

  public start(
    params: ValueMap,
    expectedResults: string[],
    resolvers: TaskResolverMap,
    context: ValueMap,
    _options: ValueMap = {},
  ): OptPromise<ValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Start);
  }

  public finished(_error: Error | boolean = false): void {
    throw this.createTransitionError(FlowTransitionEnum.Finished);
  }

  public pause(): Promise<ValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Pause);
  }

  public paused(_error: Error | boolean = false): void {
    throw this.createTransitionError(FlowTransitionEnum.Paused);
  }

  public resume(): Promise<ValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Resume);
  }

  public stop(): Promise<ValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Stop);
  }

  public stopped(_error: Error | boolean = false): void {
    throw this.createTransitionError(FlowTransitionEnum.Stopped);
  }

  public reset(): void {
    throw this.createTransitionError(FlowTransitionEnum.Reset);
  }

  public abstract getStateCode(): FlowStateEnum;

  public execFinishResolve(): void {
    this.runStatus.finishResolve(this.runStatus.results);
  }

  public execFinishReject(error: Error): void {
    this.runStatus.finishReject(error);
  }

  public isRunning(): boolean {
    return this.runStatus.processManager.runningCount() > 0;
  }

  public setExpectedResults(expectedResults: string[]): void {
    // Check expected results that cannot be fulfilled
    const missingExpected = expectedResults.filter(r => !this.runStatus.taskProvisions.includes(r));
    if (missingExpected.length > 0) {
      const msg = `The results [${missingExpected.join(', ')}] are not provided by any task`;
      if (this.runStatus.options.throwErrorOnUnsolvableResult) {
        throw new Error(msg);
      } else {
        this.log({ m: msg, l: 'w' });
      }
    }

    this.runStatus.expectedResults = [...expectedResults];
  }

  public getResults(): ValueMap {
    return this.runStatus.results;
  }

  public setResolvers(resolvers: TaskResolverMap): void {
    this.runStatus.resolvers = resolvers;
  }

  public setContext(context: ValueMap): void {
    this.runStatus.context = {
      $flowed: {
        getResolverByName: this.getResolverByName.bind(this),
        getResolvers: this.getResolvers.bind(this),
        processManager: this.runStatus.processManager,
        flow: this.runStatus.flow,
      },
      ...context,
    };
  }

  public setRunOptions(options: ValueMap): void {
    const defaultRunOptions = {
      debugKey: 'flow',
      instanceId: null, // @todo check if it would be better to move this field into logFields
      logFields: {},
    };
    this.runStatus.runOptions = Object.assign(defaultRunOptions, options);
  }

  public supplyParameters(params: ValueMap): void {
    for (const [paramCode, paramValue] of Object.entries(params)) {
      this.runStatus.state.supplyResult(paramCode, paramValue);
    }
  }

  public createFinishPromise(): Promise<ValueMap> {
    this.runStatus.finishPromise = new Promise<ValueMap>((resolve, reject) => {
      this.runStatus.finishResolve = resolve;
      this.runStatus.finishReject = reject;
    });

    return this.runStatus.finishPromise;
  }

  public getResolverForTask(task: Task): TaskResolverExecutor {
    const name = task.getResolverName();

    const resolver = this.getResolverByName(name);

    if (resolver === null) {
      throw new Error(
        `Task resolver '${name}' for task '${task.code}' has no definition. Defined custom resolvers are: [${Object.keys(
          this.runStatus.resolvers,
        ).join(', ')}].`,
      );
    }

    return resolver;
  }

  public getResolverByName(name: string): TaskResolverExecutor | null {
    // Lookup for custom resolvers
    const resolvers = this.runStatus.resolvers;
    const hasCustomResolver = typeof resolvers[name] !== 'undefined';
    if (hasCustomResolver) {
      return resolvers[name];
    }

    // Lookup for plugin resolvers
    const hasPluginResolver = typeof FlowManager.plugins.resolvers[name] !== 'undefined';
    if (hasPluginResolver) {
      return FlowManager.plugins.resolvers[name];
    }

    // Lookup for built-in resolvers
    const hasBuiltInResolver = typeof FlowState.builtInResolvers[name] !== 'undefined';
    if (hasBuiltInResolver) {
      return FlowState.builtInResolvers[name];
    }

    return null;
  }

  public getResolvers(): TaskResolverMap {
    const customResolvers = this.runStatus.resolvers;
    const pluginResolvers = FlowManager.plugins.resolvers;
    const builtInResolver = FlowState.builtInResolvers;

    return {
      ...builtInResolver,
      ...pluginResolvers,
      ...customResolvers,
    };
  }

  public supplyResult(resultName: string, result: AnyValue): void {
    // Checks if the task result is required by other tasks.
    // If it is not, it is likely a flow output value.
    const suppliesSomeTask = typeof this.runStatus.tasksByReq[resultName] !== 'undefined';

    if (suppliesSomeTask) {
      const suppliedTasks = this.runStatus.tasksByReq[resultName];
      const suppliedTaskCodes = Object.keys(suppliedTasks);
      for (const taskCode of suppliedTaskCodes) {
        const suppliedTask = suppliedTasks[taskCode];

        suppliedTask.supplyReq(resultName, result);

        // @todo Possible optimization: supply all results first, then check ready tasks
        // @todo This 'if' could actually be a 'while', in case more than one instance of the same task get ready
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

  public getStateInstance(state: FlowStateEnum): FlowState {
    return this.runStatus.states[state];
  }

  public startReadyTasks(): void {
    const readyTasks = this.runStatus.tasksReady;
    this.runStatus.tasksReady = [];

    for (const task of readyTasks) {
      const taskResolver = this.runStatus.state.getResolverForTask(task);

      const process = this.runStatus.processManager.createProcess(
        task,
        taskResolver,
        this.runStatus.context,
        !!this.runStatus.options.resolverAutomapParams,
        !!this.runStatus.options.resolverAutomapResults,
        this.runStatus.id,
        this.debug as Debugger,
        this.log.bind(this),
      );

      const errorHandler = (error: Error): void => {
        this.processFinished(process, error, true);
      };

      process
        .run()
        .then(() => {
          this.processFinished(process, false, true);
        }, errorHandler)
        .catch(errorHandler);

      this.log({
        n: this.runStatus.id,
        m: `Task '${task.code}(${task.getResolverName()})' started, params: %O`,
        mp: process.getParams(),
        e: 'TS',
        pid: process.pid,
        task: { code: task.code, type: task.getResolverName() },
      });
    }
  }

  public setState(newState: FlowStateEnum): void {
    const prevState = this.runStatus.state.getStateCode();
    this.runStatus.state = this.getStateInstance(newState);
    this.log({ n: this.runStatus.id, m: `Changed flow state from '${prevState}' to '${newState}'`, l: 'd', e: 'FC' });
  }

  public getSerializableState(): SerializedFlowRunStatus {
    throw this.createMethodError('getSerializableState');
  }

  protected processFinished(process: TaskProcess, error: Error | boolean, stopFlowExecutionOnError: boolean): void {
    this.runStatus.processManager.removeProcess(process);

    const task = process.task;
    const taskCode = task.code;
    const taskSpec = task.spec;
    const taskProvisions = taskSpec.provides ?? [];
    const taskResults = task.getResults();
    const hasDefaultResult = Object.prototype.hasOwnProperty.call(taskSpec, 'defaultResult');

    if (error) {
      this.log({
        n: this.runStatus.id,
        m: `Error in task '${taskCode}', results: %O`,
        mp: taskResults,
        l: 'e',
        e: 'TF',
        pid: process.pid,
        task: { code: task.code, type: task.getResolverName() },
      });
    } else {
      this.log({
        n: this.runStatus.id,
        m: `Finished task '${taskCode}', results: %O`,
        mp: taskResults,
        e: 'TF',
        pid: process.pid,
        task: { code: task.code, type: task.getResolverName() },
      });
    }

    for (const resultName of taskProvisions) {
      if (Object.prototype.hasOwnProperty.call(taskResults, resultName)) {
        this.runStatus.state.supplyResult(resultName, taskResults[resultName]);
      } else if (hasDefaultResult) {
        // @todo add defaultResult to repeater task
        this.runStatus.state.supplyResult(resultName, taskSpec.defaultResult);
      } else {
        this.log({
          n: this.runStatus.id,
          m: `Expected value '${resultName}' was not provided by task '${taskCode}' with resolver '${task.getResolverName()}'. Consider using the task field 'defaultResult' to provide values by default.`,
          l: 'w',
        });
      }
    }

    this.runStatus.state.postProcessFinished(error, stopFlowExecutionOnError);
  }

  protected postProcessFinished(_error: Error | boolean, _stopFlowExecutionOnError: boolean): void {}

  protected createTransitionError(transition: string): Error {
    return new Error(`Cannot execute transition ${transition} in current state ${this.getStateCode()}.`);
  }

  protected createMethodError(method: string): Error {
    return new Error(`Cannot execute method ${method} in current state ${this.getStateCode()}.`);
  }

  public debug(formatter: string, ...args: AnyValue[]): void {
    const scope = this?.runStatus && typeof this.runStatus.runOptions.debugKey === 'string' ? this.runStatus.runOptions.debugKey : 'init';
    rawDebug(scope)(formatter, ...args);
  }

  public static formatDebugMessage({ n, m, l, e }: { n?: number; m: string; mp?: ValueMap; l?: string; e?: string }): string {
    const levelIcon = l === 'w' ? '⚠️ ' : '';
    const eventIcons = { FS: '▶ ', FF: '✔ ', TS: '  ‣ ', TF: '  ✓ ', FC: '  ⓘ ', FT: '◼ ', FP: '⏸ ' };
    let eventIcon = (eventIcons as any)[e || ''] ?? ''; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (e === 'TF' && ['e', 'f'].includes(l || '')) {
      eventIcon = '  ✗';
    } else if (e === 'FF' && ['e', 'f'].includes(l || '')) {
      eventIcon = '✘';
    }
    const icon = levelIcon + eventIcon;

    return `[${n}] ${icon}${m}`;
  }

  public static createLogEntry(
    { n, m, mp, l, e, pid, task }: { n?: number; m: string; mp?: ValueMap; l?: string; e?: string; pid?: number; task?: AnyValue },
    flowStatus?: FlowRunStatus,
  ): FlowedLogEntry {
    const formatLevel = (level: string | undefined) => {
      level = level || 'i';
      switch (level) {
        case 'e':
          return 'error';
        case 'w':
          return 'warning';
        case 'i':
          return 'info';
        case 'd':
          return 'debug';
        default:
          throw new Error(`Not supported error level: "${level}"`);
      }
    };

    const formatEvent = (event: string | undefined) => {
      switch (event) {
        case 'TS':
          return 'Task.Started';
        case 'TF':
          return 'Task.Finished';
        case 'FC':
          return 'Flow.StateChanged';
        case 'FS':
          return 'Flow.Started';
        case 'FF':
          return 'Flow.Finished';
        case 'FT':
          return 'Flow.Stopped';
        case 'FP':
          return 'Flow.Paused';
        default:
          return 'General';
      }
    };

    const formatMsg = (templateMsg: string, param: ValueMap | undefined) => {
      if (param) {
        // @todo Take into account that 'param' could have circular references, hence JSON.stringify(param) could fail
        const paramStr = JSON.stringify(param);
        return templateMsg.replace('%O', paramStr.length > 100 ? paramStr.slice(0, 97) + '...' : paramStr);
      }
      return templateMsg;
    };

    let auditLogEntry: FlowedLogEntry = {
      level: formatLevel(l),
      eventType: formatEvent(e),
      message: formatMsg(m, mp),
      timestamp: new Date(),
      extra: {
        pid,
        task,
        debugId: n,
        values: JSON.stringify(mp),
      },
    };

    if (flowStatus) {
      auditLogEntry.objectId = flowStatus.runOptions.instanceId;
      auditLogEntry = Object.assign(flowStatus.runOptions.logFields, auditLogEntry);
    }

    return auditLogEntry;
  }

  public log({ n, m, mp, l, e, pid, task }: { n?: number; m: string; mp?: ValueMap; l?: string; e?: string; pid?: number; task?: AnyValue }): void {
    this.debug(FlowState.formatDebugMessage({ n, m, mp, l, e }), [mp]);
    FlowManager.log(FlowState.createLogEntry({ n, m, mp, l, e, pid, task }, this.runStatus));
  }
}
