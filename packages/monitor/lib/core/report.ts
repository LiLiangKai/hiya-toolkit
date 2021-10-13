import { _getErrors, resetErrors } from '../state/error'
import { getConfig } from '../state/config'

export default function report () {
  const handle = () => {
    setTimeout(() => {
      try {
        const errors = _getErrors()
        if(errors.length) {
          const reportData = {
            sdkVersion: getConfig('version'),
            userAgent: navigator.userAgent,
            list: errors
          }
          new Image().src = `http://127.0.0.1:7001/public/mo.gif?data=${btoa(JSON.stringify(reportData))}`
          resetErrors()
        }
        if(requestIdleCallback) {
          requestIdleCallback(handle)
        } else {
          handle()
        }
      } catch (err) {}
    }, Number(getConfig('reportInterval')))
  }

  if(requestIdleCallback) {
    requestIdleCallback(handle)
  } else {
    handle()
  }
}