import {DELETION, ELEMENT_TEXT, PLACEMENT, TAG_CLASS, TAG_HOST, TAG_ROOT, TAG_TEXT, UPDATE} from "./constants";
import {setProps} from "./utils";
import { UpdateQueue } from "./UpdateQueue";

let nextUnitOfWork = null
let workInProgressRoot = null //RootFiber应用的根
let currentRoot = null
let deletions = []

export function scheduleRoot(rootFiber) {
    if(currentRoot && currentRoot.alternate) {
        workInProgressRoot = currentRoot.alternate
        if(rootFiber) {
            workInProgressRoot.props = rootFiber.props
        }
        workInProgressRoot.alternate = currentRoot
    }
    else if(currentRoot) {
        if (rootFiber) {
            rootFiber.alternate = currentRoot
            workInProgressRoot = rootFiber
        } else {
            workInProgressRoot = {
                ...currentRoot,
                alternate: currentRoot
            }
        }

    } else {
        workInProgressRoot = rootFiber
    }
    workInProgressRoot.firstEffect = workInProgressRoot.lastEffect = workInProgressRoot.nextEffect = null
    nextUnitOfWork = workInProgressRoot
}

function performUnitOfWork(currentFiber) {
    //console.log('performUnitOfWork',currentFiber)
    beginWork(currentFiber)
    if(currentFiber.child) {
        return currentFiber.child
    }

    while(currentFiber) {
        completeUnitOfWork(currentFiber)
        if(currentFiber.sibling) {
            return currentFiber.sibling
        }
        currentFiber = currentFiber.return
    }
}
// 收集有副作用的Fiber
function completeUnitOfWork(currentFiber) {
    //debugger
    //console.log('completeUnitOfWork',currentFiber)
    let returnFiber = currentFiber.return //A1
    //console.log('returnFiber',returnFiber)
    if (returnFiber) {
        if(!returnFiber.firstEffect){
            returnFiber.firstEffect = currentFiber.firstEffect
        }
        // 将所有节点 挂载到 A1->root
        if(currentFiber.lastEffect) {
            //console.log(2)
            if (returnFiber.lastEffect) {
                returnFiber.lastEffect.nextEffect = currentFiber.firstEffect
            }
            returnFiber.lastEffect = currentFiber.lastEffect
        }

        const effectTag = currentFiber.effectTag
        if(effectTag) {
            //console.log('1')
            //console.log('123')
            if (returnFiber.lastEffect) {
                returnFiber.lastEffect.nextEffect = currentFiber
            } else {
                returnFiber.firstEffect = currentFiber
            }
            returnFiber.lastEffect = currentFiber
        }
    }
}

function beginWork(currentFiber) {
    if (currentFiber.tag === TAG_ROOT) {
        updateHostRoot(currentFiber)
    } else if(currentFiber.tag === TAG_TEXT) {
        updateHostText(currentFiber)
    } else if(currentFiber.tag === TAG_HOST) {
        updateHost(currentFiber)
    } else if(currentFiber.tag === TAG_CLASS) {
        updateClassComponent(currentFiber)
    }
}

function updateClassComponent(currentFiber) {
    if(!currentFiber.stateNode) { // stateNode 组件的实例
        currentFiber.stateNode = new currentFiber.type(currentFiber.props)
        currentFiber.stateNode.internalFiber = currentFiber
        currentFiber.updateQueue = new UpdateQueue()
    }
    currentFiber.stateNode.state = currentFiber.updateQueue.forceUpdate(currentFiber.stateNode.state)
    let newElement = currentFiber.stateNode.render()
    const newChildren = [newElement]
    reconcileChildren(currentFiber,newChildren)
}

function updateHost(currentFiber) {
    if(!currentFiber.stateNode) {
        currentFiber.stateNode = createDOM(currentFiber)
    }
    const newChildren = currentFiber.props.children
    reconcileChildren(currentFiber, newChildren)
}

function updateHostText(currentFiber) {
    if(!currentFiber.stateNode) {
        currentFiber.stateNode = createDOM(currentFiber)
    }
}

function createDOM(currentFiber) {
    //console.log('createDOM',currentFiber)
    if(currentFiber.tag === TAG_TEXT) {
        return document.createTextNode(currentFiber.props.text);
    } else if(currentFiber.tag === TAG_HOST) {
        let stateNode = document.createElement(currentFiber.type)
        updateDOM(stateNode, {}, currentFiber.props)
        return stateNode;
    }
}

function updateDOM(stateNode, oldProps, newProps) {
    if(stateNode.setAttribute) {
        setProps(stateNode, oldProps, newProps)
    }
}

function updateHostRoot(currentFiber) {
    //console.log('updateHostRoot',currentFiber)
    let newChildren = currentFiber.props.children;
    reconcileChildren(currentFiber, newChildren)
}

