import { FlowManager } from '../../src/engine';
import { ExampleFunction } from './types';

// noinspection JSUnusedGlobalSymbols
export const emptyFlow: ExampleFunction = () => {
  return FlowManager.run({}, {}, [], {});
};
