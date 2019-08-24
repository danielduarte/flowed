import { FlowState } from './engine/flow';
import { Task, TaskMap } from './engine/task';

export interface GenericValueMap {
  [key: string]: any;
}

export class TaskResolver {
  public exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>(() => {});
  }
}

export type TaskResolverClass = typeof TaskResolver;

export class TaskResolverMap {
  [key: string]: TaskResolverClass;
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
