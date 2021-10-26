import { merror } from './console'

export default function listenError () {
  window.addEventListener('error', (e) => {
    merror('[error]: ', e)
  }, true)

  window.addEventListener('unhandledrejection', (e) => {
    merror('[unhandledrejection]: ', e)
  }, true)
}