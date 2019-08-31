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
    return new Promise<GenericValueMap>((resolveFlow, reject) => {
      fs.readFile(flowSpecFilepath, 'utf8', (err, fileContents) => {

        if (err) {
          reject(err);
        } else {

          try {
            const flowSpec = JSON.parse(fileContents);
            FlowManager.run(flowSpec, params, expectedResults, resolvers, context).then(resolveFlow);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  // @todo implement runFromUrl
  // @todo implement runFromJsonStr
}
