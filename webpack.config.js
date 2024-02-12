const path = require('path');
module.exports = {
    entry: './lambda.js',
    target: 'node',
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'rest-api-bundle.js',
        libraryTarget: 'commonjs2', 
        chunkFormat: 'array-push',
    },
    optimization: {
        minimize: true, // Optional: Minify the bundle
    },
};
