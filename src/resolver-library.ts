import { GenericValueMap } from './engine/flow';
import { FlowManager } from './engine/flow-manager';

// Do nothing and finish
export class NoopResolver {
  public async exec(): Promise<GenericValueMap> {
    return {};
  }
}

// Wait for 'ms' milliseconds and finish
export class WaitResolver {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>(resolve => {
      setTimeout(() => {
        resolve({});
      }, params.ms);
    });
  }
}

// Run a flow and finish
export class SubFlowResolver {
  public async exec(params: GenericValueMap): Promise<GenericValueMap> {
    const flowResult = await FlowManager.run(
      params.flowSpec,
      params.flowParams,
      params.flowExpectedResults,
      params.flowResolvers,
    );

    return { flowResult };
  }
}
