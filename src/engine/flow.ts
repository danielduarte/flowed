import { GenericValueMap, TaskResolverMap } from '../types';
import { FlowRunStatus } from './flow-run-status';
import { IFlow } from './flow-state/iflow';
import { FlowSpec } from './specs';

// @todo Consider replace tslint with eslint

export class Flow implements IFlow {
  protected runStatus!: FlowRunStatus;

  public constructor(spec?: FlowSpec, runState?: any) {
    this.runStatus = new FlowRunStatus(runState);
    this.runStatus.state.initRunStatus(spec || {}, runState);
  }

  public start(
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: GenericValueMap = {},
  ): Promise<GenericValueMap> {
    return this.runStatus.state.start(params, expectedResults, resolvers, context);
  }

  public pause(): Promise<GenericValueMap> {
    return this.runStatus.state.pause();
  }

  public resume() {
    this.runStatus.state.resume();
  }

  public stop(): Promise<GenericValueMap> {
    return this.runStatus.state.stop();
  }

  public reset() {
    this.runStatus.state.reset();
  }

  // @todo Add a step() feature, for step-by-step execution

  public getSerializableState() {
    this.runStatus.state.getSerializableState();
  }
}
