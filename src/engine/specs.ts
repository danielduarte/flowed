export interface FlowSpec {

  tasks?: TaskSpecMap;

  configs?: FlowConfigs;
}

export class TaskSpecMap {
  [code: string]: TaskSpec;
}

export interface TaskSpec {

  requires?: string[];

  provides?: string[];

  // @todo check if this could be optional
  resolver: TaskResolverSpec;
}

export interface TaskResolverSpec {
  name: string;

  params?: TaskParamsMap;

  results?: TaskResultsMap;
}

export interface TaskParamsMap {
  [code: string]: any;
}

export interface TaskResultsMap {
  [code: string]: any;
}

export interface FlowConfigs {
  throwErrorOnUnsolvableResult?: boolean;
}
