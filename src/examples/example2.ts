import {FlowManager} from '../engine/flow-manager';
import {Task} from "../engine/task";
import {GenericValueMap} from "../engine/flow";


class DummyResolver {

    public async exec(params: GenericValueMap, task: Task): Promise<GenericValueMap> {

        return {};
    }
}

export function example2() {
    FlowManager.run({
            tasks: {
                A: {
                    requires: [],
                    provides: ['a'],
                    resolver: {
                        name: 'dummy',
                        params: {},
                        results: {},
                    },
                },
                B: {
                    requires: [],
                    provides: ['b'],
                    resolver: {
                        name: 'dummy',
                        params: {},
                        results: {},
                    },
                },
                C: {
                    requires: ['a', 'b'],
                    provides: ['c'],
                    resolver: {
                        name: 'dummy',
                        params: {},
                        results: {},
                    },
                },
                D: {
                    requires: [],
                    provides: ['d'],
                    resolver: {
                        name: 'dummy',
                        params: {},
                        results: {},
                    },
                },
                E: {
                    requires: ['c', 'd'],
                    provides: ['e'],
                    resolver: {
                        name: 'dummy',
                        params: {},
                        results: {},
                    },
                },
                F: {
                    requires: [],
                    provides: ['f'],
                    resolver: {
                        name: 'dummy',
                        params: {},
                        results: {},
                    },
                },
                G: {
                    requires: ['e', 'f'],
                    provides: ['g'],
                    resolver: {
                        name: 'dummy',
                        params: {},
                        results: {},
                    },
                },
            },
        },
        {},
        [],
        {
            dummy: DummyResolver,
        }
    );
};
