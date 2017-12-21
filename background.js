/*
 * background.js
 */

const MODES = ['peak', 'start', 'end', 'no_peak']

let ports = []

let state = {}
let listeners = []

chrome.storage.local.get(null, (storage) => {
  state.regions = storage.regions || []
  state.status  = storage.status || 'start'
  state.mode  = storage.mode || 'peak'
})


chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name == 'content')

  ports.push(port)
  updateIcon()

  port.onMessage.addListener((msg) => {
    switch(msg.type) {
      case 'region': return addRegion(msg.data)
      case 'mode': return setMode(msg.data)
      case 'state': return port.postMessage(state)
    }
  })

  port.onDisconnect.addListener(() => {
    ports = ports.filter(p => p !== port)
  })

  port.postMessage({ type: 'state', data: state })
})

function postMessage(message) {
  ports.forEach(p =>
    p.postMessage(message)
  )
}
function updateIcon() {
  ports.forEach(p => {
    chrome.browserAction.setIcon({
      path: { '32': state.status === 'start' ? './logo-green.png' : './logo.png' },
      tabId: p.sender.tab.id,
    })
    chrome.browserAction.setBadgeText({
      text: 'ON',
      tabId: p.sender.tab.id,
    })
    chrome.browserAction.setBadgeBackgroundColor({
      color: getModeColor(state.mode),
      tabId: p.sender.tab.id,
    })
  })
}


function setState(patch) {
  state = { ...state, ...patch }
  chrome.storage.local.set(state)
  listeners.forEach(l => l(state))
}
function getState() {
  return state
}
function addListener(listener) {
  listeners.push(listener)
}
function removeListener(listener) {
  listeners = listeners.filter(l => l !== listener)
}

function getStatus() {
  return state.status
}
function setStatus(status) {
  if (status !== 'start' && status !== 'pause')
    return

  setState({ status })
  postMessage({ type: 'status', data: state.status })
  updateIcon()
}
function toggleStatus(status) {
  setStatus(state.status === 'start' ? 'pause' : 'start')
}

function getMode() {
  return state.mode
}
function setMode(mode) {
  if (!MODES.includes(mode))
    throw new Error('Invalid mode: ' + mode)

  setState({ mode })
  postMessage({ type: 'mode', data: mode })
  updateIcon()
}

function getRegions() {
  return state.regions
}
function addRegion(region) {
  setState({ regions: [...state.regions, region] })
  postMessage({ type: 'regions', data: state.regions })
}
function deleteRegion(region) {
  setState({ regions: state.regions.filter(r => r.position !== region.position || r.track !== region.track) })
  postMessage({ type: 'regions', data: state.regions })
}
function clearRegions() {
  setState({ regions: [] })
  postMessage({ type: 'regions', data: state.regions })
}


function getModes() {
  return MODES
}
function getModeColor(mode) {
  return {
    no_peak: '#f6f4bf',
    start:   '#ffafaf',
    end:     '#ff4c4c',
    peak:    '#a445ee',
  }[mode]
}
