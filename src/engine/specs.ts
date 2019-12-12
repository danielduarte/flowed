export interface FlowSpec {
  tasks?: TaskSpecMap;

  // @todo Change for options or opts?
  configs?: FlowConfigs;
}

export class TaskSpecMap {
  [code: string]: TaskSpec;
}

export interface TaskSpec {
  requires?: string[];

  provides?: string[];

  defaultResult?: any;

  resolver?: TaskResolverSpec;
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
  // Defaults to false
  throwErrorOnUnsolvableResult?: boolean;

  // Defaults to false
  resolverAutomapParams?: boolean;

  // Defaults to false
  resolverAutomapResults?: boolean;
}
