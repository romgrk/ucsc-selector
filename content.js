/*
 * content.js
 */
/* global dragSelect, $ */

console.log('UCSC Selector loaded')
console.log(chrome)

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

  port.postMessage({ type, data })
})





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

  function addStyle(style) {
    const node = document.createElement('style')
    node.innerHTML = style
    document.head.appendChild(node)
  }

  window.closePopup = closePopup
  window.getCurrentPosition = getCurrentPosition
  window.parsePosition = parsePosition
  window.addStyle = addStyle

  /* Setup style */

  addStyle(`
    #imgTbl tr td:nth-child(2) {
      cursor: pointer;
    }
    #imgTbl tr td:nth-child(2):hover {
      background-color: rgba(6, 195, 255, 0.3);
    }

    [ucsc-selected] {
      background-color: rgba(6, 195, 255, 0.3);
    }
  `)


  /* Setup event listeners */

  const UCSC = window.UCSC = {
    selectedTrack: undefined,
    lastPosition: '',
  }


  $('#imgTbl tr td:nth-child(2)').click(ev => {
    if (window.isSelectorPaused === true)
      return

    $('[ucsc-selected]').removeAttr('ucsc-selected')
    $(ev.currentTarget.parentNode).attr('ucsc-selected', true)
    UCSC.selectedTrack = $(ev.currentTarget).attr('title').replace(/ *\n.*/, '')
    window.redrawRegions()
  })

  /* Region capturing script */

  setInterval(() => {
    if (window.isSelectorPaused === true)
      return

    const dragSelectPosition = document.querySelector('#dragSelectPosition')

    if (dragSelectPosition === null)
      return

    const position = dragSelectPosition.textContent

    if (position !== UCSC.lastPosition) {
      UCSC.lastPosition = position

      if (UCSC.selectedTrack === undefined) {
        alert('Please select a track first.')
      } else {
        window.postMessage({ type: 'region', data: { track: UCSC.selectedTrack, position } }, '*')
      }

      dragSelect.hlColor = '#ffff9c'
      dragSelect.highlightThisRegion(position, true) // 'chr1:549597-623032'

      closePopup()
    }
  }, 75)
})

function startSelector() {
  run(() => window.isSelectorPaused = false)
}

function pauseSelector() {
  run(() => window.isSelectorPaused = true)
}

function setRegions(regions) {
  run([regions], (regions) => {

    window.redrawRegions = function redrawRegions() {
      regions.forEach((r, i) => {
        dragSelect.hlColor = r.track === window.UCSC.selectedTrack ? '#ffff9c' : '#ccc'
        dragSelect.highlightThisRegion(r.position, i !== 0) // 'chr1:549597-623032'
      })

      // We highglight a single position to clear the rest of them. Havent found an API
      // to do that.
      if (regions.length === 0) {
        const current = window.parsePosition(window.getCurrentPosition())
        const region = `${current.chrom}:${current.start}-${current.start + 1}`
        dragSelect.highlightThisRegion(region, false)
      }
    }
    window.redrawRegions()
  })
}





function run(args, fn) {
  if (fn === undefined && typeof args === 'function') {
    fn = args
    args = []
  }

  return inject(scriptFromSource(`(${fn})(${args.map(JSON.stringify).join(', ')})`))
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
