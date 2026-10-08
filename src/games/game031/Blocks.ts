export interface BlockDefinition {
  id:number; name:string; color:number; hardness:number; solid:boolean;
  breakable:boolean; placeable:boolean; sound:'soil'|'stone'|'crystal'; particle:number;
}
export const BLOCKS:readonly BlockDefinition[]=[
  {id:0,name:'空気',color:0xffffff,hardness:0,solid:false,breakable:false,placeable:false,sound:'soil',particle:0xffffff},
  {id:1,name:'苔土',color:0x518d7b,hardness:.30,solid:true,breakable:true,placeable:true,sound:'soil',particle:0x518d7b},
  {id:2,name:'土',color:0x957451,hardness:.30,solid:true,breakable:true,placeable:true,sound:'soil',particle:0x957451},
  {id:3,name:'石',color:0x70869a,hardness:.55,solid:true,breakable:true,placeable:true,sound:'stone',particle:0x70869a},
  {id:4,name:'白石',color:0xd8d5bd,hardness:.50,solid:true,breakable:true,placeable:true,sound:'stone',particle:0xd8d5bd},
  {id:5,name:'深部岩',color:0x39485c,hardness:.70,solid:true,breakable:true,placeable:true,sound:'stone',particle:0x39485c},
  {id:6,name:'青結晶',color:0x49c3d1,hardness:.80,solid:true,breakable:true,placeable:true,sound:'crystal',particle:0x49c3d1},
  {id:7,name:'琥珀鉱',color:0xc19a55,hardness:.80,solid:true,breakable:true,placeable:true,sound:'crystal',particle:0xc19a55},
  {id:8,name:'暗色結晶',color:0x79588e,hardness:.80,solid:true,breakable:true,placeable:true,sound:'crystal',particle:0x79588e},
  {id:9,name:'境界材',color:0x314d50,hardness:Infinity,solid:true,breakable:false,placeable:false,sound:'stone',particle:0x314d50},
];
export const inventory=():number[]=>Array(10).fill(0);
