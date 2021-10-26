export type TActionType = 'page.load' | 'page.change' | 'ui.click' | 'fetch.xhr'

export interface IAction {
  /** 行为类型 */
  type?: TActionType
  /** 触发元素 */
  target?: string
  /** 页面地址 */
  url?: string
  /** 触发时间 */
  date?: number
}

export type TActions = Array<IAction>

let action: _Action

class _Action {}

export function getAction () {
  return action
}

export default function initAction () {
  if(!action) {
    action = new _Action()
  }
  return action
}