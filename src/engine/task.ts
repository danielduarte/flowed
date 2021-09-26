import { LoggerFn, TaskRunStatus, ValueMap, AnyValue } from '../types';
import { ResolverParamInfoTransform, ResolverParamInfoValue, TaskSpec } from './specs';
import { ValueQueueManager } from './value-queue-manager';
import { SerializedFlowRunStatus } from './flow-run-status';
// tslint:disable-next-line:no-var-requires
const ST = require('flowed-st');

export class Task {
  public runStatus!: TaskRunStatus;

  public constructor(public code: string, public spec: TaskSpec) {
    this.parseSpec();
  }

  public getResolverName(): string {
    return (this.spec.resolver ?? { name: 'flowed::Noop' }).name;
  }

  public getSerializableState(): SerializedFlowRunStatus {
    const result = JSON.parse(JSON.stringify(this.runStatus));
    result.solvedReqs = this.runStatus.solvedReqs.toSerializable();
    return result;
  }

  public setSerializableState(runStatus: TaskRunStatus): void {
    this.runStatus = JSON.parse(JSON.stringify(runStatus));
    this.runStatus.solvedReqs = ValueQueueManager.fromSerializable(runStatus.solvedReqs);
  }

  public resetRunStatus(): void {
    const reqs = [...(this.spec.requires ?? [])];

    this.runStatus = {
      solvedReqs: new ValueQueueManager(reqs),
      solvedResults: {},
    };
  }

  public isReadyToRun(): boolean {
    return this.runStatus.solvedReqs.allHaveContent();
  }

  public getResults(): ValueMap {
    return this.runStatus.solvedResults;
  }

  public supplyReq(reqName: string, value: AnyValue): void {
    const reqIndex = (this.spec.requires ?? []).indexOf(reqName);
    if (reqIndex === -1) {
      // This can only happen if supplyReq is called manually by the user. The flow will never call with an invalid reqName.
      throw new Error(`Requirement '${reqName}' for task '${this.code}' is not valid.`);
    }

    this.runStatus.solvedReqs.push(reqName, value);
  }

  public supplyReqs(reqsMap: ValueMap): void {
    for (const [reqName, req] of Object.entries(reqsMap)) {
      this.supplyReq(reqName, req);
    }
  }

  // @todo convert to protected
  public mapParamsForResolver(solvedReqs: ValueMap, automap: boolean, flowId: number, log: LoggerFn): ValueMap {
    const params: ValueMap = {};

    let resolverParams = (this.spec.resolver ?? {}).params ?? {};

    if (automap) {
      const requires = this.spec.requires ?? [];
      // When `Object.fromEntries()` is available in ES, use it instead of the following solution
      // @todo Add test with requires = []
      const autoMappedParams = requires.map(req => ({ [req]: req })).reduce((accum, peer) => Object.assign(accum, peer), {}); // @todo improve this expression
      log({ n: flowId, m: `  ⓘ Auto-mapped resolver params in task '${this.code}': %O`, mp: autoMappedParams, l: 'd' });
      resolverParams = Object.assign(autoMappedParams, resolverParams);
    }

    let paramValue;
    for (const [resolverParamName, paramSolvingInfo] of Object.entries(resolverParams)) {
      // @todo Add test to check the case when a loop round does not set anything and make sure next value is undefined by default
      // Added to make sure default value is undefined
      paramValue = undefined;

      // If it is string, it is a task param name
      if (typeof paramSolvingInfo === 'string') {
        const taskParamName = paramSolvingInfo;
        paramValue = solvedReqs[taskParamName];
      }

      // If it is an object, expect the format { [value: <some value>], [transform: <some template>] }
      else {
        // Implicit case: if (typeof paramSolvingInfo === 'object' && paramSolvingInfo !== null)
        // Direct value pre-processor
        if (Object.prototype.hasOwnProperty.call(paramSolvingInfo, 'value')) {
          paramValue = (paramSolvingInfo as ResolverParamInfoValue).value;
        }

        // Template transform pre-processor
        else {
          // Implicit case: if (paramSolvingInfo.hasOwnProperty('transform'))
          const template = (paramSolvingInfo as ResolverParamInfoTransform).transform;
          paramValue = ST.select(solvedReqs).transformWith(template).root();
        }
      }

      params[resolverParamName] = paramValue;
    }

    return params;
  }

  // @todo convert to protected
  public mapResultsFromResolver(solvedResults: ValueMap, automap: boolean, flowId: number, log: LoggerFn): ValueMap {
    if (typeof solvedResults !== 'object') {
      throw new Error(
        `Expected resolver for task '${
          this.code
        }' to return an object or Promise that resolves to object. Returned value is of type '${typeof solvedResults}'.`,
      );
    }

    const results: ValueMap = {};

    let resolverResults = (this.spec.resolver ?? {}).results ?? {};

    if (automap) {
      const provides = this.spec.provides ?? [];
      // When `Object.fromEntries()` is available in ES, use it instead of the following solution
      // @todo Add test with provides = []
      const autoMappedResults = provides.map(prov => ({ [prov]: prov })).reduce((accum, peer) => Object.assign(accum, peer), {}); // @todo improve this expression
      log({ n: flowId, m: `  ⓘ Auto-mapped resolver results in task '${this.code}': %O`, mp: autoMappedResults, l: 'd' });

      resolverResults = Object.assign(autoMappedResults, resolverResults);
    }

    for (const [resolverResultName, taskResultName] of Object.entries(resolverResults)) {
      if (Object.prototype.hasOwnProperty.call(solvedResults, resolverResultName)) {
        results[taskResultName] = solvedResults[resolverResultName];
      }
    }

    return results;
  }

  protected parseSpec(): void {
    this.resetRunStatus();
  }
}
