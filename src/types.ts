import { Debugger } from 'debug';
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
  exec(params: ValueMap, context: ValueMap, task: Task, debug: Debugger, log: LoggerFn): Promise<ValueMap>;
}

export class TaskResolver implements ITaskResolver {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public exec(params: ValueMap, context: ValueMap, task: Task, debug: Debugger, log: LoggerFn): Promise<ValueMap> {
    return Promise.resolve({});
  }
}

export type TaskResolverFn = (params: ValueMap, context?: ValueMap, task?: Task, debug?: Debugger, log?: LoggerFn) => ValueMap | Promise<ValueMap>;

export type TaskResolverClass = typeof TaskResolver;

export type TaskResolverExecutor = TaskResolverClass | TaskResolverFn;

export class TaskResolverMap {
  [key: string]: TaskResolverExecutor;
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

export interface FlowedLogger {
  log(entry: FlowedLogEntry): void;
}

export interface FlowedLogEntry {
  timestamp: Date;
  level: string; // 'fatal', 'error', 'warning', 'info', 'debug', 'trace'
  eventType: string;
  message: string;
  objectId?: string; // instance Id
  tags?: string[];
  extra?: ValueMap; // free form serializable key-value object
}

export type LoggerFn = ({ n, m, mp, l, e }: { n?: number; m: string; mp?: ValueMap; l?: string; e?: string }) => void;
