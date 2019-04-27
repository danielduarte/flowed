import {TaskSpec} from './flow-specs';
import {GenericValueMap, TaskResolverClass} from "./flow";


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

    public getResolverName() {
        return this.spec.resolver;
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

    public run(taskResolverConstructor: TaskResolverClass): Promise<GenericValueMap> {

        const resolver = new taskResolverConstructor();

        return new Promise(resolve => {

            resolver.exec(this.runStatus.solvedReqs, this).then(resolverValue => {

                // @todo Filter results
                // for (let i = 0; i < this.spec.provides.length; i++) {
                //     const resultName = this.spec.provides[i];
                //     const result = resolverValue[resultName];
                //     this.runStatus.solvedResults[resultName] = result;
                // }
                this.runStatus.solvedResults = resolverValue;

                resolve(this.runStatus.solvedResults);
            });
        });
    }
}

// @todo Check if this is needed
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

    // @todo Check if this is needed
    pendingResults: string[];

    solvedResults: {
        [name: string]: any,
    };
}
