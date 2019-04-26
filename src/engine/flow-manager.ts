import {FlowSpec} from './flow-spec'
import {Flow} from './flow'


export class FlowManager {

    static run(flowSpec: FlowSpec) {
        const flow = new Flow(flowSpec);
        return flow.run();
    }
}
