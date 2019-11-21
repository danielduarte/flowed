import { debug as rawDebug } from 'debug';
import { GenericValueMap, TaskResolverClass, TaskRunStatus } from '../types';
import { TaskSpec } from './specs';
import { TaskProcess } from './task-process';
import { UserValueQueueManager } from './user-value-queue-manager';
const debug = rawDebug('flowed:flow');
// tslint:disable-next-line:no-var-requires
const ST = require('stjs');

export class Task {
  // @todo convert to protected
  public runStatus!: TaskRunStatus;

  protected code: string;

  protected spec: TaskSpec;

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

  public getSerializableState() {
    return this.runStatus;
  }

  public setSerializableState(runStatus: TaskRunStatus) {
    runStatus.solvedReqs = Object.assign(Object.create(UserValueQueueManager.prototype), runStatus.solvedReqs);
    this.runStatus = runStatus;
  }

  public resetRunStatus() {
    const reqs = [...(this.spec.requires || [])];

    this.runStatus = {
      pendingReqs: reqs,
      solvedReqs: new UserValueQueueManager(reqs),
      solvedResults: {},
    };
  }

  public isReadyToRun() {
    return this.runStatus.pendingReqs.length === 0;
  }

  public getParams(): { [name: string]: any } {
    return this.runStatus.solvedReqs.topAll();
  }

  public getResults(): { [name: string]: any } {
    return this.runStatus.solvedResults;
  }

  public supplyReq(reqName: string, value: any) {
    const reqIndex = this.runStatus.pendingReqs.indexOf(reqName);
    if (reqIndex === -1) {
      // This can only happen if supplyReq is called manually by the user. The flow will never call with an invalid reqName.
      throw new Error(`Requirement '${reqName}' for task '${this.code}' is not valid or has already been supplied.`);
    }

    this.runStatus.pendingReqs.splice(reqIndex, 1);
    this.runStatus.solvedReqs.push(reqName, value);
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
    const process = new TaskProcess(taskResolverConstructor, context, automapParams, automapResults, flowId, this);

    return process.run();
  }

  // @todo convert to protected
  public mapParamsForResolver(solvedReqs: GenericValueMap, automap: boolean, flowId: number) {
    const params: GenericValueMap = {};

    let resolverParams = this.spec.resolver.params || {};

    if (automap) {
      const requires = this.spec.requires || [];
      // When `Object.fromEntries()` is available in ES, use it instead of the following solution
      // @todo Add test with requires = []
      const automappedParams = requires.map(req => ({ [req]: req })).reduce((accum, peer) => Object.assign(accum, peer), {});
      debug(`[${flowId}]   🛈 Automapped resolver params in task '${this.getCode()}':`, automappedParams);
      resolverParams = Object.assign(automappedParams, resolverParams);
    }

    let paramValue;
    for (const [resolverParamName, paramSolvingInfo] of Object.entries(resolverParams)) {
      // Added to make sure default value is undefined
      // @todo Add test to check the case when a loop round does not set anything and make sure next value is undefined by default
      paramValue = undefined;

      // If it is string, it is a task param name
      if (typeof paramSolvingInfo === 'string') {
        const taskParamName = paramSolvingInfo;
        paramValue = solvedReqs[taskParamName];
      }

      // If it is an object, expect the format { [value: <some value>], [transform: <some template>] }
      else if (typeof paramSolvingInfo === 'object' && paramSolvingInfo !== null) {
        // Direct value pre-processor
        if (paramSolvingInfo.hasOwnProperty('value')) {
          paramValue = paramSolvingInfo.value;
        }

        // Template transform pre-processor
        else if (paramSolvingInfo.hasOwnProperty('transform')) {
          const template = paramSolvingInfo.transform;
          paramValue = ST.select(solvedReqs)
            .transformWith(template)
            .root();
        }
      }

      params[resolverParamName] = paramValue;
    }

    return params;
  }

  // @todo convert to protected
  public mapResultsFromResolver(solvedResults: GenericValueMap, automap: boolean, flowId: number) {
    if (typeof solvedResults !== 'object') {
      throw new Error(
        `Expected resolver for task '${this.getCode()}' to return an object or Promise that resolves to object. Returned value is of type '${typeof solvedResults}'.`,
      );
    }

    const results: GenericValueMap = {};

    let resolverResults = this.spec.resolver.results || {};

    if (automap) {
      const provides = this.spec.provides || [];
      // When `Object.fromEntries()` is available in ES, use it instead of the following solution
      // @todo Add test with provides = []
      const automappedResults = provides.map(prov => ({ [prov]: prov })).reduce((accum, peer) => Object.assign(accum, peer), {});
      debug(`[${flowId}]   🛈 Automapped resolver results in task '${this.getCode()}':`, automappedResults);
      resolverResults = Object.assign(automappedResults, resolverResults);
    }

    for (const [resolverResultName, taskResultName] of Object.entries(resolverResults)) {
      if (solvedResults.hasOwnProperty(resolverResultName)) {
        results[taskResultName] = solvedResults[resolverResultName];
      }
    }

    return results;
  }

  protected parseSpec() {
    this.resetRunStatus();
  }
}
