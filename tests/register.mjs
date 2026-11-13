// Test-only TypeScript/path-alias loader; production still uses Next.js.
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';
const projectRoot=process.cwd();
registerHooks({
  resolve(specifier,context,next) {
    if(specifier === 'next/server') return next('next/server.js',context);
    if(specifier === 'server-only') return {url:'data:text/javascript,export {};',shortCircuit:true};
    if(specifier.startsWith('@/') || (specifier.startsWith('.') && context.parentURL?.startsWith('file:'))) {
      const base=specifier.startsWith('@/')?resolve(projectRoot,specifier.slice(2)):resolve(dirname(fileURLToPath(context.parentURL)),specifier);
      for(const candidate of [base,base+'.ts',base+'.tsx',base+'/index.ts']) if(existsSync(candidate) && /\.(?:ts|tsx)$/.test(candidate)) return {url:pathToFileURL(candidate).href,shortCircuit:true};
    }
    return next(specifier,context);
  },
  load(url,context,next) {
    if(url.startsWith('file:') && /\.tsx?$/.test(url)) return {format:'module',source:ts.transpileModule(readFileSync(fileURLToPath(url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText,shortCircuit:true};
    return next(url,context);
  }
});
