import { readFile } from 'fs';
import * as http from 'http';
import * as https from 'https';
import { IncomingMessage } from 'http';
import { TaskResolverMap, ValueMap, FlowedPlugin, FlowedLogger, FlowedLogEntry, OptPromise } from '../types';
import { Flow } from './flow';
import { FlowSpec } from './specs';

export class FlowManager {
  public static plugins: {
    resolvers: TaskResolverMap;
  } = {
    resolvers: {},
  };

  public static logger: FlowedLogger | null = null;

  public static run(
    flowSpec: FlowSpec,
    params: ValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: ValueMap = {},
    options: ValueMap = {},
  ): OptPromise<ValueMap> {
    const flow = new Flow(flowSpec);
    return flow.start(params, expectedResults, resolvers, context, options);
  }

  public static runFromString(
    flowSpecJson: string,
    params: ValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: ValueMap = {},
    options: ValueMap = {},
  ): Promise<ValueMap> {
    return new Promise<ValueMap>((resolveFlow, reject) => {
      try {
        const flowSpec = JSON.parse(flowSpecJson);
        FlowManager.run(flowSpec, params, expectedResults, resolvers, context, options).then(resolveFlow, reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  public static runFromFile(
    flowSpecFilepath: string,
    params: ValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: ValueMap = {},
    options: ValueMap = {},
  ): Promise<ValueMap> {
    return new Promise<ValueMap>((resolveFlow, reject) => {
      readFile(flowSpecFilepath, 'utf8', (err, fileContents) => {
        if (err) {
          reject(err);
        } else {
          FlowManager.runFromString(fileContents, params, expectedResults, resolvers, context, options).then(resolveFlow, reject);
        }
      });
    });
  }

  public static runFromUrl(
    flowSpecUrl: string,
    params: ValueMap = {},
    expectedResults: string[] = [],
    resolvers: TaskResolverMap = {},
    context: ValueMap = {},
    options: ValueMap = {},
  ): Promise<ValueMap> {
    let client: typeof import('http') | typeof import('https') | null = null;
    // noinspection HttpUrlsUsage
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
        return Promise.reject(new Error(`Protocol not supported: ${actualProtocol}. Supported protocols are: [http, https]`));
      } else {
        return Promise.reject(new Error(`Invalid URL: ${flowSpecUrl}`));
      }
    }

    return new Promise<ValueMap>((resolveFlow, reject) => {
      client! // eslint-disable-line @typescript-eslint/no-non-null-assertion
        .get(flowSpecUrl, (res: IncomingMessage) => {
          const { statusCode } = res;
          const contentType = res.headers['content-type'] ?? 'application/json';

          let error;
          if (statusCode !== 200) {
            error = new Error(`Request failed with status code: ${statusCode}`);
          } else if (!(contentType.startsWith('application/json') || contentType.startsWith('text/plain'))) {
            error = new Error(`Invalid content-type: Expected 'application/json' or 'text/plain' but received '${contentType}'`);
          }

          if (error) {
            reject(error);
          } else {
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk: string) => {
              rawData += chunk;
            });
            res.on('end', () => {
              FlowManager.runFromString(rawData, params, expectedResults, resolvers, context, options).then(resolveFlow, reject);
            });
          }
        })
        .on('error', (error: Error) => {
          reject(error);
        });
    });
  }

  public static installPlugin(plugin: FlowedPlugin): void {
    // Installing plugin resolvers
    if (plugin.resolverLibrary) {
      for (const [name, resolver] of Object.entries(plugin.resolverLibrary)) {
        this.plugins.resolvers[name] = resolver;
      }
    }
  }

  public static installLogger(logger: FlowedLogger): void {
    this.logger = logger;
  }

  public static log(entry: FlowedLogEntry): void {
    if (FlowManager.logger === null) {
      return;
    }
    FlowManager.logger.log(entry);
  }
}
