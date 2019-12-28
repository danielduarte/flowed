export interface FlowSpec {
  tasks?: TaskSpecMap;

  // @deprecated Use options instead
  configs?: FlowConfigs;

  options?: FlowOptions;
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
  [code: string]: string | ResolverParamInfoValue | ResolverParamInfoTransform;
}

export interface ResolverParamInfoValue {
  value: any;
}

export interface ResolverParamInfoTransform {
  transform: any;
}

export interface TaskResultsMap {
  [code: string]: any;
}

export interface FlowOptions {
  // Defaults to false
  throwErrorOnUnsolvableResult?: boolean;

  // Defaults to false
  resolverAutomapParams?: boolean;

  // Defaults to false
  resolverAutomapResults?: boolean;
}

// @deprecated Use FlowOptions instead
export type FlowConfigs = FlowOptions;
