import { GenericValueMap } from '../../src/engine/flow';

export type ExampleFunction = () => Promise<GenericValueMap>;

export interface ExampleMap {
  [exampleName: string]: ExampleFunction;
}
