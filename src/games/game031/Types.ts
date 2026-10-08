export interface Vec3 { x:number; y:number; z:number }
export interface Dimensions { x:number; y:number; z:number }
export interface Player { position:Vec3; velocity:Vec3; yaw:number; pitch:number; grounded:boolean }
export interface WorldStats { mined:number; placed:number; maxDepth:number; activeSeconds:number; found:number[] }
export interface ChunkDiff { key:string; cells:number[] }
export interface Snapshot { schemaVersion:1; generatorVersion:1; blockVersion:1; worldId:string; seed:number; dimensions:Dimensions; revision:number; savedAt:string; player:Player; inventory:number[]; selected:number; stats:WorldStats; chunks:ChunkDiff[] }
export interface Target { x:number; y:number; z:number; block:number; normal:Vec3; distance:number }
export const CHUNK=16, GENERATOR_VERSION=1, BLOCK_VERSION=1, SAVE_SCHEMA_VERSION=1;
export const FINAL_DIMENSIONS:Dimensions={x:128,y:64,z:128};
export const freshStats=():WorldStats=>({mined:0,placed:0,maxDepth:0,activeSeconds:0,found:[]});
