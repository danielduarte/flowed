import { OptPromise, ValueMap } from '../../src';

export type ExampleFunction = () => OptPromise<ValueMap>;

export interface ExampleMap {
  [exampleName: string]: ExampleFunction;
}
