'use strict';

import initState from './state/init'
import stateActions from './state'
// import replaceConsole from './core/console'
import listenError from './core/listenError'
import report from './core/report'
import { IMonitorOption } from './types'

function getDefaultOption () {
  const defaultOption: IMonitorOption = {
    enableLog: '1|1|1'
  }
  return defaultOption
}

/**
 * 初始化
 * @param {IMonitorOption} option 
 */
export default function initMonitor (option?: IMonitorOption) {
  option = Object.assign({}, getDefaultOption(), option)
  initState(option)
  // replaceConsole()
  listenError()
  setTimeout(() => {
    report()
  }, 10)
  const hiya_monitor = {
    ...stateActions,
  }
  // @ts-ignore
  window.hiya_monitor = hiya_monitor
}

// @ts-ignore
window.initMonitor = initMonitor