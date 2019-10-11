import { Flow } from '..';
import { GenericValueMap, TaskResolverMap } from '../../types';
import { FlowStateEnum, FlowTransitionEnum } from '../flow-types';
import { IFlow } from './iflow';

export abstract class FlowState implements IFlow {
  protected flow: Flow;

  public constructor(flow: Flow) {
    this.flow = flow;
  }

  public start(
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: GenericValueMap = {},
    flowProtectedScope: any,
  ): Promise<GenericValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Start);
  }

  public finished(flowProtectedScope: any, error: Error | boolean = false) {
    throw this.createTransitionError(FlowTransitionEnum.Finished);
  }

  public pause(flowProtectedScope: any): Promise<GenericValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Pause);
  }

  public paused(flowProtectedScope: any) {
    throw this.createTransitionError(FlowTransitionEnum.Paused);
  }

  public resume(flowProtectedScope: any) {
    throw this.createTransitionError(FlowTransitionEnum.Resume);
  }

  public stop(flowProtectedScope: any): Promise<GenericValueMap> {
    throw this.createTransitionError(FlowTransitionEnum.Stop);
  }

  public stopped(flowProtectedScope: any) {
    throw this.createTransitionError(FlowTransitionEnum.Stopped);
  }

  public reset(flowProtectedScope: any) {
    throw this.createTransitionError(FlowTransitionEnum.Reset);
  }

  public abstract getStateCode(): FlowStateEnum;

  protected createTransitionError(transition: string) {
    return new Error(`Cannot execute transition ${transition} in current state ${this.getStateCode()}.`);
  }
}
