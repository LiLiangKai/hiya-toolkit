import fs from 'fs-extra'
import { join } from 'path'
import typescript from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import { sizeSnapshot } from 'rollup-plugin-size-snapshot'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import glob from 'glob'

const ROOT = join(__dirname, '..')

function getAllPackageNames () {
  const files = glob.sync(join(ROOT, 'packages/*/package.json'))
  return files.filter(f => !f.legacy).map(f => {
    return require(f).name
  })
}
function stringToCamelCase (str) {
  const reg = /-(\w)/g
  return str.replace(reg, function ($0, $1) {
    return $1.toUpperCase()
  })
}
function rollupDel (pkg) {
  return {
    name: 'delete',
    buildStart: () => {
      fs.removeSync(pkg)
      console.log(`${pkg} has been delete`)
    }
  }
}

const CWD = process.cwd()

const pkg = require(join(CWD, './package.json'))

const libName = pkg.name
const version = pkg.version
const banner =
    `/*!
 * ${libName} v${version}
 * Copyright© ${new Date().getFullYear()} Hiya
 */
`
const moduleName = stringToCamelCase(libName)
export default {
  input: join(CWD, 'lib/index.ts'),
  output: [
    {
      exports: 'named',
      name: libName,
      banner,
      format: 'umd',
      amd: {
        id: libName
      },
      file: join(CWD, 'dist/index.cjs.js')
    },
    {
      exports: 'named',
      name: libName,
      banner,
      format: 'es',
      file: join(CWD, 'dist/index.es.js')
    }
  ],
  plugins: [
    rollupDel(join(CWD, 'dist')), /** 删除dist文件 */
    nodeResolve(),
    json(),
    replace({
      'process.env.ENV': JSON.stringify(process.env.ENV || 'pro'),
      'process.env.PKG_VERSION': version
    }),
    commonjs({
      include: 'node_modules/**'
    }),
    terser(),
    typescript({
      clean: true,
      cacheRoot: join(ROOT, `node_modules/.rpt2_cache`),
      check: false,
      verbosity: 1,
      objectHashIgnoreUnknownHack: true,
      tsconfigOverride: {
        compilerOptions: {
          baseUrl: CWD,
          module: 'esnext',
          outDir: './ dist',
          // 导出定义文件
          declaration: true
        },
        include: [join(CWD, './lib/**/*.ts')]
      },
      typescript: require('typescript')
    }),
    babel({
      babelrc: join(ROOT, 'babelrc.js')
    }),
    sizeSnapshot(),
  ],
  external: [
    'react',
    'react-dom',
    'react-router',
    'react-redux',
    'react-router-dom',
    'axios',
  ].concat(getAllPackageNames())
}

