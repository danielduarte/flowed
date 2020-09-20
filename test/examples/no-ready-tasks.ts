import { FlowManager } from '../../src/engine';
import { ExampleFunction } from './types';

// noinspection JSUnusedGlobalSymbols
export const noReadyTasks: ExampleFunction = () => {
  return FlowManager.run({ tasks: { a: { requires: ['x'] } } }, {}, [], {});
};
