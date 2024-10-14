import dotenv from 'dotenv';
dotenv.config();

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import styles from "rollup-plugin-styles";
import commonjs from '@rollup/plugin-commonjs';
import {terser} from 'rollup-plugin-terser';

export default {
    input: {
        'main': 'src/panel/main.tsx'
    },
    output: {
        dir: 'dist/',
        assetFileNames: "[name][extname]",
        format: 'es',
        entryFileNames: '[name].js'
    },
    plugins: [
        resolve(), 
        typescript(),
        commonjs(), 
        terser(),
        styles({
            mode: ["extract", "styles.css"],
         })
    ]
}