import * as fs from 'fs';
import { Flow, GenericValueMap, TaskResolverMap } from './flow';
import { FlowSpec } from './flow-specs';

export class FlowManager {
  public static run(
    flowSpec: FlowSpec,
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
  ): Promise<GenericValueMap> {
    const flow = new Flow(flowSpec);
    return flow.run(params, expectedResults, resolvers);
  }

  public static runFromFile(
    flowSpecFilepath: string,
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
  ): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>(resolveFlow => {
      fs.readFile(flowSpecFilepath, 'utf8', (err, flowSpec) => {
        FlowManager.run(JSON.parse(flowSpec), params, expectedResults, resolvers).then(resolveFlow);
      });
    });
  }
}