function reconcileChildren(currentFiber, newChildren) {
    //console.log('reconcileChildren', currentFiber)
    //console.log('newChildren',newChildren)
    let newChildIndex = 0
    let oldFiber = currentFiber.alternate && currentFiber.alternate.child
    if(oldFiber) oldFiber.firstEffect = oldFiber.lastEffect = oldFiber.nextEffect = null
    let prevSibling
    while(newChildIndex < newChildren.length || oldFiber) {
        let newChild = newChildren[newChildIndex]
        let newFiber;
        const sameType = oldFiber && newChild && oldFiber.type === newChild.type

        let tag
        if(newChild && typeof newChild.type === 'function'
            && newChild.type.prototype.isReactComponent) {
            tag = TAG_CLASS
        } else if(newChild && newChild.type === ELEMENT_TEXT) {
            tag = TAG_TEXT
        } else if (newChild && typeof newChild.type === 'string') {
            tag = TAG_HOST
        }

        if(sameType) {
            if(oldFiber.alternate) {
                newFiber = oldFiber.alternate
                newFiber.props = newChild.props
                newFiber.alternate = oldFiber
                newFiber.effectTag = UPDATE
                newFiber.updateQueue = oldFiber.updateQueue || new UpdateQueue()
                newFiber.nextEffect = null
            } else {
                newFiber = {
                    tag: oldFiber.tag,
                    type: oldFiber.type,
                    props: newChild.props,
                    stateNode: oldFiber.stateNode, //div 还没有创建DOM元素
                    return: currentFiber, // 父fiber
                    updateQueue: oldFiber.updateQueue || new UpdateQueue(),
                    alternate: oldFiber,
                    effectTag: UPDATE,
                    nextEffect: null  //
                }
            }
        } else {
            if(newChild) {
                newFiber = {
                    tag, //TAG_HOST
                    type: newChild.type,
                    props: newChild.props,
                    stateNode: null, //div 还没有创建DOM元素
                    return: currentFiber, // 父fiber
                    effectTag: PLACEMENT,
                    updateQueue: new UpdateQueue(),
                    nextEffect: null  //effect list 单链表
                }
            }
            if(oldFiber) {
                oldFiber.effectTag = DELETION
                deletions.push(oldFiber)
            }

        }
        if (oldFiber) {
            oldFiber = oldFiber.sibling
        }
        if(newFiber) {
            if(newChildIndex === 0) {
                currentFiber.child = newFiber;
            } else {
                prevSibling.sibling = newFiber;
            }
            prevSibling = newFiber;
        }
        newChildIndex++
    }
}

function workLoop(deadline) {
    let shouldYield = false
    while(nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
        shouldYield = deadline.timeRemaining() < 1;
    }
    if(!nextUnitOfWork && workInProgressRoot) {
        console.log('render阶段结束')
        commitRoot()
    }
    requestIdleCallback(workLoop, { timeout: 500 })
}

function commitRoot() {
    deletions.forEach(commitWork)
    let currentFiber = workInProgressRoot.firstEffect;
    while(currentFiber) {
        //console.log('commitRoot',currentFiber)
        commitWork(currentFiber)
        currentFiber = currentFiber.nextEffect;
    }
    deletions.length = 0
    currentRoot = workInProgressRoot
    workInProgressRoot = null;
}

function commitWork(currentFiber) {
    if (!currentFiber) return;
    let returnFiber = currentFiber.return;

    while(returnFiber.tag !== TAG_HOST
        && returnFiber.tag !== TAG_TEXT
        && returnFiber.tag !== TAG_ROOT
        ) {
        returnFiber = returnFiber.return
    }

    let domReturn = returnFiber.stateNode;
    if (currentFiber.effectTag === PLACEMENT) {
        let nextFiber = currentFiber

        while(nextFiber.tag !== TAG_HOST && nextFiber.tag !== TAG_TEXT) {
            nextFiber = currentFiber.child
        }

        domReturn.appendChild(nextFiber.stateNode)
    } else if(currentFiber.effectTag === DELETION) {
        //domReturn.removeChild(currentFiber.stateNode)
        return commitDeletion(currentFiber,domReturn)
    }else if(currentFiber.effectTag === UPDATE) {
        if(currentFiber.type === ELEMENT_TEXT) {
            if(currentFiber.alternate.props.text !== currentFiber.props.text) {
                currentFiber.stateNode.textContent = currentFiber.props.text
            }
        } else {
            if(currentFiber.type === TAG_CLASS) {
                return currentFiber.effectTag = null
            }
            updateDOM(currentFiber.stateNode,currentFiber.alternate.props,currentFiber.props)
        }
    }
    currentFiber.effectTag = null;
}

function commitDeletion(currentFiber, domReturn) {
    if(currentFiber.tag !== TAG_HOST  || currentFiber.tag !== TAG_TEXT) {
        domReturn.removeChild(currentFiber.stateNode)
    } else {
        commitDeletion(currentFiber.child,domReturn)
    }
}

requestIdleCallback(workLoop, { timeout: 5000 })
