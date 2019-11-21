import { GenericValueMap, TaskResolverMap, TaskRunStatus } from '../types';
import { FlowStateEnum, TaskMap } from '../types';
import { FlowFinished, FlowPaused, FlowPausing, FlowReady, FlowRunning, FlowState, FlowStopped, FlowStopping } from './flow-state';
import { FlowConfigs, FlowSpec } from './specs';
import { Task } from './task';

export class TaskProcess {}

export class FlowRunStatus {
  /**
   * Flow instance id to be assigned to the next Flow instance. Intended to be used for debugging.
   * @type {number}
   */
  public static nextId = 1;

  /**
   * Flow instance id. Intended to be used for debugging.
   * @type {number}
   */
  public id: number;

  // @todo To be removed when full support for processes is finished
  public runningTasks: string[] = [];

  public processes: TaskProcess[] = [];

  public tasksReady: Task[] = [];

  public tasksByReq: {
    [req: string]: TaskMap;
  } = {};

  public taskProvisions!: string[];

  public resolvers: TaskResolverMap = {};

  public expectedResults: string[] = [];

  public results: GenericValueMap = {};

  public context: GenericValueMap = {};

  /**
   * Callbacks to be called over different task events.
   */
  public pauseResolve!: (result: GenericValueMap) => void;
  public pauseReject!: (error: Error) => void;
  public stopResolve!: (result: GenericValueMap) => void;
  public stopReject!: (error: Error) => void;
  public finishResolve!: (result: GenericValueMap) => void;
  public finishReject!: (error: Error) => void;

  public configs!: FlowConfigs; // @todo Check if this is needed

  public states: { [stateKey: string]: FlowState };

  /**
   * Flow specification in plain JS object format.
   */
  public spec!: FlowSpec;

  /**
   * Current flow state with conditional functionality and state logic (state machine).
   */
  public state: FlowState;

  /**
   * Task objects map by code.
   */
  public tasks!: TaskMap;

  public constructor(spec: FlowSpec, runStatus?: any) {
    this.id = FlowRunStatus.nextId;
    FlowRunStatus.nextId++; // @todo Check overflow

    this.states = {
      Ready: new FlowReady(this),
      Running: new FlowRunning(this),
      Finished: new FlowFinished(this),
      Pausing: new FlowPausing(this),
      Paused: new FlowPaused(this),
      Stopping: new FlowStopping(this),
      Stopped: new FlowStopped(this),
    };

    this.state = this.states[FlowStateEnum.Ready];

    this.initRunStatus(spec || {}, runStatus);
  }

  public initRunStatus(spec: FlowSpec, runState?: SerializedFlowRunStatus) {
    this.spec = spec;
    this.tasks = {};

    const provisions: string[] = [];

    for (const [taskCode, taskSpec] of Object.entries(this.spec.tasks || {})) {
      provisions.push.apply(provisions, taskSpec.provides || []);
      this.tasks[taskCode] = new Task(taskCode, taskSpec);
    }

    // To be used later to check if expectedResults can be fulfilled.
    this.taskProvisions = Array.from(new Set(provisions));

    this.configs = this.spec.configs || {};

    this.tasksByReq = {};
    this.tasksReady = [];
    for (const taskCode in this.tasks) {
      if (this.tasks.hasOwnProperty(taskCode)) {
        const task = this.tasks[taskCode];
        task.resetRunStatus();

        if (task.isReadyToRun()) {
          this.tasksReady.push(task);
        }

        const taskReqs = task.getSpec().requires || [];
        for (const req of taskReqs) {
          if (!this.tasksByReq.hasOwnProperty(req)) {
            this.tasksByReq[req] = {};
          }
          this.tasksByReq[req][task.getCode()] = task;
        }
      }
    }

    this.results = {};

    if (runState) {
      this.fromSerializable(runState);
    }
  }

  public fromSerializable(runState: SerializedFlowRunStatus) {
    this.id = runState.id;
    this.runningTasks = []; // @todo To be removed when full support for processes is finished
    this.processes = [];
    this.tasksReady = runState.tasksReady.map(taskCode => this.tasks[taskCode]);

    this.tasksByReq = {};
    for (const [req, tasks] of Object.entries(runState.tasksByReq)) {
      this.tasksByReq[req] = tasks.reduce((accum: TaskMap, taskCode: string) => {
        accum[taskCode] = this.tasks[taskCode];
        return accum;
      }, {});
    }

    this.taskProvisions = JSON.parse(JSON.stringify(runState.taskProvisions));
    this.expectedResults = JSON.parse(JSON.stringify(runState.expectedResults));
    this.results = JSON.parse(JSON.stringify(runState.results));
    this.context = JSON.parse(JSON.stringify(runState.context)); // @todo add $flowed to context
    this.configs = JSON.parse(JSON.stringify(runState.configs));

    for (const [taskCode, taskStatus] of Object.entries(runState.taskStatuses)) {
      this.tasks[taskCode].setSerializableState(taskStatus);
    }
  }

  public toSerializable(): SerializedFlowRunStatus {
    const serialized: SerializedFlowRunStatus = {
      id: this.id,
      tasksReady: this.tasksReady.map(task => task.getCode()),
      tasksByReq: {},
      taskProvisions: JSON.parse(JSON.stringify(this.taskProvisions)),
      expectedResults: JSON.parse(JSON.stringify(this.expectedResults)),
      results: JSON.parse(JSON.stringify(this.results)),
      context: {},
      configs: JSON.parse(JSON.stringify(this.configs)),
      taskStatuses: {},
    };

    const serializableContext = Object.assign({}, this.context);
    delete serializableContext.$flowed;
    serialized.context = JSON.parse(JSON.stringify(serializableContext));

    for (const [req, taskMap] of Object.entries(this.tasksByReq)) {
      serialized.tasksByReq[req] = Object.keys(taskMap);
    }

    for (const [taskCode, task] of Object.entries(this.tasks)) {
      serialized.taskStatuses[taskCode] = JSON.parse(JSON.stringify(task.getSerializableState()));
    }

    return serialized;
  }
}

export interface SerializedFlowRunStatus {
  id: number;
  tasksReady: string[];
  tasksByReq: { [req: string]: string[] };
  taskProvisions: string[];
  expectedResults: string[];
  configs: FlowConfigs;
  results: any; // Must be serializable
  context: any; // Must be serializable
  taskStatuses: { [taskCode: string]: TaskRunStatus }; // Must be serializable
}
