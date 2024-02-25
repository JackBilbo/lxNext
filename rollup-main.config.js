import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import styles from "rollup-plugin-styles";

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
        styles({
            mode: ["extract", "styles.css"],
         })
    ]
}