const fs = require("fs");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.scripts = {
  ...pkg.scripts,
  format: "prettier --write .",
  "format:check": "prettier --check .",
};
pkg.devDependencies = {
  ...pkg.devDependencies,
  prettier: "^3.5.3",
};
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n", {
  encoding: "utf8",
});

const prettierRc = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: "always",
  endOfLine: "lf",
};
fs.writeFileSync(".prettierrc", JSON.stringify(prettierRc, null, 2) + "\n", {
  encoding: "utf8",
});

const prettierIgnore = `node_modules
.turbo
dist
build
.next
out
coverage
.nyc_output
package-lock.json
*.tsbuildinfo
.env
.env.*
!.env.example
apps/api/generated
.prisma
*.log
pnpm-lock.yaml
yarn.lock
`;
fs.writeFileSync(".prettierignore", prettierIgnore, { encoding: "utf8" });

console.log("prettier config written");
