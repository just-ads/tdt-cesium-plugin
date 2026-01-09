import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'

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
