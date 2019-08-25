import { Task } from './engine/task';

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
