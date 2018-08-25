var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var extractplugin = new ExtractTextPlugin({
	filename: '[name].css' ,
	allChunks: true,
});

var webpack = require('webpack');



module.exports = {
	devtool: 'source-map-inline' ,
	entry: {
		app: './src/js/app.js',
		index: './src/js/index.js'
	} ,
	output:{
		path: path.resolve(__dirname , 'dist') ,
		filename: '[name].bundle.js',
	} ,
	module:{
		rules:[
		{
			test: /\.js$/,
			use: [
			{
				loader: 'babel-loader' ,
				options: {
					presets: ['es2015']
				}
			}
			]
		},
		{
			test: /\.css$/ ,
			use: extractplugin.extract({
				use: ['css-loader']
			})

		},
		{
			test: /\.(scss)$/,
			use: extractplugin.extract(
				[
				{
					loader: 'css-loader',
					options:{
						sourceMap: true
					}
				},
				{
					loader: 'postcss-loader',
					options: {
						plugins: function () {
							return [
							require('precss'),
							require('autoprefixer')
							];
						} , sourceMap: true
					}
				},
				// {
				// 	loader: 'raw-loader'
				// },
				{
					loader: 'sass-loader' ,
					options: {
						includePaths: [
						path.resolve(__dirname, "./node_modules/compass-mixins/lib") ,
						path.resolve(__dirname, "./node_modules/susy/sass") ,
						path.resolve(__dirname, "./node_modules/breakpoint-sass/stylesheets")
					] ,
					sourceMap: true
					}
				}

				]
				)
		},
		{
			test: /\.(ttf|eot|woff|woff2)$/,
			loader: "file-loader",
			options: {
				name: "fonts/[name].[ext]",
			},
		},
		{
			test: /\.html$/ ,
			use: ['html-loader']
		} ,
		{
			test: /\.(jpg|png|JPG|svg|gif)$/ ,
			use: [
			{
				loader: 'file-loader' ,
				options: {
					name: '[name].[ext]',
					outputPath: 'img/',
					publicPath: ''
				}
			}
			]
		},
		{
			test: /\.(json)$/ ,
			use: [
			{
				loader: 'file-loader' ,
				options: {
					name: '[name].[ext]'
					// outputPath: 'img/',
					// publicPath: ''
				}
			}
			]
		},
		{
			test: /\.html$/ ,
			use: [
			{
				loader: 'file-loader' ,
				options: {
					name: '[name].[ext]'
                            // outputPath: '',
                            // publicPath: 'img/'
                        }
                    }
                    ] ,
                    exclude: [path.resolve(__dirname , 'src/index.html')]
                }
                ]
            } ,


            plugins:[
            extractplugin ,
            new HtmlWebpackPlugin({
            	filename: 'index.html',
            	template: 'src/index.html',
            	chunks: ['app' , 'index']
            }),
            new CleanWebpackPlugin([ 'dist' ]) ,
            new webpack.ProvidePlugin({
            	$: 'jquery' ,
            	jQuery: 'jquery'
            })
            ]
        };
