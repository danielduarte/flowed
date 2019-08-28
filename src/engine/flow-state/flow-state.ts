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
  ): Promise<GenericValueMap> {
    this.throwTransitionError(FlowTransitionEnum.Start);
    return Promise.resolve({});
  }

  public finished(flow: Flow, flowProtectedScope: any, error: Error | boolean = false) {
    this.throwTransitionError(FlowTransitionEnum.Finished);
  }

  public pause(flow: Flow, flowProtectedScope: any): Promise<GenericValueMap> {
    this.throwTransitionError(FlowTransitionEnum.Pause);
    return Promise.resolve({});
  }

  public paused(flow: Flow, flowProtectedScope: any) {
    this.throwTransitionError(FlowTransitionEnum.Paused);
  }

  public resume(flow: Flow, flowProtectedScope: any) {
    this.throwTransitionError(FlowTransitionEnum.Resume);
  }

  public stop(flow: Flow, flowProtectedScope: any): Promise<GenericValueMap> {
    this.throwTransitionError(FlowTransitionEnum.Stop);
    return Promise.resolve({});
  }

  public stopped(flow: Flow, flowProtectedScope: any) {
    this.throwTransitionError(FlowTransitionEnum.Stopped);
  }

  public reset(flow: Flow, flowProtectedScope: any) {
    this.throwTransitionError(FlowTransitionEnum.Reset);
  }

  public abstract getStateCode(): FlowStateEnum;

  protected throwTransitionError(transition: string) {
    // @todo add test for this error
    throw new Error(`Cannot execute transition ${transition} in current state ${this.getStateCode()}.`);
  }
}
