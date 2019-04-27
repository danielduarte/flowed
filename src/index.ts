import {FlowManager} from './engine/flow-manager';


FlowManager.run({
        tasks: {
            A: {
                requires: [],
                provides: ['a'],
            },
            B: {
                requires: [],
                provides: ['b'],
            },
            C: {
                requires: ['a', 'b'],
                provides: ['c'],
            },
            D: {
                requires: [],
                provides: ['d'],
            },
            E: {
                requires: ['c', 'd'],
                provides: ['e'],
            },
            F: {
                requires: [],
                provides: ['f'],
            },
            G: {
                requires: ['e', 'f'],
                provides: ['g'],
            },
        },
    },
);
