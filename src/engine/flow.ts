import {FlowSpec} from './flow-spec';


export class Flow {

    protected spec: FlowSpec;

    constructor(spec: FlowSpec) {
        this.spec = spec;
    }

    run() {
        console.log('Starting flow...');
    }
}
