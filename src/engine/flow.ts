import { AnyValue, FlowStateEnum, TaskResolverMap, ValueMap } from '../types';
import { FlowRunStatus, SerializedFlowRunStatus } from './flow-run-status';
import { IFlow } from './flow-state/iflow';
import { FlowSpec } from './specs';
import rawDebug from '../debug';
import { FlowManager } from './flow-manager';
import { FlowState } from './flow-state';

export class Flow implements IFlow {
  protected runStatus!: FlowRunStatus;

  public constructor(spec?: FlowSpec, runState?: SerializedFlowRunStatus) {
    this.runStatus = new FlowRunStatus(this, spec ?? {}, runState);
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
  ) {
    return this.runStatus.state.start(params, expectedResults, resolvers, context, options);
  }

  public pause() {
    return this.runStatus.state.pause();
  }

  public resume() {
    return this.runStatus.state.resume();
  }

  public stop() {
    return this.runStatus.state.stop();
  }

  public reset() {
    this.runStatus.state.reset();
  }

  public getSerializableState(): SerializedFlowRunStatus {
    return this.runStatus.state.getSerializableState();
  }

  public debug(formatter: string, ...args: AnyValue[]): void {
    this?.runStatus ? this.runStatus.state.debug(formatter, ...args) : rawDebug('init')(formatter, ...args);
  }

  public log({ n, m, mp, l, e }: { n?: number; m: string; mp?: ValueMap; l?: string; e?: string }): void {
    this.debug(FlowState.formatDebugMessage({ n, m, mp, l, e }), [mp]);
    FlowManager.log(FlowState.createLogEntry({ n, m, mp, l, e }, this.runStatus));
  }
}
