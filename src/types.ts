import { FlowState } from './engine/flow';
import { Task, TaskMap } from './engine/task';

export interface GenericValueMap {
  [key: string]: any;
}

export class TaskResolver {
  public exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {
    // tslint:disable-next-line:no-empty
    return new Promise<GenericValueMap>(() => {});
  }
}

export type TaskResolverClass = typeof TaskResolver;

export class TaskResolverMap {
  [key: string]: TaskResolverClass;
}

export interface FlowRunStatus {
  state: FlowState;

  runningTasks: string[];

  tasksReady: Task[];

  tasksByReq: {
    [req: string]: TaskMap;
  };

  resolvers: TaskResolverMap;

  expectedResults: string[];

  results: GenericValueMap;

  resolveFlowCallback: (results: GenericValueMap) => void;
}
