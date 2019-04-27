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
                    },
                },
                B: {
                    requires: [],
                    provides: ['b'],
                    resolver: {
                        name: 'dummy',
                        params: {},
                    },
                },
                C: {
                    requires: ['a', 'b'],
                    provides: ['c'],
                    resolver: {
                        name: 'dummy',
                        params: {},
                    },
                },
                D: {
                    requires: [],
                    provides: ['d'],
                    resolver: {
                        name: 'dummy',
                        params: {},
                    },
                },
                E: {
                    requires: ['c', 'd'],
                    provides: ['e'],
                    resolver: {
                        name: 'dummy',
                        params: {},
                    },
                },
                F: {
                    requires: [],
                    provides: ['f'],
                    resolver: {
                        name: 'dummy',
                        params: {},
                    },
                },
                G: {
                    requires: ['e', 'f'],
                    provides: ['g'],
                    resolver: {
                        name: 'dummy',
                        params: {},
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
