'use strict';

function sleep (delay = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(void 0)
    }, delay)
  })
}

console.log('test')
export default sleep