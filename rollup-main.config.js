import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import styles from "rollup-plugin-styles";
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: {
        'main': 'src/main/main.tsx'
    },
    output: {
        dir: 'gotfriends-discus2c-premium-lxnext/html_ui/Pages/VCockpit/Instruments/lxNext/',
        assetFileNames: "main/[name][extname]",
        format: 'es',
        entryFileNames: 'main/[name].js'
    },
    plugins: [
        resolve(), 
        typescript(),
        commonjs(), 
        styles({
            mode: ["extract", "styles.css"],
         })
    ]
}