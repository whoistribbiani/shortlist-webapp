import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const ghBase = repoName ? `/${repoName}/` : "/";

export default defineConfig({
  base: isGithubActions ? ghBase : "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"]
  }
});
