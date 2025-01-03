import { defineConfig } from "vite";

export default defineConfig(({ command }) => {
  //dev
  if (command === "serve") {
    return {
      root: "example",
      server: {
        port: 3000,
      },
    };
  }

  return {
    build: {
      lib: {
        entry: "src/index.js",
        name: "Firebase Realtime Sharing",
        fileName: "firebase-realtime-sharing",
        formats: ["es", "cjs", "umd"],
      },
      rollupOptions: {
        external: ["firebase"],
      },
    },
    plugins: [],
  };
});
