import { FlowManager } from '../../src';
import { ExampleFunction } from './types';

// noinspection JSUnusedGlobalSymbols
export const emptyFlow: ExampleFunction = () => {
  return FlowManager.run({}, {}, [], {});
};
