import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
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

  public static runFromUrl(
    flowSpecUrl: string,
    params: GenericValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: GenericValueMap = {},
  ): Promise<GenericValueMap> {
    let client: any = null;
    if (flowSpecUrl.startsWith('http://')) {
      client = http;
    } else if (flowSpecUrl.startsWith('https://')) {
      client = https;
    }

    if (client === null) {
      let actualProtocol = null;
      const matchResult = flowSpecUrl.match(/^([a-zA-Z]+):/);
      if (Array.isArray(matchResult) && matchResult.length === 2) {
        actualProtocol = matchResult[1];
      }
      return Promise.reject(
        new Error(`Protocol not supported${actualProtocol ? `: ${actualProtocol}` : ''}. Supported protocols are: [http, https]`),
      );
    }

    return new Promise<GenericValueMap>((resolveFlow, reject) => {
      client
        .get(flowSpecUrl, (res: any) => {
          const { statusCode } = res;
          const contentType = res.headers['content-type'] || 'application/json';

          let error;
          if (statusCode !== 200) {
            error = new Error(`Request failed with status code: ${statusCode}`);
          } else if (!(/^application\/json/.test(contentType) || /^text\/plain/.test(contentType))) {
            error = new Error(`Invalid content-type. Expected application/json or text/plain but received ${contentType}`);
          }

          if (error) {
            reject(error);
          } else {
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk: any) => {
              rawData += chunk;
            });
            res.on('end', () => {
              FlowManager.runFromString(rawData, params, expectedResults, resolvers, context).then(resolveFlow, reject);
            });
          }
        })
        .on('error', (error: Error) => {
          reject(error);
        });
    });
  }
}
