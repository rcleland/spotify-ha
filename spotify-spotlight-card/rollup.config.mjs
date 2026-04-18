import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/spotify-spotlight-card.ts",
  output: {
    file: "dist/spotify-spotlight-card.js",
    format: "es",
    sourcemap: true,
  },
  plugins: [
    resolve({ browser: true }),
    typescript({ tsconfig: "./tsconfig.json" }),
  ],
};
