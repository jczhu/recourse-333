// require our dependencies
var path = require('path')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')

module.exports = {
	// the base directory (absolute path) for resolving the entry option
	context: __dirname,
	// the entry points we created earlier
	entry: './assets/js/index',

	output: {
		// where you want your compiled bundle to be stored
		path: path.resolve('./assets/bundles/'),
		//naming convention webpack should use for files
		filename: '[name]-[hash].js',
	},

	plugins: [
		//tells webpack where to store data about your bundles
		new BundleTracker({filename: './webpack-stats.json'}),

		// makes jQuery availabe in every module
		new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery',
			'window.jQuery': 'jquery'
		})
	],

	module: {
		loaders: [
			// a regexp that tells webpack use the following loaders on all
			// .js and .jsx files
			{test: /\.jsx?$/,
				// don't want babel to transpile all the files in
				// node_modules since would take while
				exclude: /node_modules/,
				//use babel loader
				loader: 'babel-loader',
				query: {
					// specify that we will be dealing with React code

					presets: ['react']
				}
			},
		]
	},

	resolve: {
		// tells webpack where to look for modules
		//modulesDirectories: ['node_modules'],

		//extensions that should be used to resolve modules
		extensions: ['*', '.js', '.jsx']
	}
}
