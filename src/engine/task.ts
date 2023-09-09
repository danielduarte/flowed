import { LoggerFn, TaskRunStatus, ValueMap, AnyValue } from '../types';
import { ResolverParamInfoTransform, ResolverParamInfoValue, TaskSpec } from './specs';
import { ValueQueueManager } from './value-queue-manager';
import { SerializedFlowRunStatus } from './flow-run-status';

const ST = require('flowed-st');

export class Task {
  public runStatus!: TaskRunStatus;

  public constructor(
    public code: string,
    public spec: TaskSpec,
  ) {
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

  public mapParamsForResolver(solvedReqs: ValueMap, automap: boolean, flowId: number, log: LoggerFn): ValueMap {
    const params: ValueMap = {};

    let resolverParams = this.spec.resolver?.params ?? {};

    if (automap) {
      const requires = this.spec.requires ?? [];
      // When `Object.fromEntries()` is available in ES, use it instead of the following solution
      // @todo Add test with requires = []
      const autoMappedParams = requires.map(req => ({ [req]: req })).reduce((accum, peer) => Object.assign(accum, peer), {});
      log({ n: flowId, m: `  ⓘ Auto-mapped resolver params in task '${this.code}': %O`, mp: autoMappedParams, l: 'd' });
      resolverParams = Object.assign(autoMappedParams, resolverParams);
    }

    let paramValue;
    for (const [resolverParamName, paramSolvingInfo] of Object.entries(resolverParams)) {
      // @todo Add test to check the case when a loop round does not set anything and make sure next value (`paramValue`) is undefined by default

      if (typeof paramSolvingInfo === 'string') {
        // If it is string, it is a task param name
        paramValue = solvedReqs[paramSolvingInfo];
      } else if (Object.prototype.hasOwnProperty.call(paramSolvingInfo, 'value')) {
        // If it is an object, expect the format { value: <some value> } or { transform: <some template> }
        // Implicit condition: typeof paramSolvingInfo === 'object' && paramSolvingInfo !== null
        // Direct value pre-processor
        paramValue = (paramSolvingInfo as ResolverParamInfoValue).value;
      } else {
        // Template transform pre-processor
        // Implicit condition: paramSolvingInfo.hasOwnProperty('transform')
        const template = (paramSolvingInfo as ResolverParamInfoTransform).transform;
        paramValue = ST.select(solvedReqs).transformWith(template).root();
      }

      params[resolverParamName] = paramValue;
    }

    return params;
  }

  public mapResultsFromResolver(solvedResults: ValueMap, automap: boolean, flowId: number, log: LoggerFn): ValueMap {
    if (typeof solvedResults !== 'object') {
      throw new Error(
        `Expected resolver for task '${
          this.code
        }' to return an object or Promise that resolves to object. Returned value is of type '${typeof solvedResults}'.`,
      );
    }

    const results: ValueMap = {};

    let resolverResults = this.spec.resolver?.results ?? {};

    if (automap) {
      const provides = this.spec.provides ?? [];
      // @todo Add test with provides = []
      const autoMappedResults = provides.reduce((acc: ValueMap, prov) => Object.assign(acc, { [prov]: prov }), {});
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
