/** Stable IDs are the filter/export keys; labels are localized presentation. */
export const tagLabels = Object.freeze({"reflex": "反射神経", "dodge": "回避", "score-attack": "スコアアタック", "short": "短時間", "office": "お仕事", "commute": "通勤", "endless": "エンドレス", "absurd": "バカゲー", "timing": "タイミング", "stacking": "積み上げ", "architecture": "建築", "memory": "記憶", "decision": "判断", "brain-training": "脳トレ", "rule-change": "ルール変化", "physics": "物理", "precision": "精密操作", "vehicle": "乗り物", "puzzle": "パズル", "weight": "重量管理", "balance": "バランス", "drink": "飲み物", "search": "探索", "desk": "机上", "stealth": "ステルス", "meeting": "会議", "multitask": "マルチタスク", "quiz": "クイズ", "rhythm": "リズム感", "pose": "ポーズ", "fall": "落下", "pixel-art": "ドット絵", "retro": "レトロ", "hard": "高難度", "weather": "天気", "multi-step": "マルチステップ", "distance": "距離競技", "jump": "ジャンプ", "rise": "上昇", "animal": "アニマル", "space": "宇宙", "wind": "風", "fishing": "釣り", "chill": "チル", "nature": "自然"} as const);
export type TagId = keyof typeof tagLabels;
export interface GameTag { readonly id: TagId; readonly label: string; }
export const tagCatalog: readonly GameTag[] = Object.freeze(Object.entries(tagLabels).map(([id, label]) => Object.freeze({ id: id as TagId, label })));
export function tagsFor(ids: readonly TagId[]): readonly GameTag[] {
  return Object.freeze([...new Set(ids)].map(id => Object.freeze({ id, label: tagLabels[id] })));
}
