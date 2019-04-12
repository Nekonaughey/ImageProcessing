const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => {
  let config = {
    performance: { hints: false }, 
    /*
      ts-loaderを利用してindex.tsxをentryにしたいが、ts-loaderはproject referenceに対応していない
      https://github.com/TypeStrong/ts-loader#projectreferences-boolean-defaultfalse
      この課題が解決するまではトランスパイル後のjsをentryにする。
    */
    entry: { bundle: './dist/index.js' },
    output: {
      path    : path.join(__dirname,'public/js'),
      publicPath        : '/js/',
      filename: '[name].js',
    },
    resolve: {
      modules: [path.resolve(__dirname, './dist'), 'node_modules'],
      // 解決可能な拡張子として、'.ts' と '.tsx' を追加します。
      extensions: [ ".js", ".json"]
    },
    module: {
      rules: [
        {
          exclude: /node_modules/,
          test   : /\.js$/,
          loader : ['babel-loader?cacheDirectory']
        }
      ]
    }
  };

  if (argv.mode === 'development') {
    //開発環境専用の設定
    config.devServer = {
      historyApiFallback: true,
      contentBase       : path.join(__dirname,'public'),
      host              : '0.0.0.0',
      port              : 8081,
      watchOptions      : {
        aggregateTimeout: 300,
        poll            : 1000,
        ignored         : [
            /node_modules/,
            /src/,
        ]
      }
    },

    config.cache = true;
    config.devtool = 'inline-source-map';
  }

  return config;
};
