import { ValueMap } from '../../src';

export type ExampleFunction = () => Promise<ValueMap>;

export interface ExampleMap {
  [exampleName: string]: ExampleFunction;
}
