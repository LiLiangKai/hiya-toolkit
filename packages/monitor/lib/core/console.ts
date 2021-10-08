import replaceOriginal from "../utils/replaceOriginal";
import { getEnableLog } from '../state/log'

export default function replaceConsole () {
  replaceOriginal(console, 'log', (originFn) => {
  return (...arg) => {
    if(!getEnableLog('log')) return
    return originFn(`[hiya monitor log]: `, ...arg)
  }
})

replaceOriginal(console, 'error', (originFn) => {
  return (...arg) => {
    if(!getEnableLog('error')) return
    return originFn(`[hiya monitor error]: `, ...arg)
  }
})

replaceOriginal(console, 'warn', (originFn) => {
  return (...arg) => {
    if(!getEnableLog('warn')) return
    return originFn(`[hiya monitor warn]: `, ...arg)
  }
})
}