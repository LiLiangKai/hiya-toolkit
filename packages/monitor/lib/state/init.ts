import { initEnableLog } from './log'
import { IMonitorOption } from '../types'

/**
 * 
 * @param {IMonitorOption} option 
 */
export default function initState (option: IMonitorOption) {
  initEnableLog(option?.enableLog)
}