import {TaskSpec} from './flow-specs';


export class Task {

    protected code: string;

    protected spec: TaskSpec;

    protected runStatus: TaskRunStatus;

    public constructor(code: string, spec: TaskSpec) {
        this.code = code;
        this.spec = spec;
        this.runStatus = {
            pendingReqs: [],
            solvedReqs: {},
            pendingResults: [],
            solvedResults: {},
        };

        this.parseSpec();
    }

    public getCode() {
        return this.code;
    }

    public getSpec() {
        return this.spec;
    }

    protected parseSpec() {
        this.resetRunStatus();
    }

    public resetRunStatus() {
        this.runStatus = {
            pendingReqs: [...this.spec.requires],
            solvedReqs: {},
            pendingResults: [...this.spec.provides],
            solvedResults: {},
        };
    }

    public isReadyToRun() {
        return this.runStatus.pendingReqs.length === 0;
    }

    public getParams(): { [name: string]: any } {
        return this.runStatus.solvedReqs;
    }

    public getResults(): { [name: string]: any } {
        return this.runStatus.solvedResults;
    }

    public supplyReq(reqName: string, value: any) {
        const reqIndex =this.runStatus.pendingReqs.indexOf(reqName);
        if (reqIndex === -1) {
            throw new Error(`Requirement ${reqName} for task ${this.code} is not valid or has already been supplied.`);
        }

        this.runStatus.pendingReqs.splice(reqIndex, 1);
        this.runStatus.solvedReqs[reqName] = value;
    }

    // @todo Check if the type TaskResult is needed
    public run(): Promise<TaskResult> {

        for (let i = 0; i < this.runStatus.pendingResults.length; i++) {
            const resultName = this.runStatus.pendingResults[i];
            const result = resultName.repeat(4);
            this.runStatus.solvedResults[resultName] = result;
        }

        return new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
    }
}

export class TaskResult {
}

export interface TaskMap {

    [code: string]: Task;
}

export interface TaskRunStatus {

    pendingReqs: string[];

    solvedReqs: {
        [name: string]: any,
    };

    pendingResults: string[];

    solvedResults: {
        [name: string]: any,
    };
}
