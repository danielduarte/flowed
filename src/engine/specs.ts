export interface FlowSpec {
  // @todo check if this could be optional
  tasks: TaskSpecMap;
}

export class TaskSpecMap {
  [code: string]: TaskSpec;
}

export interface TaskSpec {
  // @todo check if this could be optional
  requires: string[];

  // @todo check if this could be optional
  provides: string[];

  // @todo check if this could be optional
  resolver: TaskResolverSpec;
}

export interface TaskResolverSpec {
  name: string;

  // @todo check if this could be optional
  params: TaskParamsMap;

  // @todo check if this could be optional
  results: TaskResultsMap;
}

export interface TaskParamsMap {
  [code: string]: any;
}

export interface TaskResultsMap {
  [code: string]: any;
}
