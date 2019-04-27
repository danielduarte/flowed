
export interface FlowSpec {
    tasks: TaskSpecMap;
}

export class TaskSpecMap {

    [code: string]: TaskSpec;
}


export interface TaskSpec {

    requires: string[];

    provides: string[];

    resolver: string,
}
