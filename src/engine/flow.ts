import { debug as rawDebug } from 'debug';
import { FlowSpec } from './flow-specs';
import { Task, TaskMap } from './task';
const debug = rawDebug('yafe:flow');
import { FlowRunStatus, GenericValueMap, TaskResolverMap } from '../types';

export enum FlowState {
  Ready = 'Ready',
  Running = 'Running',
  Finished = 'Finished',
  Pausing = 'Pausing',
  Paused = 'Paused',
  Stopping = 'Stopping',
  Stopped = 'Stopped',
}

export enum FlowTransition {
  Start = 'Start',
  Finished = 'Finished',
  Reset = 'Reset',
  Pause = 'Pause',
  Paused = 'Paused',
  Resume = 'Resume',
  Stop = 'Stop',
  Stopped = 'Stopped',
}

export class Flow {
  protected spec: FlowSpec;

  protected tasks: TaskMap;

  protected runStatus: FlowRunStatus;

  protected transitions: { [state: string]: { [transition: string]: { newState: FlowState; action: () => void } } } = {
    Ready: {
      Start: {
        newState: FlowState.Running,
        action: () => {
          this.startReadyTasks();

          // Notify flow finished when flow has no tasks
          if (Object.keys(this.spec.tasks).length === 0) {
            this.flowFinished();
          }
        },
      },
    },
    Running: {
      Finished: {
        // Automatic transition
        newState: FlowState.Finished,
        action: () => {
          this.runStatus.resolveFlowCallback(this.runStatus.results);
        },
      },
      Paused: {
        newState: FlowState.Pausing,
        action: () => {},
      },
      Stop: {
        newState: FlowState.Stopping,
        action: () => {},
      },
    },
    Finished: {
      Reset: {
        newState: FlowState.Ready,
        action: () => {
          this.initRunStatus();
        },
      },
    },
    Pausing: {
      Paused: {
        // Automatic transition
        newState: FlowState.Paused,
        action: () => {},
      },
    },
    Stopping: {
      Stopped: {
        // Automatic transition
        newState: FlowState.Stopped,
        action: () => {},
      },
    },
    Paused: {
      Stop: {
        newState: FlowState.Stopping,
        action: () => {},
      },
      Resume: {
        newState: FlowState.Running,
        action: () => {},
      },
    },
    Stopped: {
      Reset: {
        newState: FlowState.Ready,
        action: () => {},
      },
    },
  };

  public constructor(spec: FlowSpec) {
    this.spec = spec;
    this.tasks = {};
    this.runStatus = new FlowRunStatus();

    this.parseSpec();
  }

  public start() {
    this.execTransition(FlowTransition.Start);
  }

  public pause() {
    this.execTransition(FlowTransition.Pause);
  }

  public resume() {
    this.execTransition(FlowTransition.Resume);
  }

  public stop() {
    this.execTransition(FlowTransition.Stop);
  }

  public reset() {
    this.execTransition(FlowTransition.Reset);
  }

  public run(
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
  ): Promise<GenericValueMap> {
    // @todo Check if it is not running already

    this.runStatus.expectedResults = [...expectedResults];
    this.runStatus.resolvers = resolvers;

    const resultPromise = new Promise<GenericValueMap>(resolve => {
      this.runStatus.resolveFlowCallback = resolve;
    });

    this.supplyParameters(params);
    this.start();

    return resultPromise;
  }

  public isRunning() {
    return this.runStatus.runningTasks.length > 0;
  }

  public printStatus() {
    // Uncomment to debug
    // console.log('▣ Run status:', this.runStatus);
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

  protected initRunStatus() {
    // @todo Avoid initializing twice.
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

  protected execTransition(transition: FlowTransition) {
    const currentState = this.runStatus.state;
    const possibleTransitions = this.transitions[currentState];
    if (!possibleTransitions.hasOwnProperty(transition)) {
      throw new Error(`Cannot execute transition ${transition} in current state ${currentState}.`);
    }

    const transitionToRun = possibleTransitions[transition];
    this.runStatus.state = transitionToRun.newState;
    transitionToRun.action();
  }

  protected parseSpec() {
    for (const taskCode in this.spec.tasks) {
      if (this.spec.tasks.hasOwnProperty(taskCode)) {
        const taskSpec = this.spec.tasks[taskCode];
        const task = new Task(taskCode, taskSpec);

        this.tasks[taskCode] = task;
      }
    }

    this.initRunStatus();
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

    this.startReadyTasks();

    if (!this.isRunning()) {
      this.flowFinished();
    }
  }

  protected flowFinished() {
    debug('◼ Flow finished with results:', this.runStatus.results);
    this.execTransition(FlowTransition.Finished);
  }
}
