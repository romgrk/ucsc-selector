/*
 * background.js
 */

let ports = []

let state = {}
let listeners = []

chrome.storage.local.get(null, (storage) => {
  state.regions = storage.regions || []
  state.status  = storage.status || 'start'
})


chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name == 'content')

  ports.push(port)

  port.onMessage.addListener((msg) => {
    addRegion(msg.data)
  })

  port.onDisconnect.addListener(() => {
    ports = ports.filter(p => p !== port)
  })
})

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

  ports.forEach(port =>
    port.postMessage({ type: state.status })
  )
}
function toggleStatus(status) {
  setStatus(state.status === 'start' ? 'pause' : 'start')
}

function getRegions() {
  return state.regions
}
function addRegion(region) {
  setState({ regions: [...state.regions, region] })
}
function deleteRegion(region) {
  setState({ regions: state.regions.filter(r => r !== region) })
}
function clearRegions() {
  setState({ regions: [] })
}
