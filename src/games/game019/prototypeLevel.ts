import { ledge, type Level } from './chargeTypes.ts';

export function createFlatPrototype(): Level {
  return { id: 'flat-charge', goal: 50, seaHeight: null, startX: 180, startY: 0, ledges: [ledge('bottom', 180, 0, 312, 'stone', 'flat', 'base')], blocks: [], winds: [], sections: [{ id: 'flat', from: 0, to: 50, name: '跳び方だけの試作', motif: 'water', purpose: '短・中・長の連続差と空中制御比較' }] };
}

/** Only the pilot area: full well/sky production construction is gated on its review. */
export function createStagePrototype(): Level {
  return { id: 'handcrafted-20m', goal: 20, seaHeight: null, startX: 180, startY: 0,
    ledges: [ledge('bottom', 180, 0, 312, 'stone', 'water', 'base'), ledge('first', 92, 3.6, 112, 'stone', 'water', 'main'), ledge('brick', 218, 7.2, 100, 'stone', 'water', 'catch'), ledge('under-beam', 95, 10.2, 90, 'wood', 'beam', 'main'), ledge('takeoff', 210, 13.9, 70, 'wood', 'beam', 'main'), ledge('root-top', 72, 20, 52, 'moss', 'roots', 'main')],
    blocks: [{ id: 'low-beam', x: 135, y: 12.7 * 24, width: 175, height: 10 }], winds: [],
    sections: [{ id: 'water', from: 0, to: 8, name: '水面の石', motif: 'water', purpose: '中程度のチャージと左右' }, { id: 'beam', from: 8, to: 14, name: '低い木の梁', motif: 'wood', purpose: '溜めすぎないジャンプ' }, { id: 'roots', from: 14, to: 21, name: '遠い根の石', motif: 'roots', purpose: '位置を整えた大ジャンプと深い落下' }] };
}
