const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: {
    index: [
      'babel-polyfill', 
      path.join(process.cwd(), 'src',  'server.js')
    ]
  },
  output: {
    path: path.join(process.cwd(), 'target', 'server')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: [
            [
              '@babel/preset-env',
              {
                targets: '> 0.25%, not ie 11, not op_mini all, not dead'
              }
            ]
          ],
          plugins: [
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-export-default-from',
            '@babel/plugin-proposal-object-rest-spread',
            '@babel/plugin-syntax-dynamic-import'
          ]
        }
      }
    ]
  }
};