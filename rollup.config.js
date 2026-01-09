import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
import { readFileSync } from 'fs'

// Read package.json to generate header from tracked metadata
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const repoUrl = pkg.repository?.url?.replace(/\.git$/, '') || pkg.homepage || ''
const author = pkg.author || ''
const license = pkg.license || ''

const banner = `/*!
 * ${pkg.name}
 * ${repoUrl}
 * @author ${author}
 * @license ${license}
 */`

export default {
    input: 'src/index.js',
    external: (id) => {
        return id === 'cesium' || 
               id === 'protobufjs' || 
               id.startsWith('pako/') ||
               id === 'pako';
    },
    output: [{
        name: 'TdtPlug',
        file: 'dist/tdtplug.umd.js',
        format: 'umd',
        sourcemap: true,
        banner,
        globals: {
            cesium: 'Cesium'
        }
    }, {
        file: 'dist/tdtplug.es.js',
        format: 'esm',
        sourcemap: true,
        banner
    }],
    plugins: [
        resolve(),
        commonjs(),
        babel(),
        terser({
            format: {
                comments: /^!/
            }
        })
    ]
}
