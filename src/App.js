/* global chrome */

import React, { Component } from 'react'
import './App.css'


const background = chrome.extension.getBackgroundPage()
console.log(background)


class App extends Component {
  constructor(props) {
    super(props)

    background.addListener(this.stateChanged)
    this.state = background.getState()
  }

  componentDidMount() {
    window.addEventListener('unload', () =>
      background.removeListener(this.stateChanged))
  }

  stateChanged = (state) => {
    this.setState(state)
  }

  toggleStatus = (ev) => {
    background.toggleStatus()
  }

  render() {
    const { status, regions } = this.state

    return (
      <div className="App">

        <header className="App-header">

          <button onClick={this.toggleStatus}>
            { status === 'start' ? 'Pause' : 'Start' }
          </button>

          <span className='App-status'>
            Currently { status === 'start' ?
              'running' :
              'paused'
            }
          </span>

        </header>

        <ul className="App-regions">
          {
            regions.map(region =>
              <li>{ region }</li>
            )
          }
        </ul>
      </div>
    )
  }
}

export default App
