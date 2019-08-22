import { GenericValueMap } from '../../src/types';

export type ExampleFunction = () => Promise<GenericValueMap>;

export interface ExampleMap {
  [exampleName: string]: ExampleFunction;
}
