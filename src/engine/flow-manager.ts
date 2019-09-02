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

  public static runFromString(
    flowSpecJson: string,
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: GenericValueMap = {},
  ): Promise<GenericValueMap> {
    return new Promise<GenericValueMap>((resolveFlow, reject) => {
      try {
        const flowSpec = JSON.parse(flowSpecJson);
        FlowManager.run(flowSpec, params, expectedResults, resolvers, context).then(resolveFlow, reject);
      } catch (error) {
        reject(error);
      }
    });
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
          FlowManager.runFromString(fileContents, params, expectedResults, resolvers, context).then(resolveFlow, reject);
        }
      });
    });
  }

  // @todo implement runFromUrl
}
