import { debug as rawDebug } from 'debug';
import { GenericValueMap, TaskResolverClass } from '../types';
import { TaskRunStatus } from '../types';
import { TaskSpec } from './specs';
const debug = rawDebug('flowed:flow');

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
      pendingReqs: [...(this.spec.requires || [])],
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

  public run(
    taskResolverConstructor: TaskResolverClass,
    context: GenericValueMap,
    automapParams: boolean,
    automapResults: boolean,
    flowId: number,
  ): Promise<GenericValueMap> {
    const resolver = new taskResolverConstructor();

    return new Promise((resolve, reject) => {
      const params = this.mapParamsForResolver(this.runStatus.solvedReqs, automapParams, flowId);

      resolver.exec(params, context, this).then(
        resolverValue => {
          const results = this.mapResultsFromResolver(resolverValue, automapResults, flowId);
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

  protected mapParamsForResolver(solvedReqs: GenericValueMap, automap: boolean, flowId: number) {
    const params: GenericValueMap = {};

    let resolverParams = this.spec.resolver.params || {};

    if (automap) {
      const requires = this.spec.requires || [];
      // When `Object.fromEntries()` is available in ES, use it instead of the following solution
      const automappedParams = requires
        .map(req => ({ [req]: req }))
        .reduce((accum, peer) => Object.assign(accum, peer));
      debug(`[${flowId}]     Automapped resolver params in task ${this.getCode()}:`, automappedParams);
      resolverParams = Object.assign(automappedParams, resolverParams);
    }

    let paramValue;
    for (const [resolverParamName, paramSolvingInfo] of Object.entries(resolverParams)) {
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

  protected mapResultsFromResolver(solvedResults: GenericValueMap, automap: boolean, flowId: number) {
    const results: GenericValueMap = {};

    let resolverResults = this.spec.resolver.results || {};

    if (automap) {
      const provides = this.spec.provides || [];
      // When `Object.fromEntries()` is available in ES, use it instead of the following solution
      const automappedResults = provides
        .map(prov => ({ [prov]: prov }))
        .reduce((accum, peer) => Object.assign(accum, peer));
      debug(`[${flowId}]     Automapped resolver results in task ${this.getCode()}:`, automappedResults);
      resolverResults = Object.assign(automappedResults, resolverResults);
    }

    for (const [resolverResultName, taskResultName] of Object.entries(resolverResults)) {
      if (solvedResults.hasOwnProperty(resolverResultName)) {
        results[taskResultName] = solvedResults[resolverResultName];
      }
    }

    return results;
  }
}
