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
  updateIcon()

  port.onMessage.addListener((msg) => {
    addRegion(msg.data)
  })

  port.onDisconnect.addListener(() => {
    ports = ports.filter(p => p !== port)
  })

  port.postMessage({ type: 'regions', data: state.regions })
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
