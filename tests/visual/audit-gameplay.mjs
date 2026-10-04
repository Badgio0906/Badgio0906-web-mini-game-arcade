import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

// Evidence collector, not an automatic approval of arbitrary presentation edits.
// Models/core use exact hashes; mixed renderer/main files get normalized AST diffs
// and require a reviewer to inspect every changed behavior-bearing region.
const baseline = JSON.parse(await readFile('docs/visual/GAMEPLAY_BASELINE.json','utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const printer = ts.createPrinter({removeComments:true});
const named = new Set(['start','begin','title','pause','recordQuit','drop','input','accept','publish','tick','update','effect','sound','trackRewardOffer']);
const properties = new Set(['start','title','move','drop','input','pause','snapshot','inspection','destroy','onUpdate','onEnd','onEvent']);
function regions(text,path) {
  const source=ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true);
  const found=new Map();const counts=new Map();
  const add=(name,node)=>{const index=(counts.get(name)??0)+1;counts.set(name,index);found.set(`${name}#${index}`,printer.printNode(ts.EmitHint.Unspecified,node,source));};
  function walk(node){
    if((ts.isFunctionDeclaration(node)||ts.isMethodDeclaration(node))&&node.name&&named.has(node.name.getText(source)))add(`function:${node.name.getText(source)}`,node);
    if(ts.isPropertyAssignment(node)&&properties.has(node.name.getText(source)))add(`property:${node.name.getText(source)}`,node);
    if(ts.isCallExpression(node)){
      const target=node.expression.getText(source);
      if(target.endsWith('.addEventListener'))add(`listener:${target}:${node.arguments[0]?.getText(source)}`,node);
      else if(/^(run\.(step|start|reset|move|drop|input)|hooks\.(onEnd|onUpdate)|credits\.(consume|requestRewardedCredit)|storage\.(writeNumber|writeBoolean|remove)|audio\.(tone|unlock|destroy|toggleMuted)|controller\.(start|title|move|drop|input|pause|destroy))$/.test(target)||target.endsWith('.trackEvent'))add(`call:${target}`,node);
      else if(target==='setTimeout'||target==='window.setTimeout')add(`timer:${target}`,node);
      if(target==='Math.random'){
        add('global-random-call',node);
        // Exact count/control matters: changing a cosmetic particle loop can
        // shift the shared model RNG even while every model hash stays equal.
        let ancestor=node.parent;
        while(ancestor&&!ts.isFunctionLike(ancestor)){
          if(ts.isForStatement(ancestor)||ts.isForOfStatement(ancestor)||ts.isWhileStatement(ancestor)||ts.isIfStatement(ancestor))add('global-random-control',ancestor);
          ancestor=ancestor.parent;
        }
      }
    }
    if(ts.isPropertyAccessExpression(node)&&node.expression.getText(source)==='Math'&&node.name.text==='random')add('global-random-reference',node);
    if(ts.isNewExpression(node)&&/^(WorkdayRun|TowerRun|EchoRun|SortRun|StorageService|CreditService|TelemetryService|AudioService)$/.test(node.expression.getText(source)))add(`constructor:${node.expression.getText(source)}`,node);
    ts.forEachChild(node,walk);
  }
  walk(source);return found;
}
const immutable=[];const mixed=[];
for(const file of baseline.files){
  const current=await readFile(file.path,'utf8');const digest=sha(current);
  if(file.policy==='byte-identical'){
    let same=digest===file.sha256;let visualIdentityOnly=false;
    if(!same&&/^src\/games\/game00[2-5]\/game\.manifest\.json$/.test(file.path)){
      const original=JSON.parse(execFileSync('git',['show',`${baseline.baseline_commit}:${file.path}`],{encoding:'utf8'}));
      const changed=JSON.parse(current);delete original.visual_identity;delete changed.visual_identity;
      visualIdentityOnly=JSON.stringify(original)===JSON.stringify(changed);same=visualIdentityOnly;
    }
    immutable.push({path:file.path,same,visualIdentityOnly,originalSha256:file.sha256,currentSha256:digest});
  }else if(digest!==file.sha256){
    const original=execFileSync('git',['show',`${baseline.baseline_commit}:${file.path}`],{encoding:'utf8'});
    const before=regions(original,file.path),after=regions(current,file.path);
    const keys=[...new Set([...before.keys(),...after.keys()])];
    const changed=keys.filter(key=>before.get(key)!==after.get(key)).map(key=>({region:key,original:before.get(key)??null,current:after.get(key)??null}));
    mixed.push({path:file.path,behaviorRegionsChanged:changed,manualReviewRequired:true});
  }
}
const report={baselineCommit:baseline.baseline_commit,capturedUtc:new Date().toISOString(),immutablePass:immutable.every(item=>item.same),immutable,mixed,note:'An AST region difference requires source review; art/effect resource changes inside mixed functions can be valid. Zero collected differences does not prove all gameplay is unchanged: inspect the complete git diff, renderer-to-physics alignment and execution tests. Manifest visual_identity exceptions require Main Agent visual acceptance; original hashes are preserved.'};
await writeFile('docs/visual/GAMEPLAY_AUDIT.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({immutablePass:report.immutablePass,immutableFiles:immutable.length,changedMixedFiles:mixed.length,changedBehaviorRegions:mixed.reduce((n,item)=>n+item.behaviorRegionsChanged.length,0)}));
if(!report.immutablePass)process.exitCode=1;
