import { pushError } from '../state/error'

export default function listenError () {
  
  window.onerror = (msg, url, lineNo, columNo, e) => {
    console.error('[onerror] ',{ msg, url, lineNo, columNo, e})
    if(msg === 'Script error.' || !url) return
  }

  window.addEventListener('error', (e) => {
    console.error('[error] ', e)
  })

  window.addEventListener('unhandledrejection', (e) => {
    try {
      // console.error('[unhandledrejection] ', e, e.reason)
      pushError({
        message: e.reason?.message,
        stack: e.reason?.stack
      })
    } catch (err) {} 
  })
}