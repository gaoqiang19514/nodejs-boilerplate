const path = require("path");

const DIST_PATH = path.resolve(__dirname, "build");

module.exports = {
  mode: "development",
  entry: {
    index: "./src/index.js"
  },
  target: "node",
  output: {
    publicPath: "",
    path: DIST_PATH,
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  }
};
