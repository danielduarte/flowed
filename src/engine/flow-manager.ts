import * as fs from 'fs';
import { GenericValueMap, TaskResolverMap } from '../types';
import { Flow } from './flow';
import { FlowSpec } from './specs';

export class FlowManager {
  public static run(
    flowSpec: FlowSpec,
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: GenericValueMap = {},
  ): Promise<GenericValueMap> {
    const flow = new Flow(flowSpec);
    return flow.start(params, expectedResults, resolvers, context);
  }

  public static runFromFile(
    flowSpecFilepath: string,
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: GenericValueMap = {},
  ): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>(resolveFlow => {
      fs.readFile(flowSpecFilepath, 'utf8', (err, flowSpec) => {
        // @todo Add test for non existing file

        // @todo Add test for invalid JSON file

        if (err) {
          throw err;
        }

        FlowManager.run(JSON.parse(flowSpec), params, expectedResults, resolvers, context).then(resolveFlow);
      });
    });
  }

  // @todo implement runFromUrl
  // @todo implement runFromJsonStr
}
