import{relative,isAbsolute,sep}from'node:path';
/** Portable containment for Windows and POSIX; never compare native paths with a literal slash. */
export function isWithin(root,file,path={relative,isAbsolute,sep}){const r=path.relative(root,file);return r!=='..'&&!r.startsWith('..'+path.sep)&&!path.isAbsolute(r);}
