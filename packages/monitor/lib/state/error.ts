import { TActions } from './action'

export interface IError {
  /** ID */
  ID?: string
  /** 错误类型 */
  type?: string
  /** 事件类型 */
  evenType?: string
  /** 错误信息 */
  message?: string
  /** 错误堆栈 */
  stack?: string
  /** 页面地址 */
  url?: string
  /** 错误时间 */
  date?: number
  /** 数量 */
  count?: number
  /** 出错前行为 */
  actions?: TActions,
  /** 错误文件 */
  file?: {
    /** 行号 */
    lineno?: number
    /** 列号 */
    colno?: number
    /** 文件名|路径 */
    name?: string
  }
}

export type TErrors = Array<IError>

let error: _Error

class _Error {

}

export function getError () {
  return error
}

export default function initError () {
  if(!error) {
    error = new _Error()
  }
  return error
}