import { debug as rawDebug } from 'debug';
import {
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
import { FlowStateEnum, FlowTransitionEnum, TaskResolverMap, ValueMap } from '../../types';
import { FlowRunStatus } from '../flow-run-status';
import { Task } from '../task';
import { TaskProcess } from '../task-process';
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
    'flowed::Stop': StopResolver,
    'flowed::Pause': PauseResolver,
  };

  protected runStatus: FlowRunStatus;

  public constructor(runStatus: FlowRunStatus) {
    this.runStatus = runStatus;
  }

  public start(params: ValueMap = {}, expectedResults: string[] = [], resolvers: TaskResolverMap = {}, context: ValueMap = {}): Promise<ValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Start);
  }

  public finished(error: Error | boolean = false) {
    throw this.createTransitionError(FlowTransitionEnum.Finished);
  }

  public pause(): Promise<ValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Pause);
  }

  public paused(error: Error | boolean = false) {
    throw this.createTransitionError(FlowTransitionEnum.Paused);
  }

  public resume(): Promise<ValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Resume);
  }

  public stop(): Promise<ValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Stop);
  }

  public stopped(error: Error | boolean = false) {
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

  public isRunning() {
    return this.runStatus.processManager.runningCount() > 0;
  }

  public setExpectedResults(expectedResults: string[] = []) {
    // Check expected results that cannot be fulfilled
    const missingExpected = expectedResults.filter(r => !this.runStatus.taskProvisions.includes(r));
    if (missingExpected.length > 0) {
      const msg = `The results [${missingExpected.join(', ')}] are not provided by any task`;
      if (this.runStatus.options.throwErrorOnUnsolvableResult) {
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

  public setContext(context: ValueMap) {
    this.runStatus.context = {
      $flowed: {
        getResolverByName: this.getResolverByName.bind(this),
        processManager: this.runStatus.processManager,
        flow: this.runStatus.flow,
      },
      ...context,
    };
  }

  public supplyParameters(params: ValueMap) {
    for (const [paramCode, paramValue] of Object.entries(params)) {
      this.runStatus.state.supplyResult(paramCode, paramValue);
    }
  }

  public getSpec() {
    return this.runStatus.spec;
  }

  public createFinishPromise(): Promise<ValueMap> {
    this.runStatus.finishPromise = new Promise<ValueMap>((resolve, reject) => {
      this.runStatus.finishResolve = resolve;
      this.runStatus.finishReject = reject;
    });

    return this.runStatus.finishPromise;
  }

  public getResolverForTask(task: Task) {
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

  public getResolverByName(name: string) {
    // Look for custom resolvers
    const resolvers = this.runStatus.resolvers;
    const hasCustomResolver = resolvers.hasOwnProperty(name);
    if (hasCustomResolver) {
      return resolvers[name];
    }

    // Look for built-in resolvers
    const hasBuiltInResolver = FlowState.builtInResolvers.hasOwnProperty(name);
    if (hasBuiltInResolver) {
      return FlowState.builtInResolvers[name];
    }

    return null;
  }

  public supplyResult(resultName: string, result: any) {
    // Checks if the task result is required by other tasks.
    // If it is not, it is likely a flow output value.
    const suppliesSomeTask = this.runStatus.tasksByReq.hasOwnProperty(resultName);

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

  public getStateInstance(state: FlowStateEnum) {
    return this.runStatus.states[state];
  }

  public startReadyTasks() {
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
      );

      const errorHandler = (error: Error) => {
        this.processFinished(process, error, true);
      };

      process
        .run()
        .then(() => {
          this.processFinished(process, false, true);
        }, errorHandler)
        .catch(errorHandler);

      debug(`[${this.runStatus.id}]   ‣ Task '${task.code}' started, params:`, process.getParams());
    }
  }

  public setState(newState: FlowStateEnum) {
    const prevState = this.runStatus.state.getStateCode();
    this.runStatus.state = this.getStateInstance(newState);
    debug(`[${this.runStatus.id}]   🛈 Changed flow state from '${prevState}' to '${newState}'`);
  }

  public getSerializableState() {
    throw this.createMethodError('getSerializableState');
  }

  protected processFinished(process: TaskProcess, error: Error | boolean = false, stopFlowExecutionOnError: boolean = false) {
    this.runStatus.processManager.removeProcess(process);

    const task = process.task;
    const taskCode = task.code;
    const taskSpec = task.spec;
    const taskProvisions = taskSpec.provides || [];
    const taskResults = task.getResults();
    const hasDefaultResult = taskSpec.hasOwnProperty('defaultResult');

    if (error) {
      debug(`[${this.runStatus.id}]   ✗ Error in task '${taskCode}', results:`, taskResults);
    } else {
      debug(`[${this.runStatus.id}]   ✓ Finished task '${taskCode}', results:`, taskResults);
    }

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
          }] ⚠️ Expected value '${resultName}' was not provided by task '${taskCode}' with resolver '${task.getResolverName()}'. Consider using the task field 'defaultResult' to provide values by default.`,
        );
      }
    }

    this.runStatus.state.postProcessFinished(error);
  }

  protected postProcessFinished(error: Error | boolean = false, stopFlowExecutionOnError: boolean = false) {}

  protected createTransitionError(transition: string) {
    return new Error(`Cannot execute transition ${transition} in current state ${this.getStateCode()}.`);
  }

  protected createMethodError(method: string) {
    return new Error(`Cannot execute method ${method} in current state ${this.getStateCode()}.`);
  }
}
