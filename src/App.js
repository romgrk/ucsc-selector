/* global chrome */

import React, { Component } from 'react'
import './App.css'

import copyToClipboard from './utils/copy-to-clipboard'
import parsePosition from './utils/parse-position'
import sortRegions from './utils/sort-regions'


const background = window.background = chrome.extension.getBackgroundPage()
console.log(background)


class App extends Component {
  constructor(props) {
    super(props)

    background.addListener(this.stateChanged)

    this.state = {
      ...background.getState(),
      confirmDeletion: false,
    }
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

  copyRegionsToClipboard = () => {
    copyToClipboard(this.state.regions.join('\n'))
  }

  deleteAllRegions = () => {
    background.clearRegions()
    this.closeModal()
  }

  openModal = () => {
    this.setState({ confirmDeletion: true })
  }

  closeModal = () => {
    this.setState({ confirmDeletion: false })
  }

  render() {
    const { status, regions, confirmDeletion } = this.state

    return (
      <div className="App">

        <header className="App-header">

          <button className='inverse' onClick={this.toggleStatus}>
            { status === 'start' ? 'Pause' : 'Start' }
          </button>

          <span className='App-status'>
            Currently { status === 'start' ?
              'running' :
              'paused'
            }
          </span>

        </header>

        <div className='row'>
          <button onClick={this.copyRegionsToClipboard}>Copy to Clipboard</button>
        </div>

        <div className='App-regions'>

          <table className="App-regions-table">
            <tbody>
              {
                sortRegions(regions).map(region => {
                  const position = parsePosition(region)
                  return (
                    <tr>
                      <td>
                        { position.chrom }
                      </td>
                      <td>
                        :
                      </td>
                      <td>
                        { position.start }
                      </td>
                      <td>
                        -
                      </td>
                      <td>
                        { position.end }
                      </td>
                      <td>
                        <button onClick={() => background.deleteRegion(region)}>&times;</button>
                      </td>
                    </tr>
                  )
                })
              }
              {
                regions.length === 0 &&
                  <tr>
                    <td>No regions yet</td>
                  </tr>
              }
            </tbody>
          </table>
        </div>

        <div className='row'>
          <button onClick={this.openModal}>Delete All</button>
        </div>

        <div className={ 'App-delete-modal ' + (confirmDeletion ? 'visible' : '') }>
          <div className='content'>
            <div className='row large'>
              Are you sure you want to delete all regions?
            </div>

            <div className='row'>
              <button onClick={this.closeModal}>No, keep them</button>
            </div>
            <div className='row'>
              <button className='danger' onClick={this.deleteAllRegions}>Yes, delete them</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default App
