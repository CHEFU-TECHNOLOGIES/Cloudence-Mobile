const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Load app TypeScript with small native API adapters, without a device runtime.
module.exports = function createLoader(stubs = {}, globals = {}) {
  const modules = new Map();
  function load(name) {
    const filename = path.resolve(__dirname, '..', name);
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} };
    modules.set(filename, module);
    const requireModule = (request) => {
      if (Object.hasOwn(stubs, request)) return stubs[request];
      if (request.startsWith('.')) {
        const target = path.resolve(path.dirname(filename), request);
        const resolved = ['.ts', '.tsx', ''].map(ext => target + ext).find(file => fs.existsSync(file));
        return load(path.relative(path.resolve(__dirname, '..'), resolved));
      }
      return require(request);
    };
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, require: requireModule,
      console, Date, Map, Set, Promise, URL, AbortController, setTimeout, clearTimeout, ...globals }, { filename });
    return module.exports;
  }
  return load;
};
