
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
}

export interface TaskParamsMap {

    [code: string]: any;
}
