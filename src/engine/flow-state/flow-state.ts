import { Flow } from '..';
import { GenericValueMap, TaskResolverMap } from '../../types';
import { FlowTransitionEnum } from '../flow-types';

export abstract class FlowState {
  public start(
    flow: Flow,
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
  ): Promise<GenericValueMap> {
    this.throwTransitionError(FlowTransitionEnum.Start);
    return Promise.resolve({});
  }

  public finished(flow: Flow) {
    this.throwTransitionError(FlowTransitionEnum.Finished);
  }

  public pause(flow: Flow): Promise<GenericValueMap> {
    this.throwTransitionError(FlowTransitionEnum.Pause);
    return Promise.resolve({});
  }

  public paused(flow: Flow) {
    this.throwTransitionError(FlowTransitionEnum.Paused);
  }

  public resume(flow: Flow) {
    this.throwTransitionError(FlowTransitionEnum.Resume);
  }

  public stop(flow: Flow): Promise<GenericValueMap> {
    this.throwTransitionError(FlowTransitionEnum.Stop);
    return Promise.resolve({});
  }

  public stopped(flow: Flow) {
    this.throwTransitionError(FlowTransitionEnum.Stopped);
  }

  public reset(flow: Flow) {
    this.throwTransitionError(FlowTransitionEnum.Reset);
  }

  protected throwTransitionError(transition: string): void {
    // @todo add test for this error
    throw new Error(`Cannot execute transition ${transition} in current state ${this.constructor.name}.`);
  }
}
