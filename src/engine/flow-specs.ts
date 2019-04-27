
export interface FlowSpec {
    tasks: TaskSpecMap;
}

export class TaskSpecMap {

    [code: string]: TaskSpec;
}


export interface TaskSpec {

    requires: string[];

    provides: string[];

    resolver: TaskResolverSpec,
}

export interface TaskResolverSpec {

    name: string;

    params: TaskParamsMap;

    results: TaskResultsMap;
}

export interface TaskParamsMap {

    [code: string]: any;
}

export interface TaskResultsMap {

    [code: string]: any;
}
