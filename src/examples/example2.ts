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
                    resolver: 'dummy',
                },
                B: {
                    requires: [],
                    provides: ['b'],
                    resolver: 'dummy',
                },
                C: {
                    requires: ['a', 'b'],
                    provides: ['c'],
                    resolver: 'dummy',
                },
                D: {
                    requires: [],
                    provides: ['d'],
                    resolver: 'dummy',
                },
                E: {
                    requires: ['c', 'd'],
                    provides: ['e'],
                    resolver: 'dummy',
                },
                F: {
                    requires: [],
                    provides: ['f'],
                    resolver: 'dummy',
                },
                G: {
                    requires: ['e', 'f'],
                    provides: ['g'],
                    resolver: 'dummy',
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
