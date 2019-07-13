import { GenericValueMap } from '../engine/flow';

export type ExampleFunction = () => Promise<GenericValueMap>;

export interface ExampleMap {
  [exampleName: string]: ExampleFunction;
}
