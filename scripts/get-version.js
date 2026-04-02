const { execSync } = require("node:child_process");

// Get the short version of the git hash
const gitHash = execSync("git rev-parse --short HEAD").toString().trim();

// Write it to stdout
console.log(gitHash);
