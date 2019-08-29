import { Task } from './task';

export interface TaskMap {
  [code: string]: Task;
}

export interface TaskRunStatus {
  pendingReqs: string[];

  solvedReqs: {
    [name: string]: any;
  };

  solvedResults: {
    [name: string]: any;
  };
}
