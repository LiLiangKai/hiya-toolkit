export interface IEnableLog {
  log?: boolean
  warn?: boolean
  error?: boolean
}

const stateEnableLog: IEnableLog = {
  log: true,
  warn: true,
  error: true
}

/**
 * 初始化打印对象
 * @param enableLog 支持 '1|1|1' 或 [1,1,1] 或 {log:true,warn:true,error:true}
 */
export function initEnableLog (enableLog: string | Array<string|boolean|number> | IEnableLog = stateEnableLog) {
  if(typeof enableLog === 'string') {
    enableLog = enableLog.split('|')
  }
  if(Array.isArray(enableLog)) {
    enableLog = {
      log: !!enableLog[0] || stateEnableLog.log,
      warn: !!enableLog[1] || stateEnableLog.warn,
      error: !!enableLog[2] || stateEnableLog.error
    }
  }
  Object.assign(stateEnableLog, enableLog)
}

/**
 * 获取打印对象
 * @param key 
 */
export function getEnableLog (key?: keyof IEnableLog) {
  if(!key) return stateEnableLog
  return stateEnableLog[key]
}

export function setEnableLog (key: keyof IEnableLog, value: boolean) 
export function setEnableLog (enableLog?: string | Array<string|boolean> | IEnableLog)
/**
 * 设置打印对象
 * @param arg 
 */
export function setEnableLog (...args) {
  if(args.length === 1) {
    initEnableLog(...args)
  } else {
    const [key, value] = args
    stateEnableLog[key] = !!value
  }
}
