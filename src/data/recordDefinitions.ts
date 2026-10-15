/** Comparison rules only: this module has no browser/game-engine dependencies. */
export interface RecordDefinition {
  readonly gameId: string;
  readonly metricId: string;
  readonly metricLabel: string;
  readonly unit: string;
  readonly direction: 'higher' | 'lower';
  /** Stored integer = displayed value * storageScale. */
  readonly storageScale: number;
  readonly displayPrecision: number;
  readonly rulesetId: string;
  readonly modeId: string;
  readonly modeLabel: string;
  readonly assistancePolicy: 'none' | 'allowed';
  readonly localLabel: string;
  readonly publicEnabled: boolean;
  readonly boardId: string;
  readonly maxValue: number;
  readonly pendingAbove: number;
}
type Entry = readonly [string, string, string, string, string, boolean, string?, number?, number?, number?, string?, string?];
// [ID, metric, label, unit, rules, public, localLabel, scale, max, pending, mode, modeLabel]
const entries: readonly Entry[] = [
  ['game001','score','最高スコア','点','1',true],
  ['game002','score','最終スコア','点','2',true],
  ['game003','floors','階数','階','3',true],
  ['game004','level','到達LEVEL','LEVEL','1',true],
  ['game005','score','仕分けスコア','点','2',true],
  ['game006','score','スコア','点','3',true],
  ['game007','score','配達点','点','2',true],
  ['game008','score','配達点','点','2',true,undefined,1,8560,8560],
  ['game009','score','スコア','点','3',true],
  ['game011','score','最高スコア','点','2',true],
  ['game012','score','最高スコア','点','1',true,undefined,1,Number.MAX_SAFE_INTEGER,1000000,'normal','通常プレイ'],
  ['game013','score','スコア・補助なし','点','1',true,undefined,1,11400,11400,'normal','通常プレイ・OJTなし'],
  ['game014','successes','成功回数','回','1',true,undefined,1,25,25,'normal','通常プレイ'],
  ['game015','depth','最大深度','m','04',true],
  ['game016','score','最高スコア','点','1',true],
  ['game017','score','最高スコア','点','2',true],
  ['game018','distance','飛距離・全靴','m','1',true,undefined,10,Number.MAX_SAFE_INTEGER,1000000000,'all-shoes','全靴'],
  ['game019','height','最高到達高度','m','2',true,undefined,10,2000,2000],
  ['game020','clears','クリア盤面数','盤面','1',false,'あなたの記録',1,1000000],
  ['game021','matches','対局数','局','1',false,'あなたの記録',1,72000000],
  ['game022','clears','クリア回数','回','klondike-v1',false,'あなたの記録',1,1000000000],
  ['game023','words_seen','出会ったことば','語','1',false,'あなたの記録',1,180],
  ['game024','foods','餌数・ゆっくり','個','2',true,undefined,1,397,397,'speed-4','ゆっくり（毎秒4マス）'],
  ['game025','clears','クリア回数','回','1',false,'あなたの記録',1,1000000],
  ['game026','matches','対局数','局','1',false,'あなたの記録',1,100000000],
  ['game027','matches','対局数','局','1',false,'あなたの記録',1,1000000000],
  ['game028','rally','ラリー記録','回','1',false,'あなたの記録'],
  ['game029','score','帰宅時スコア','点','1',true,undefined,1,1000000000],
  ['game030','stages','クリア済ステージ','ステージ','1',false,'あなたの記録',1,20],
  ['game031','mined','採掘数','個','1',false,'この世界の記録'],
  ['game032','score','総合スコア','点','1',true,undefined,1,100000,50000,'standard','5分釣行'],
  ['game033','score','花火大会スコア','点','1',true,undefined,1,1000000,100000,'standard','100秒花火大会'],
  ['game034','score','8現場の合計','点','1',true,undefined,1,20000,20000,'all','全8現場'],
  ['game035','score','3エンド合計','点','1',true,undefined,1,15000,15000,'main','3エンド'],
];
const define = (source: readonly Entry[]): readonly RecordDefinition[] => Object.freeze(source.map(([gameId,metricId,metricLabel,unit,rulesetId,publicEnabled,localLabel,scale,max,pending,modeId,modeLabel]) => Object.freeze({
  gameId, metricId, metricLabel, unit, direction: 'higher' as const,
  storageScale: scale ?? 1, displayPrecision: scale === 10 ? 1 : 0,
  rulesetId, modeId: modeId ?? 'all', modeLabel: modeLabel ?? '全モード',
  assistancePolicy: ['game012','game013','game014','game024','game032'].includes(gameId) ? 'none' as const : 'allowed' as const,
  localLabel: localLabel ?? 'あなたのBEST', publicEnabled,
  boardId: `${gameId}.${metricId}.r${rulesetId}.${modeId ?? 'all'}`,
  maxValue: max ?? Number.MAX_SAFE_INTEGER, pendingAbove: pending ?? Math.min(max ?? Number.MAX_SAFE_INTEGER,1000000),
})));
export const recordDefinitions = define(entries);
/** Previous boards remain readable and registered; new rules never overwrite their scores. */
export const historicalRecordBoards = define([
  ['game005','sorted','仕分け数','個','1',true],
  ['game006','score','スコア','点','2',true],
  ['game009','score','スコア','点','2',true],
  ['game017','score','最高スコア','点','1',true],
  ['game002','score','最終スコア','点','1',true],
  ['game003','floors','階数','階','2',true],
  ['game015','depth','最大深度','m','03',true],
  ['game024','foods','餌数・ゆっくり','個','1',true,undefined,1,397,397,'speed-4','ゆっくり（毎秒4マス）'],
]);
export const recordBoards: readonly RecordDefinition[] = Object.freeze([...historicalRecordBoards, ...recordDefinitions.filter(d => d.publicEnabled)].sort((a,b)=>a.gameId.localeCompare(b.gameId)||a.rulesetId.localeCompare(b.rulesetId)));
export function getRecordDefinition(gameId: string): RecordDefinition | undefined {
  return recordDefinitions.find(d => d.gameId === gameId);
}
