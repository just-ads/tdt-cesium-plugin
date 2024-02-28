import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'

export default {
    input: 'src/index.js',
    external: ['cesium'],
    output: [{
        name: 'TdtPlug',
        file: 'dist/tdtplug.umd.js',
        format: 'umd',
        sourcemap: true,
        globals: {
            cesium: 'Cesium'
        }
    }, {
        file: 'dist/tdtplug.es.js',
        format: 'esm',
        sourcemap: false
    }],
    plugins: [
        resolve(),
        commonjs(),
        babel()
    ]
}
