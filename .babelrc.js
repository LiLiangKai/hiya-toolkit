module.exports = {
  // exclude: /node_modules/,
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: {
          browsers: [
            'ie >= 11',
            'Chrome >= 21',
            'Firefox >= 1',
            'Edge >= 13',
            'last 3 versions'
          ]
        }
      }
    ]
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-transform-runtime',
    [
      '@babel/plugin-transform-react-jsx',
      {
        pragma: 'React.createElement'
      }
    ]
  ]
}
