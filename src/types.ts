import { Task } from './engine';
import { ValueQueueManager } from './engine/value-queue-manager';
import { Debugger } from 'debug';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyValue = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TransformTemplate = any;

export interface ValueMap {
  [key: string]: AnyValue;
}

// @deprecated Use ValueMap instead
export type GenericValueMap = ValueMap;

export interface ITaskResolver {
  exec(params: ValueMap, context: ValueMap, task: Task, debug: Debugger): Promise<ValueMap>;
}

export class TaskResolver implements ITaskResolver {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public exec(params: ValueMap, context: ValueMap, task: Task, debug: Debugger): Promise<ValueMap> {
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
  solvedResults: ValueMap;
}

export interface FlowedPlugin {
  resolverLibrary: TaskResolverMap;
}
