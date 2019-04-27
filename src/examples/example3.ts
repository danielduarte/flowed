import {FlowManager} from '../engine/flow-manager';
import {Task} from "../engine/task";
import {GenericValueMap} from "../engine/flow";

namespace MathFn {

    export class Sqr {

        public async exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {

            return {
                result: params.x * params.x
            };
        }
    }

    export class Sqrt {

        public async exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {

            return {
                result: Math.sqrt(params.x)
            };
        }
    }

    export class Sum {

        public async exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {

            return {
                result: params.x + params.y
            };
        }
    }
}

export function example3() {
    FlowManager.run({
            tasks: {
                sqr1: {
                    requires: ['c1'],
                    provides: ['c1^2'],
                    resolver: {
                        name: 'sqrt',
                        params: { x: 'c1' },
                    },
                },
                sqr2: {
                    requires: ['c2'],
                    provides: ['c2^2'],
                    resolver: {
                        name: 'sqrt',
                        params: { x: 'c2' },
                    },
                },
                sum: {
                    requires: ['c1^1', 'c1^2'],
                    provides: ['sum'],
                    resolver: {
                        name: 'sum',
                        params: { x: 'c1^2', y: 'c2^2' },
                    },
                },
                sqrt: {
                    requires: ['sum'],
                    provides: ['result'],
                    resolver: {
                        name: 'sqrt',
                        params: { x: 'sum' },
                    },
                },
            },
        },
        {
            c1: 3,
            c2: 4,
        },
        ['result'],
        {
            sqr: MathFn.Sqr,
            sqrt: MathFn.Sqrt,
            sum: MathFn.Sum,
        }
    );
}
