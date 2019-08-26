import { debug as rawDebug } from 'debug';
import { FlowSpec } from './specs';
import { Task } from './task';
import { TaskMap } from './task-types';
const debug = rawDebug('flowed:flow');
import { GenericValueMap, TaskResolverMap } from '../types';
import { FlowReady } from './flow-state/flow-ready';
import { FlowState } from './flow-state/flow-state';
import { FlowRunStatus, FlowStateEnum, FlowTransitionEnum } from './flow-types';

export class Flow {
  public spec!: FlowSpec;

  public state!: FlowState;

  public runStatus!: FlowRunStatus;

  public finishResolve!: (result: GenericValueMap) => void;
  public pauseResolve!: (result: GenericValueMap) => void;
  public stopResolve!: (result: GenericValueMap) => void;

  protected tasks!: TaskMap;
  protected finishReject!: (result: GenericValueMap) => void;
  protected pauseReject!: (result: GenericValueMap) => void;
  protected stopReject!: (result: GenericValueMap) => void;

  protected transitions: {
    [state: string]: {
      [transition: string]: { newState: FlowStateEnum; action: (args: any[]) => Promise<GenericValueMap> | void };
    };
  } = {
    Ready: {
      Start: {
        newState: FlowStateEnum.Running,
        action: ([params, expectedResults, resolvers]): Promise<GenericValueMap> => {
          return this.state.start(this, params, expectedResults, resolvers);
        },
      },
    },
    Running: {
      Finished: {
        // Automatic transition
        newState: FlowStateEnum.Finished,
        action: (): void => {
          this.state.finished(this);
        },
      },
      Pause: {
        newState: FlowStateEnum.Pausing,
        action: (): Promise<GenericValueMap> => {
          return this.state.pause(this);
        },
      },
      Stop: {
        newState: FlowStateEnum.Stopping,
        action: (): Promise<GenericValueMap> => {
          return this.state.stop(this);
        },
      },
    },
    Finished: {
      Reset: {
        newState: FlowStateEnum.Ready,
        action: () => {
          this.state.reset(this);
        },
      },
    },
    Pausing: {
      Paused: {
        // Automatic transition
        newState: FlowStateEnum.Paused,
        action: (): void => {
          this.state.paused(this);
        },
      },
    },
    Stopping: {
      Stopped: {
        // Automatic transition
        newState: FlowStateEnum.Stopped,
        action: (): void => {
          this.state.stopped(this);
        },
      },
    },
    Paused: {
      Stop: {
        newState: FlowStateEnum.Stopping,
        action: (): Promise<GenericValueMap> => {
          return this.state.stop(this);
        },
      },
      Resume: {
        newState: FlowStateEnum.Running,
        action: (): void => {
          this.state.resume(this);
        },
      },
    },
    Stopped: {
      Reset: {
        newState: FlowStateEnum.Ready,
        action: (): void => {
          this.state.reset(this);
        },
      },
    },
  };

  public constructor(spec: FlowSpec) {
    this.parseSpec(spec);
    this.initRunStatus();
  }

