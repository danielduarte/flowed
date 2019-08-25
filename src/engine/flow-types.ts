import { GenericValueMap, TaskResolverMap } from '../types';
import { Task } from './task';
import { TaskMap } from './task-types';

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

export class FlowRunStatus {
  public state: FlowState = FlowState.Ready;

  public runningTasks: string[] = [];

  public tasksReady: Task[] = [];

  public tasksByReq: {
    [req: string]: TaskMap;
  } = {};

  public resolvers: TaskResolverMap = {};

  public expectedResults: string[] = [];

  public results: GenericValueMap = {};
}
