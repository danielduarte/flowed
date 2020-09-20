import { FlowManager } from '../../src/engine';
import { ExampleFunction } from './types';

// noinspection JSUnusedGlobalSymbols
export const noTasks: ExampleFunction = () => {
  return FlowManager.run({ tasks: {} }, {}, [], {});
};
