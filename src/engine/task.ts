import { GenericValueMap, TaskResolverClass } from '../types';
import { TaskSpec } from './specs';
import { TaskRunStatus } from './task-types';

export class Task {
  protected code: string;

  protected spec: TaskSpec;

  protected runStatus!: TaskRunStatus;

  public constructor(code: string, spec: TaskSpec) {
    this.code = code;
    this.spec = spec;

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
    this.runStatus = {
      pendingReqs: [...this.spec.requires],
      solvedReqs: {},
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

  public run(taskResolverConstructor: TaskResolverClass, context: GenericValueMap): Promise<GenericValueMap> {
    const resolver = new taskResolverConstructor();

    return new Promise((resolve, reject) => {
      const params = this.mapParamsForResolver(this.runStatus.solvedReqs);

      resolver.exec(params, context, this).then(
        resolverValue => {
          const results = this.mapResultsFromResolver(resolverValue);

          // @todo Filter results
          // for (let i = 0; i < this.spec.provides.length; i++) {
          //     const resultName = this.spec.provides[i];
          //     const result = results[resultName];
          //     this.runStatus.solvedResults[resultName] = result;
          // }
          this.runStatus.solvedResults = results;

          resolve(this.runStatus.solvedResults);
        },
        (resolverError: Error) => {
          reject(resolverError);
        },
      );
    });
  }

  protected parseSpec() {
    this.resetRunStatus();
  }

  protected mapParamsForResolver(solvedReqs: GenericValueMap) {
    const params: GenericValueMap = {};

    let paramValue;
    for (const [resolverParamName, paramSolvingInfo] of Object.entries(this.spec.resolver.params)) {
      // If it is string, it is a task param name
      if (typeof paramSolvingInfo === 'string') {
        const taskParamName = paramSolvingInfo;
        paramValue = solvedReqs[taskParamName];
      }
      // If it is an object, expect the format { value: <some value> }, and the parameter is the direct value <some value>
      else if (
        typeof paramSolvingInfo === 'object' &&
        paramSolvingInfo !== null &&
        paramSolvingInfo.hasOwnProperty('value')
      ) {
        paramValue = paramSolvingInfo.value;
      }

      params[resolverParamName] = paramValue;
    }

    return params;
  }

  protected mapResultsFromResolver(resolverResults: GenericValueMap) {
    const results: GenericValueMap = {};

    for (const resolverResultName in this.spec.resolver.results) {
      if (this.spec.resolver.results.hasOwnProperty(resolverResultName)) {
        const taskResultName = this.spec.resolver.results[resolverResultName];
        // noinspection UnnecessaryLocalVariableJS
        const resolverResult = resolverResults[resolverResultName];
        results[taskResultName] = resolverResult;
      }
    }

    return results;
  }
}
