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
  ['game002','score','最終スコア','点','1',true],
  ['game003','floors','階数','階','2',true],
  ['game004','level','到達LEVEL','LEVEL','1',true],
  ['game005','sorted','仕分け数','個','1',true],
  ['game006','score','スコア','点','2',true],
  ['game007','score','配達点','点','2',true],
  ['game008','score','配達点','点','2',true,undefined,1,8560,8560],
  ['game009','score','スコア','点','2',true],
  ['game011','score','最高スコア','点','2',true],
  ['game012','score','スコア（未対応）','点','legacy-export',false],
  ['game013','score','スコア（未対応）','点','legacy-export',false],
  ['game014','progress','到達段階（未対応）','段階','legacy-export',false],
  ['game015','depth','最大深度','m','03',true],
  ['game016','score','最高スコア','点','1',true],
  ['game017','score','最高スコア','点','1',true],
  ['game018','distance','飛距離・全靴','m','1',true,undefined,10,Number.MAX_SAFE_INTEGER,1000000000,'all-shoes','全靴'],
  ['game019','height','最高到達高度','m','2',true,undefined,10,2000,2000],
  ['game020','clears','クリア盤面数','盤面','1',false,'あなたの記録',1,1000000],
  ['game021','matches','対局数','局','1',false,'あなたの記録',1,72000000],
  ['game022','clears','クリア回数','回','klondike-v1',false,'あなたの記録',1,1000000000],
  ['game023','words_seen','出会ったことば','語','1',false,'あなたの記録',1,180],
  ['game024','foods','餌数・ゆっくり','個','1',true,undefined,1,397,397,'speed-4','ゆっくり（毎秒4マス）'],
  ['game025','clears','クリア回数','回','1',false,'あなたの記録',1,1000000],
  ['game026','matches','対局数','局','1',false,'あなたの記録',1,100000000],
  ['game027','matches','対局数','局','1',false,'あなたの記録',1,1000000000],
  ['game028','rally','ラリー記録','回','1',false,'あなたの記録'],
  ['game029','score','帰宅時スコア','点','1',true,undefined,1,1000000000],
  ['game030','stages','クリア済ステージ','ステージ','1',false,'あなたの記録',1,20],
  ['game031','mined','採掘数','個','1',false,'この世界の記録'],
];
export const recordDefinitions: readonly RecordDefinition[] = Object.freeze(entries.map(([gameId,metricId,metricLabel,unit,rulesetId,publicEnabled,localLabel,scale,max,pending,modeId,modeLabel]) => Object.freeze({
  gameId, metricId, metricLabel, unit, direction: 'higher' as const,
  storageScale: scale ?? 1, displayPrecision: scale === 10 ? 1 : 0,
  rulesetId, modeId: modeId ?? 'all', modeLabel: modeLabel ?? '全モード',
  assistancePolicy: gameId === 'game024' ? 'none' as const : 'allowed' as const,
  localLabel: localLabel ?? 'あなたのBEST', publicEnabled,
  boardId: `${gameId}.${metricId}.r${rulesetId}.${modeId ?? 'all'}`,
  maxValue: max ?? Number.MAX_SAFE_INTEGER, pendingAbove: pending ?? Math.min(max ?? Number.MAX_SAFE_INTEGER,1000000),
})));
export const recordBoards: readonly RecordDefinition[] = Object.freeze(recordDefinitions.filter(d => d.publicEnabled));
export function getRecordDefinition(gameId: string): RecordDefinition | undefined {
  return recordDefinitions.find(d => d.gameId === gameId);
}
