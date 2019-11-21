import { Task } from './engine';
import { UserValueQueueManager } from './engine/user-value-queue-manager';

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

export interface GenericValueMap {
  [key: string]: any;
}

export class TaskResolver {
  // noinspection JSUnusedLocalSymbols
  public exec(params: GenericValueMap, context: GenericValueMap, task: Task): Promise<GenericValueMap> {
    return Promise.resolve({});
  }
}

export type TaskResolverClass = typeof TaskResolver;

export class TaskResolverMap {
  [key: string]: TaskResolverClass;
}

export interface TaskMap {
  [code: string]: Task;
}

export interface TaskRunStatus {
  pendingReqs: string[];

  solvedReqs: UserValueQueueManager;

  solvedResults: {
    [name: string]: any;
  };
}
