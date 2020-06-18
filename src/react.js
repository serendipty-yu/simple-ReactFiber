import {ELEMENT_TEXT} from "./constants";

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

const React = {
    createElement
}
export default React
