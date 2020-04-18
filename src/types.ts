import { Task } from './engine';
import { ValueQueueManager } from './engine/value-queue-manager';

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

export type AnyValue = any;

export interface ValueMap {
  [key: string]: AnyValue;
}

// @deprecated Use ValueMap instead
export type GenericValueMap = ValueMap;

export class TaskResolver {
  // noinspection JSUnusedLocalSymbols
  public exec(params: ValueMap, context: ValueMap, task: Task, debug: any): Promise<ValueMap> {
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
  solvedReqs: ValueQueueManager;

  solvedResults: {
    [name: string]: any;
  };
}
