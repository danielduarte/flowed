import {FlowManager} from './engine/flow-manager';


FlowManager.run({
        tasks: {
            B: {
                requires: ['param1'],
                provides: ['b1'],
            },
            C: {
                requires: ['param2'],
                provides: ['c1', 'c2'],
            },
            A: {
                requires: ['b1', 'c1', 'c2'],
                provides: ['a4', 'a5'],
            },
            D: {
                requires: ['a4', 'a5'],
                provides: ['d3'],
            },
            E: {
                requires: ['a5', 'f1'],
                provides: ['e3'],
            },
            F: {
                requires: ['param3'],
                provides: ['f1'],
            },
            G: {
                requires: ['d3', 'e3'],
                provides: [],
            },
        },
    },
    {
        param1: 'PARAM1',
        param2: 'PARAM2',
        param3: 'PARAM3',
    }
);

// FlowManager.run({
//         tasks: {
//             A: {
//                 requires: [],
//                 provides: ['a'],
//             },
//             B: {
//                 requires: [],
//                 provides: ['b'],
//             },
//             C: {
//                 requires: ['a', 'b'],
//                 provides: ['c'],
//             },
//             D: {
//                 requires: [],
//                 provides: ['d'],
//             },
//             E: {
//                 requires: ['c', 'd'],
//                 provides: ['e'],
//             },
//             F: {
//                 requires: [],
//                 provides: ['f'],
//             },
//             G: {
//                 requires: ['e', 'f'],
//                 provides: ['g'],
//             },
//         },
//     },
// );
