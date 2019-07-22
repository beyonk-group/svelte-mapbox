import svelte from 'rollup-plugin-svelte'
import pkg from './package.json'
import serve from 'rollup-plugin-serve'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import css from 'rollup-plugin-postcss'
import html from '@beyonk/rollup-plugin-html-esm'
import replace from 'rollup-plugin-replace'
import svg from 'rollup-plugin-svg'
import json from 'rollup-plugin-json'

const name = pkg.name
	.replace(/^(@\S+\/)?(svelte-)?(\S+)/, '$3')
	.replace(/^\w/, m => m.toUpperCase())
	.replace(/-\w/g, m => m[1].toUpperCase());

const dev = process.env.NODE_ENV === 'development'

const plugins = [
	json(),
	resolve(),
	commonjs(),
	css(),
	svelte()
]

let output = [
	{ dir: 'dist', format: 'es', entryFileNames: 'components.mjs' }
]

if (dev) {
	plugins.unshift(
		replace({
			API_KEY: process.env.API_KEY,
			include: 'demo/Demo.svelte',
			delimiters: ['%', '%']
		}),
		svg(),
	)
	plugins.push(
		html({
			template: 'demo/index.html',  // Default undefined
      filename: 'index.html', // Default index.html
      publicPath: 'dist' // Default undefined
		}),
		serve({
			contentBase: 'dist',
			port: 12001
		})
	)
	output = [
		{ dir: 'dist', format: 'esm', entryFileNames: 'components.js' }
	]
}

export default {
	input: dev ? 'demo/demo.js' : 'src/components.js',
	output,
	plugins
}
