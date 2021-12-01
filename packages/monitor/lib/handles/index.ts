import { setConfig, getConfig } from '../core/config'
import { send } from '../core/send'
export * from './hack'

export function handleLoad () {
  setPage()
}

export function handleHashChange (e: HashChangeEvent) {
  setPage()
}

export function handleWillUnload () {
  getConfig('sendOnClose') && send(true)
}

function setPage() {
  setConfig('page', {
    url: location.href,
    time: Date.now()
  })
}