  public createPausePromise(): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>((resolve, reject) => {
      this.pauseResolve = resolve;
      this.pauseReject = reject;
    });
  }

  public createStopPromise(): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>((resolve, reject) => {
      this.stopResolve = resolve;
      this.stopReject = reject;
    });
  }

  public createFinishPromise(): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>((resolve, reject) => {
      this.finishResolve = resolve;
      this.finishReject = reject;
    });
  }

  public start(
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
  ): Promise<GenericValueMap> {
    return this.execTransition(FlowTransitionEnum.Start, [params, expectedResults, resolvers]) as Promise<
      GenericValueMap
    >;
  }

  public pause(): Promise<GenericValueMap> {
    return this.execTransition(FlowTransitionEnum.Pause) as Promise<GenericValueMap>;
  }

  public resume() {
    this.execTransition(FlowTransitionEnum.Resume);
  }

  public stop(): Promise<GenericValueMap> {
    return this.execTransition(FlowTransitionEnum.Stop) as Promise<GenericValueMap>;
  }

  public reset() {
    this.execTransition(FlowTransitionEnum.Reset);
  }

  public run(
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
  ): Promise<GenericValueMap> {
    return this.start(params, expectedResults, resolvers);
  }

  public isRunning() {
    return this.runStatus.runningTasks.length > 0;
  }

  public printStatus() {
    // Uncomment to debug
    // console.log('▣ Run status:', this.runStatus);
  }

  public supplyParameters(params: GenericValueMap) {
    for (const paramCode in params) {
      if (params.hasOwnProperty(paramCode)) {
        const paramValue = params[paramCode];
        this.supplyResult(paramCode, paramValue);
      }
    }
  }

  public startReadyTasks() {
    const readyTasks = this.runStatus.tasksReady;
    this.runStatus.tasksReady = [];

    for (const task of readyTasks) {
      // @todo Check if this should be done after  checking if resolver exists
      this.runStatus.runningTasks.push(task.getCode());

      const hasResolver = this.runStatus.resolvers.hasOwnProperty(task.getResolverName());
      if (!hasResolver) {
        throw new Error(
          `Task resolver '${task.getResolverName()}' for task '${task.getCode()}' has no definition. Defined resolvers are: [${Object.keys(
            this.runStatus.resolvers,
          ).join(', ')}].`,
        );
      }

      const taskResolver = this.runStatus.resolvers[task.getResolverName()];

      task.run(taskResolver).then(() => {
        this.taskFinished(task);
      });

      debug(`► Task ${task.getCode()} started, params:`, task.getParams());
    }
  }

  public initRunStatus() {
    // @todo Avoid initializing twice.

    this.state = FlowReady.getInstance();

    this.runStatus = new FlowRunStatus();

    for (const taskCode in this.tasks) {
      if (this.tasks.hasOwnProperty(taskCode)) {
        const task = this.tasks[taskCode];
        task.resetRunStatus();

        if (task.isReadyToRun()) {
          this.runStatus.tasksReady.push(task);
        }

        const taskReqs = task.getSpec().requires;
        for (const req of taskReqs) {
          if (!this.runStatus.tasksByReq.hasOwnProperty(req)) {
            this.runStatus.tasksByReq[req] = {};
          }
          this.runStatus.tasksByReq[req][task.getCode()] = task;
        }
      }
    }

    this.printStatus();
  }

  public flowFinished() {
    debug('◼ Flow finished with results:', this.runStatus.results);
    this.execTransition(FlowTransitionEnum.Finished);
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

  protected execTransition(transition: FlowTransitionEnum, args: any[] = []): Promise<GenericValueMap> | void {
    const currentState = this.runStatus.state;
    const possibleTransitions = this.transitions[currentState];
    if (!possibleTransitions.hasOwnProperty(transition)) {
      throw new Error(`Cannot execute transition ${transition} in current state ${currentState}.`);
    }

    const transitionToRun = possibleTransitions[transition];
    this.runStatus.state = transitionToRun.newState;
    return transitionToRun.action(args);
  }

  protected parseSpec(spec: FlowSpec) {
    this.spec = spec;
    this.tasks = {};

    for (const taskCode in this.spec.tasks) {
      if (this.spec.tasks.hasOwnProperty(taskCode)) {
        const taskSpec = this.spec.tasks[taskCode];
        this.tasks[taskCode] = new Task(taskCode, taskSpec);
      }
    }
  }

  protected taskFinished(task: Task) {
    const taskProvisions = task.getSpec().provides;
    const taskResults = task.getResults();

    debug(`✔ Finished task ${task.getCode()}, results:`, taskResults);

    // Remove the task from running tasks collection
    this.runStatus.runningTasks.splice(this.runStatus.runningTasks.indexOf(task.getCode()), 1);

    for (const resultName of taskProvisions) {
      const result = taskResults[resultName];
      this.supplyResult(resultName, result);
    }

    this.printStatus();

    if (this.runStatus.state === FlowStateEnum.Running) {
      this.startReadyTasks();

      if (!this.isRunning()) {
        this.flowFinished();
      }
    }

    if (!this.isRunning()) {
      if (this.runStatus.state === FlowStateEnum.Pausing) {
        this.execTransition(FlowTransitionEnum.Paused);
      } else if (this.runStatus.state === FlowStateEnum.Stopping) {
        this.execTransition(FlowTransitionEnum.Stopped);
      }
    }
  }
}
