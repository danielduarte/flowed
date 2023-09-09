import { FlowManager } from '../../src';
import { ExampleFunction } from './types';

// noinspection JSUnusedGlobalSymbols
export const noReadyTasks: ExampleFunction = () => {
  return FlowManager.run({ tasks: { a: { requires: ['x'] } } }, {}, [], {});
};
