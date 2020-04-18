import { FlowStateEnum, TaskResolverMap, ValueMap } from '../types';
import { FlowRunStatus } from './flow-run-status';
import { IFlow } from './flow-state/iflow';
import { FlowSpec } from './specs';
import rawDebug from '../debug';

export class Flow implements IFlow {
  protected runStatus!: FlowRunStatus;

  public constructor(spec?: FlowSpec, runState?: any) {
    this.runStatus = new FlowRunStatus(this, spec || {}, runState);
  }

  public getStateCode(): FlowStateEnum {
    return this.runStatus.state.getStateCode();
  }

  public start(
    params: ValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: ValueMap = {},
    options: ValueMap = {},
  ): Promise<ValueMap> {
    return this.runStatus.state.start(params, expectedResults, resolvers, context, options);
  }

  public pause(): Promise<ValueMap> {
    return this.runStatus.state.pause();
  }

  public resume(): Promise<ValueMap> {
    return this.runStatus.state.resume();
  }

  public stop(): Promise<ValueMap> {
    return this.runStatus.state.stop();
  }

  public reset() {
    this.runStatus.state.reset();
  }

  public getSerializableState() {
    return this.runStatus.state.getSerializableState();
  }

  public debug(...args: any[]): any {
    return this && this.runStatus ? this.runStatus.state.debug(...args) : rawDebug('init')(...args);
  }
}
