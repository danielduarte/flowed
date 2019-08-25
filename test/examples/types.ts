import { GenericValueMap } from '../../src';

export type ExampleFunction = () => Promise<GenericValueMap>;

export interface ExampleMap {
  [exampleName: string]: ExampleFunction;
}
