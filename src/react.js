import {ELEMENT_TEXT} from "./constants";
import { UpdateQueue,Update } from "./UpdateQueue";
import {scheduleRoot} from "./scheduler";

function createElement(type,config,...children) {
    delete config.__self
    delete config.__source
    return {
        type,
        props: {
            ...config,
            children: children.map(child => {
                return typeof child === 'object'? child: {
                    type: ELEMENT_TEXT,
                    props: {text: child, children: []}
                }
            })
        }
    }
}

class Component {
    constructor(props) {
        this.props = props
        //this.updateQueue = new UpdateQueue()
    }
    setState(payload) {
        let update = new Update(payload)
        this.internalFiber.updateQueue.enqueueUpdate(update)
        scheduleRoot()
    }
}

Component.prototype.isReactComponent = {}
const React = {
    createElement,
    Component
}
export default React
