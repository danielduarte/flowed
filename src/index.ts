import {FlowManager} from './engine/flow-manager';


FlowManager.run({
        tasks: {
            A: {
                provides: 'a',
            },
            B: {
                provides: 'b',
            },
            C: {
                requires: ['a', 'b'],
            },
            D: {
                provides: 'd'
            },
            E: {
                requires: ['c', 'd'],
                provides: 'e'
            },
            F: {
                provides: 'f'
            },
            G: {
                requires: ['e', 'f'],
                provides: 'g'
            },
        }
    }
);
