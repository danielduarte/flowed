import { Flow } from '..';
import { GenericValueMap, TaskResolverMap } from '../../types';
import { FlowStateEnum, FlowTransitionEnum } from '../flow-types';

export abstract class FlowState {
  public start(
    flow: Flow,
    flowProtectedScope: any,
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: GenericValueMap = {},
  ): Promise<GenericValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Start);
  }

  public finished(flow: Flow, flowProtectedScope: any, error: Error | boolean = false) {
    throw this.createTransitionError(FlowTransitionEnum.Finished);
  }

  public pause(flow: Flow, flowProtectedScope: any): Promise<GenericValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Pause);
  }

  public paused(flow: Flow, flowProtectedScope: any) {
    throw this.createTransitionError(FlowTransitionEnum.Paused);
  }

  public resume(flow: Flow, flowProtectedScope: any) {
    throw this.createTransitionError(FlowTransitionEnum.Resume);
  }

  public stop(flow: Flow, flowProtectedScope: any): Promise<GenericValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Stop);
  }

  public stopped(flow: Flow, flowProtectedScope: any) {
    throw this.createTransitionError(FlowTransitionEnum.Stopped);
  }

  public reset(flow: Flow, flowProtectedScope: any) {
    throw this.createTransitionError(FlowTransitionEnum.Reset);
  }

  public abstract getStateCode(): FlowStateEnum;

  protected createTransitionError(transition: string) {
    return new Error(`Cannot execute transition ${transition} in current state ${this.getStateCode()}.`);
  }
}
