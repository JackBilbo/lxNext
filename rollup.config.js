import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import css from 'rollup-plugin-import-css';
import styles from "rollup-plugin-styles";

export default {
    input: {
        'main/bundle': 'src/main/main.tsx',
        'vario/bundle': 'src/vario/main.tsx'
    },
    output: {
        dir: 'gotfriends-discus2c-premium-lxn/html_ui/Pages/VCockpit/Instruments/lxNext',
        assetFileNames: "assets/[name][extname]",
        format: 'es',
        entryFileNames: '[name].js'
    },
    plugins: [
        css({ output: 'styles.css' }), resolve(), typescript(), 
        styles({
            // ... or with relative to output dir/output file's basedir (but not outside of it)
            mode: ["extract", "styles.css"],
         })
    ]
}