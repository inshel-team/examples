const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    index: [
      'babel-polyfill', 
      path.join(process.cwd(), 'src',  'index.js')
    ]
  },
  output: {
    path: path.join(process.cwd(), 'target', 'client')
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
            ],
            '@babel/preset-react'
          ],
          plugins: [
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-export-default-from',
            '@babel/plugin-proposal-object-rest-spread',
            '@babel/plugin-syntax-dynamic-import',
            'react-hot-loader/babel'
          ]
        }
      },
      {
        test: /\.(woff2?|ttf|eot|svg|png|jpg|jpeg)$/,
        loader: 'url-loader?limit=1000'
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ title: '@inshel/react-examples' }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'static'),
    compress: true,
    port: 3000,
    hot: true
  }
};