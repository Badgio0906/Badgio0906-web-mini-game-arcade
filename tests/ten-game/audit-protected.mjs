import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import ts from 'typescript';
const baseline=JSON.parse(readFileSync('docs/ten-game/QA/PROTECTED_BASELINE.json','utf8'));
const printer=ts.createPrinter({removeComments:true});
const authorizedEvents=new Set(['milestone_reached','escalation_offered','escalation_accepted','safe_exit']);
function parsed(source){return ts.createSourceFile('TelemetryService.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);}
function union(sf){
 const declaration=sf.statements.find(n=>ts.isTypeAliasDeclaration(n)&&n.name.text==='EventName');
 if(!declaration||!ts.isUnionTypeNode(declaration.type))return null;
 const result=[];for(const type of declaration.type.types){if(!ts.isLiteralTypeNode(type)||!ts.isStringLiteral(type.literal))return null;result.push(type.literal.text);}return result;
}
function withoutEventName(sf){return printer.printFile(ts.factory.updateSourceFile(sf,sf.statements.filter(n=>!(ts.isTypeAliasDeclaration(n)&&n.name.text==='EventName'))));}
const files=baseline.files.map(file=>{
 const raw=readFileSync(file.path);const currentSha256=createHash('sha256').update(raw).digest('hex');
 const byteIdentical=currentSha256===file.sha256;let eventNameOnly=false;let added=[];
 if(!byteIdentical&&file.exception){
  const original=parsed(execFileSync('git',['show',`${baseline.baselineCommit}:${file.path}`],{encoding:'utf8'}));const current=parsed(raw.toString());const a=union(original),b=union(current);
  if(a&&b)added=b.filter(n=>!a.includes(n));
  eventNameOnly=!!a&&!!b&&a.every(n=>b.includes(n))&&new Set(b).size===b.length&&added.every(n=>authorizedEvents.has(n))&&withoutEventName(original)===withoutEventName(current);
 }
 return {path:file.path,originalSha256:file.sha256,currentSha256,byteIdentical,eventNameOnly,addedEvents:added,pass:byteIdentical||eventNameOnly};
});
const report={baselineCommit:baseline.baselineCommit,checkedUtc:new Date().toISOString(),pass:files.every(f=>f.pass),files};
writeFileSync('docs/ten-game/QA/PROTECTED_AUDIT.json',JSON.stringify(report,null,2)+'\n');
if(!report.pass){console.error(JSON.stringify(files.filter(f=>!f.pass),null,2));process.exitCode=1;}else console.log(`PASS: ${files.length} protected comparisons (${files.filter(f=>f.byteIdentical).length} byte-identical, ${files.filter(f=>f.eventNameOnly).length} EventName-only)`);
