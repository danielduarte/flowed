import { TaskResolverMap, TaskRunStatus, ValueMap } from '../types';
import { FlowStateEnum, TaskMap } from '../types';
import { Flow } from './flow';
import { FlowFinished, FlowPaused, FlowPausing, FlowReady, FlowRunning, FlowState, FlowStopped, FlowStopping } from './flow-state';
import { ProcessManager } from './process-manager';
import { FlowOptions, FlowSpec } from './specs';
import { Task } from './task';

export class FlowRunStatus {
  /**
   * Flow instance id to be assigned to the next Flow instance. Intended to be used for debugging.
   * @type {number}
   */
  public static nextId = 1;

  public flow: Flow;

  /**
   * Flow instance id. Intended to be used for debugging.
   * @type {number}
   */
  public id: number;

  public processManager: ProcessManager;

  public tasksReady: Task[] = [];

  public tasksByReq: {
    [req: string]: TaskMap;
  } = {};

  public taskProvisions!: string[];

  public resolvers: TaskResolverMap = {};

  public expectedResults: string[] = [];

  public results: ValueMap = {};

  public context: ValueMap = {};

  public runOptions: ValueMap = {};

  /**
   * Callbacks to be called over different task events.
   */
  public finishResolve!: (result: ValueMap) => void;
  public finishReject!: (error: Error) => void;

  public finishPromise!: Promise<ValueMap>;

  public options!: FlowOptions; // @todo Check if this is needed

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

  public constructor(flow: Flow, spec: FlowSpec, runStatus?: any) {
    this.flow = flow;
    this.processManager = new ProcessManager();
    this.id = FlowRunStatus.nextId;
    FlowRunStatus.nextId = (FlowRunStatus.nextId + 1) % Number.MAX_SAFE_INTEGER;

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

    this.initRunStatus(spec, runStatus);
  }

  public initRunStatus(spec: FlowSpec, runState?: SerializedFlowRunStatus) {
    this.spec = spec;
    this.tasks = {};

    const provisions: string[] = [];

    for (const [taskCode, taskSpec] of Object.entries(this.spec.tasks ?? {})) {
      provisions.push(...(taskSpec.provides ?? []));
      this.tasks[taskCode] = new Task(taskCode, taskSpec);
    }

    // To be used later to check if expectedResults can be fulfilled.
    this.taskProvisions = Array.from(new Set(provisions));

    this.options = Object.assign({}, this.spec.configs ?? {}, this.spec.options ?? {});
    if (this.spec.hasOwnProperty('configs')) {
      this.flow.debug("⚠️ DEPRECATED: 'configs' field in flow spec. Use 'options' instead.");
    }

    this.tasksByReq = {};
    this.tasksReady = [];

    for (const task of Object.values(this.tasks)) {
      task.resetRunStatus();

      if (task.isReadyToRun()) {
        this.tasksReady.push(task);
      }

      const taskReqs = task.spec.requires ?? [];
      for (const req of taskReqs) {
        if (!this.tasksByReq.hasOwnProperty(req)) {
          this.tasksByReq[req] = {};
        }
        this.tasksByReq[req][task.code] = task;
      }
    }

    this.results = {};

    if (runState) {
      this.fromSerializable(runState);
    }
  }

  public fromSerializable(runState: SerializedFlowRunStatus) {
    this.id = runState.id;
    this.processManager.nextProcessId = runState.nextProcessId;
    this.processManager.processes = [];
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
    this.options = JSON.parse(JSON.stringify(runState.options));

    for (const [taskCode, taskStatus] of Object.entries(runState.taskStatuses)) {
      this.tasks[taskCode].setSerializableState(taskStatus);
    }
  }

  public toSerializable(): SerializedFlowRunStatus {
    const serialized: SerializedFlowRunStatus = {
      id: this.id,
      nextProcessId: this.processManager.nextProcessId,
      tasksReady: this.tasksReady.map(task => task.code),
      tasksByReq: {},
      taskProvisions: JSON.parse(JSON.stringify(this.taskProvisions)),
      expectedResults: JSON.parse(JSON.stringify(this.expectedResults)),
      results: JSON.parse(JSON.stringify(this.results)),
      context: {},
      options: JSON.parse(JSON.stringify(this.options)),
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
  nextProcessId: number;
  tasksReady: string[];
  tasksByReq: { [req: string]: string[] };
  taskProvisions: string[];
  expectedResults: string[];
  options: FlowOptions;
  results: any; // Must be serializable
  context: any; // Must be serializable
  taskStatuses: { [taskCode: string]: TaskRunStatus }; // Must be serializable
}
