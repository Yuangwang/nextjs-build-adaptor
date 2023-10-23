#!/usr/bin/env node
const fs = require("fs");
const cp = require("child_process");
const path = require("path");
const yaml = require("js-yaml");

setStandaloneBuildMode();
buildNextjsApp();
const dir = process.cwd();
// see https://nextjs.org/docs/pages/api-reference/next-config-js/output#automatically-copying-traced-files for more info
createFirestackBuildAndCopyBuildOutput(dir);
// needed for image optimization
cp.execSync("npm i sharp");
generateBundleYaml(dir);

function generateBundleYaml(dir) {
  const manifest = JSON.parse(
    fs.readFileSync(`${dir}/.next/routes-manifest.json`)
  );
  const {
    headers: nextJsHeaders = [],
    redirects: nextJsRedirects = [],
    rewrites: nextJsRewrites = [],
  } = manifest;
  fs.writeFileSync(
    `${dir}/.firestack_build/bundle.yaml`,
    yaml.dump({
      headers: nextJsHeaders,
      redirects: nextJsRedirects,
      rewrites: nextJsRewrites,
    })
  );
}

function createFirestackBuildAndCopyBuildOutput(dir) {
  if (!fs.existsSync(`${dir}/.firestack_build`)) {
    fs.mkdirSync(`${dir}/.firestack_build`);
  }

  fs.cpSync(`${dir}/.next/standalone`, `${dir}/.firestack_build`, {
    recursive: true,
  });
  fs.cpSync(`${dir}/public`, `${dir}/.firestack_build/public`, {
    recursive: true,
  });
  fs.cpSync(`${dir}/.next/static`, `${dir}/.firestack_build/.next/static`, {
    recursive: true,
  });
}

function setStandaloneBuildMode() {
  // Equivalent to setting `target: "standalone"` in next.config.js
  process.env.NEXT_PRIVATE_STANDALONE = "true";
}

function buildNextjsApp() {
  cp.execSync("npm run build", {
    stdio: "inherit",
    cwd: path.dirname("./package.json"),
  });
}
