import { defineConfig } from "vite";
import { vitePluginGraphqlLoader } from 'vite-plugin-graphql-loader';

export default defineConfig({
    plugins: [vitePluginGraphqlLoader()],
});