/*
 * content.js
 */
/* global dragSelect */

console.log('UCSC Selector loaded')



const port = chrome.runtime.connect({ name: 'content' })

port.onMessage.addListener((msg) => {
  console.log('content received: ', msg)

  switch (msg.type) {
    case 'status': return msg.data === 'start' ? startSelector() : pauseSelector();
    case 'regions': return setRegions(msg.data);
    default: throw new Error('unreachable');
  }
})

window.addEventListener('message', (event) => {
  const { type, data } = event.data

  if (type === 'region')
    port.postMessage({ type, data })
})

// const background = chrome.extension.getBackgroundPage()
// background.testRequest()


function startSelector() {
  run(() => window.isSelectorPaused = false)
}

function pauseSelector() {
  run(() => window.isSelectorPaused = true)
}

function setRegions(regions) {
  run([regions], (regions) => {
    dragSelect.hlColor = '#ffff9c'

    regions.forEach((region, i) => {
      dragSelect.highlightThisRegion(region, i !== 0) // 'chr1:549597-623032'
    })

    // We highglight a single position to clear the rest of them. Havent found an API
    // to do that.
    if (regions.length === 0) {
      const current = window.parsePosition(window.getCurrentPosition())
      const region = `${current.chrom}:${current.start}-${current.start + 1}`
      dragSelect.highlightThisRegion(region, false)
    }
  })
}



run(() => {

  /* Available on the page context */

  function closePopup() {
    const element = document.querySelector('body > div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-draggable > div.ui-dialog-titlebar.ui-widget-header.ui-corner-all.ui-helper-clearfix > a > span')
    element.click()
  }

  function getCurrentPosition() {
    return document.querySelector('#positionDisplay').textContent.replace(/,/g, '')
  }

  function parsePosition(position) {
    const [chrom, range] = position.split(':')
    const [start, end] = range.split('-').map(n => parseInt(n, 10))
    return { chrom, start, end }
  }

  window.closePopup = closePopup
  window.getCurrentPosition = getCurrentPosition
  window.parsePosition = parsePosition

  /* Region capturing script */

  let lastRegion = ''

  setInterval(() => {
    if (window.isSelectorPaused === true)
      return

    const dragSelectPosition = document.querySelector('#dragSelectPosition')

    if (dragSelectPosition === null)
      return

    const region = dragSelectPosition.textContent

    if (region !== lastRegion) {
      lastRegion = region

      window.postMessage({ type: 'region', data: region }, '*')

      dragSelect.hlColor = '#ffff9c'
      dragSelect.highlightThisRegion(region, true) // 'chr1:549597-623032'

      closePopup()
    }
  }, 75)
})





function run(args, fn) {
  if (fn === undefined && typeof args === 'function') {
    fn = args
    args = []
  }

  return inject(scriptFromSource(`(${fn})(${args.map(JSON.stringify).join(', ')})`))
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
