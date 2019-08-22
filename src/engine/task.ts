import { GenericValueMap, TaskResolverClass } from './flow';
import { TaskSpec } from './flow-specs';

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
    return this.spec.resolver.name;
  }

  public resetRunStatus() {
    // @todo Avoid initializing twice.
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
    const reqIndex = this.runStatus.pendingReqs.indexOf(reqName);
    if (reqIndex === -1) {
      throw new Error(`Requirement '${reqName}' for task '${this.code}' is not valid or has already been supplied.`);
    }

    this.runStatus.pendingReqs.splice(reqIndex, 1);
    this.runStatus.solvedReqs[reqName] = value;
  }

  public supplyReqs(reqsMap: GenericValueMap) {
    for (const reqName in reqsMap) {
      if (reqsMap.hasOwnProperty(reqName)) {
        this.supplyReq(reqName, reqsMap[reqName]);
      }
    }
  }

  public run(taskResolverConstructor: TaskResolverClass): Promise<GenericValueMap> {
    const resolver = new taskResolverConstructor();

    return new Promise(resolve => {
      const params = this.mapParamsForResolver(this.runStatus.solvedReqs);

      resolver.exec(params, this).then(resolverValue => {
        const results = this.mapResultsFromResolver(resolverValue);

        // @todo Filter results
        // for (let i = 0; i < this.spec.provides.length; i++) {
        //     const resultName = this.spec.provides[i];
        //     const result = results[resultName];
        //     this.runStatus.solvedResults[resultName] = result;
        // }
        this.runStatus.solvedResults = results;

        resolve(this.runStatus.solvedResults);
      });
    });
  }

  protected parseSpec() {
    this.resetRunStatus();
  }

  protected mapParamsForResolver(solvedReqs: GenericValueMap) {
    const params: GenericValueMap = {};

    for (const resolverParamName in this.spec.resolver.params) {
      if (this.spec.resolver.params.hasOwnProperty(resolverParamName)) {
        const taskParamName = this.spec.resolver.params[resolverParamName];
        const paramValue = solvedReqs[taskParamName];
        params[resolverParamName] = paramValue;
      }
    }

    return params;
  }

  protected mapResultsFromResolver(resolverResults: GenericValueMap) {
    const results: GenericValueMap = {};

    for (const resolverResultName in this.spec.resolver.results) {
      if (this.spec.resolver.results.hasOwnProperty(resolverResultName)) {
        const taskResultName = this.spec.resolver.results[resolverResultName];
        const resolverResult = resolverResults[resolverResultName];
        results[taskResultName] = resolverResult;
      }
    }

    return results;
  }
}

// @todo Check if this is needed
export class TaskResult {}

export interface TaskMap {
  [code: string]: Task;
}

export interface TaskRunStatus {
  pendingReqs: string[];

  solvedReqs: {
    [name: string]: any;
  };

  // @todo Check if this is needed
  pendingResults: string[];

  solvedResults: {
    [name: string]: any;
  };
}
