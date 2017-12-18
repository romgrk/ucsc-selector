/*
 * content.js
 */

console.log('UCSC Selector loaded')



const port = chrome.runtime.connect({ name: 'content' })

port.onMessage.addListener((msg) => {
  console.log('content received: ', msg)

  switch (msg.type) {
    case 'start': return startSelector();
    case 'pause': return pauseSelector();
    default: throw new Error('unreachable');
  }
})

window.addEventListener('message', (event) => {
  const { region } = event.data

  port.postMessage({ data: region })
})

//const background = chrome.extension.getBackgroundPage()
//background.testRequest()


function startSelector() {
  run(() => window.isSelectorPaused = false)
}

function pauseSelector() {
  run(() => window.isSelectorPaused = true)
}


run(() => {

  let lastRegion = ''

  setInterval(() => {
    if (window.isSelectorPaused === true)
      return

    const dragSelectPosition = document.querySelector('#dragSelectPosition')

    if (dragSelectPosition === null) {
      console.log('no #dragSelectPosition')
      return
    }

    const region = dragSelectPosition.textContent

    if (region !== lastRegion) {
      lastRegion = region

      window.postMessage({ region }, '*')

      dragSelect.hlColor = '#ffff9c'
      dragSelect.highlightThisRegion(region, true) // 'chr1:549597-623032'

      closePopup()
    }

  }, 1000)

  function closePopup() {
    const element = document.querySelector('body > div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-draggable > div.ui-dialog-titlebar.ui-widget-header.ui-corner-all.ui-helper-clearfix > a > span')
    element.click()
  }
})





function run(fn) {
  return inject(scriptFromSource(`(${fn})()`))
}

function scriptFromFile(file) {
  const script = document.createElement('script')
  script.src = chrome.extension.getURL(file)
  return script
}

function scriptFromSource(source) {
  const script = document.createElement('script')
  script.textContent = source.toString()
  return script
}

function inject(script) {
  return new Promise((resolve, reject) => {
    const onload = () => {
      script.parentNode.removeChild(script)
      resolve()
    }

    if (script.src !== '') {
      script.onload = onload
      document.head.appendChild(script)
    } else {
      document.head.appendChild(script)
      onload()
    }
  })
}
