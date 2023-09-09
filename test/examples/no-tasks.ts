import { FlowManager } from '../../src';
import { ExampleFunction } from './types';

// noinspection JSUnusedGlobalSymbols
export const noTasks: ExampleFunction = () => {
  return FlowManager.run({ tasks: {} }, {}, [], {});
};
