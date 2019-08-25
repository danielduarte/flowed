// @todo Check if this is needed
import { Task } from './task';

export class TaskResult {}

export interface TaskMap {
  [code: string]: Task;
}

export interface TaskRunStatus {
  pendingReqs: string[];

  solvedReqs: {
    [name: string]: any;
  };

  // @todo Check if this is needed
  pendingResults: string[];

  solvedResults: {
    [name: string]: any;
  };
}
