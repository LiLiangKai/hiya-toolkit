import { minfo } from './console'
import { getConfig } from '../state/config'
import { TErrors } from '../state/error'

export interface IReportMeta {
  UID?: string
  sdkVersion?: string
  origin?: string
  appID?: string
  date?: number
  data?: TErrors
}

export function report () {
  const msg = {
    ...getCommonMsg()
  }
  minfo(msg)
}

export function autoReport () {
  
}

function getCommonMsg (): IReportMeta {
  return {
    UID: getConfig('UID')??'',
    sdkVersion: 'process.env.PKG_VERSION',
    appID: getConfig('appID')??'',
    origin: location.origin,
    date: Date.now()
  }
}