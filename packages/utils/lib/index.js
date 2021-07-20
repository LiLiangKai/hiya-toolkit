'use strict';

const pkg = require('../package.json')

function sleep (delay = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, delay)
  })
}

module.exports = {
  sleep,
  version: pkg.version
}