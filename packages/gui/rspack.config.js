require('dotenv').config();
const rspack = require('@rspack/core');
const path = require('path');
const devMode = process.env.NODE_ENV === 'development';
const outputPath = path.resolve(__dirname, devMode ? 'dist' : '../server/public');

const mode = devMode ? 'development' : 'production';
console.log(`Working in ${mode} mode, server URL ${devMode ? process.env.SERVER_URL : './'}.`);

module.exports = {
  mode,
  entry: {
    main: './src/app.ts',
  },
  devServer: {
    port: 8341,
  },
  builtins: {
    define: {
      'process.env.NODE_ENV': "'development'",
      'process.env.SERVER_URL': `"${devMode ? process.env.SERVER_URL : './'}"`,
      'process.env.SERVER_PATH': `"${process.env.SERVER_PATH || ''}"`,
      // 'process.env.VECTOR_TILE_SERVER': `"${process.env.VECTOR_TILE_SERVER}"`,
    },
    html: [
      {
        title: 'SAFR',
        // publicPath: devMode ? undefined : '',
        scriptLoading: 'defer',
        minify: !devMode,
        favicon: 'favicon.ico',
        meta: {
          viewport: 'width=device-width, initial-scale=1',
          'Content-Security-Policy': {
            'http-equiv': 'Permissions-Policy',
            content: 'interest-cohort=(), user-id=()',
          },
          'og:title': 'SAFR',
          'og:description': `Situational Awareness (SA) and Command & Control (C2) tool for First Responders (FR): Running in ${mode} mode.`,
          'og:url': 'https://github.com/TNO/c2app',
          'og:site_name': 'SAFR',
          'og:image:alt': 'SAFR',
          'og:image': './src/assets/safr.svg',
          'og:image:type': 'image/svg',
          'og:image:width': '200',
          'og:image:height': '200',
        },
      },
    ],
    // plugins: [
    //   new rspack.HtmlRspackPlugin([
    //     {
    //       title: 'SAFR',
    //       publicPath: devMode ? undefined : '/',
    //       scriptLoading: 'defer',
    //       minify: !devMode,
    //       favicon: './src/favicon.ico',
    //       meta: {
    //         viewport: 'width=device-width, initial-scale=1',
    //         'Content-Security-Policy': {
    //           'http-equiv': 'Permissions-Policy',
    //           content: 'interest-cohort=(), user-id=()',
    //         },
    //         'og:title': 'SAFR',
    //         'og:description': 'Situational Awareness (SA) and Command & Control (C2) tool for First Responders (FR)',
    //         'og:url': 'https://tno.github.io/scenario-spark/',
    //         'og:site_name': 'SAFR',
    //         'og:image:alt': 'SAFR',
    //         'og:image': './src/assets/safr.svg',
    //         'og:image:type': 'image/svg',
    //         'og:image:width': '200',
    //         'og:image:height': '200',
    //       },
    //     },
    //   ]),
    // ],
    minifyOptions: devMode
      ? undefined
      : {
          passes: 3,
          dropConsole: false,
        },
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /^BUILD_ID$/,
        type: 'asset/source',
      },
    ],
  },
  output: {
    filename: 'main.js',
    path: outputPath,
  },
};
