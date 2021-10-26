'use strict';

import { allConfig, getConfig, setConfig, initConfig } from './state/config'
import initError from './state/error'
import initAction from './state/action'
import listenError from './core/listenError'
import listenAction from './core/listenAction'
import { report, autoReport } from './core/report'
import { IMonitorOption } from './types'
import { minfo,merror,mwarn } from './core/console'

export {
  minfo,
  mwarn,
  merror,
  getConfig,
  setConfig,
  report
}

function getDefaultOption () {
  return allConfig()
}

/**
 * 初始化
 * @param {IMonitorOption} option 
 */
export default function initMonitor (option?: IMonitorOption) {
  option = Object.assign({}, getDefaultOption(), option)
  initConfig(option)
  initAction()
  initError()
  listenError()
  listenAction()
  autoReport()
  
  const hiya_monitor = {
    minfo,
    mwarn,
    merror,
    allConfig,
    getConfig,
    setConfig,
    report
  }

  // @ts-ignore
  window.hiya_monitor = hiya_monitor
  minfo('hiya monitor init finish!')
}

// @ts-ignore
window.initMonitor = initMonitor