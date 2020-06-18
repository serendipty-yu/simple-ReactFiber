import React from './react';
import ReactDOM from './react-dom';

class ClassCounter extends React.Component {
    constructor(props) {
        super(props);
        this.state = { number: 0 }
    }

    onClick = () => {
        this.setState(state => ({ number: state.number + 1 }))
    }

    render() {
        return (
            <div id="counter">
                <span>{this.state.number}</span>
                <button onClick={this.onClick}>加1</button>
            </div>
        )
    }
}

ReactDOM.render(<ClassCounter name="计数器"/>, document.getElementById('root'))
