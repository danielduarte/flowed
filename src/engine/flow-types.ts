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
import { FlowConfigs, FlowSpec } from './specs';
import { Task } from './task';
import { TaskMap } from './task-types';

export enum FlowStateEnum {
  Ready = 'Ready',
  Running = 'Running',
  Finished = 'Finished',
  Pausing = 'Pausing',
  Paused = 'Paused',
  Stopping = 'Stopping',
  Stopped = 'Stopped',
}

export enum FlowTransitionEnum {
  Start = 'Start',
  Finished = 'Finished',
  Reset = 'Reset',
  Pause = 'Pause',
  Paused = 'Paused',
  Resume = 'Resume',
  Stop = 'Stop',
  Stopped = 'Stopped',
}

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

  public runningTasks: string[] = [];

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

  public configs!: FlowConfigs;

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

  public constructor() {
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
  }
}
