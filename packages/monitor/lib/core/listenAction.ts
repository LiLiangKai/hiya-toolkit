import { report } from './report'
import { minfo } from './console'
import htmlTreeAsString from '../utils/htmlTreeAsString';

export default function listenAction () {
  captureLoad()
  captureUnload()
  captureUIAction()
  captureXHRAction()
}

function captureUIAction () {
  const captureAction = (action: string) => {
    return (evt) => {
      let target = ''
      try {
        target = htmlTreeAsString(evt.target)
      } catch (err) {
        target = '<unknow>'
      }
      minfo({
        category: `ui.${action}`,
        target,
      })
    }
  }

  window.addEventListener('click', captureAction('click'), false)
}

function captureXHRAction () {
  
}

function captureUnload () {
  window.addEventListener('beforeunload', () => {
    report()
  }, false)
}

function captureLoad () {
  window.addEventListener('load', () => {
    minfo({
      category: 'page.load',
    })
  })
}