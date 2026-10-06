import type { ElevatorParty, OccupantKind } from './contracts';
type Offer = [OccupantKind, number, number, number, string?, number?, number?];
const labels: Record<OccupantKind, string> = { office: '会社員', visitor: '来客', courier: '配送員', boxes: '段ボール便', copier: 'コピー機', fridge: '冷蔵庫', plant: '観葉植物' };
const baseline: Record<number, Offer[]> = {
  1: [['office', 70, 3, 100], ['boxes', 320, 9, 180, '遠い段ボール便']],
  2: [['courier', 180, 4, 480, '次階の速達便', 12], ['visitor', 80, 3, 100]],
  3: [['office', 120, 5, 210, '同じ階の二人組', undefined, 2], ['plant', 260, 8, 170]],
  4: [['courier', 300, 6, 720, '大型の特急配送', 23], ['office', 60, 7, 90]],
  5: [['visitor', 140, 6, 240, '六階の二人組', undefined, 2], ['boxes', 170, 9, 150]],
  6: [['office', 70, 8, 120], ['courier', 190, 8, 380, '八階の書類便', 34]],
  7: [['fridge', 310, 10, 650, '高得点の冷蔵庫'], ['visitor', 80, 8, 100]],
  8: [['courier', 160, 9, 340, '近い速達便', 43], ['office', 120, 10, 220, '十階の二人組', undefined, 2]],
  9: [['boxes', 200, 10, 360, '最後の台車']],
};
const scenarioOverrides: Record<number, Record<number, Offer[]>> = {
  1: { 1: [['office', 65, 3, 100], ['copier', 300, 8, 650, '価値ある遠距離便']], 2: [['courier', 140, 4, 260, '小さな速達便', 12], ['visitor', 75, 3, 90]], 4: [['courier', 260, 6, 650, '大型の特急配送', 23], ['office', 70, 7, 100]] },
  2: { 1: [['office', 140, 3, 220, '三階の二人組', undefined, 2], ['boxes', 280, 9, 150]], 2: [['courier', 240, 4, 580, '次階の速達台車', 12], ['visitor', 65, 3, 90]], 6: [['office', 140, 8, 240, '八階の二人組', undefined, 2], ['courier', 220, 8, 450, '八階の書類便', 34]] },
};
function make(floor: number, offer: Offer, index: number): ElevatorParty {
  const [kind, kg, destination, value, label = labels[kind], deadline = null, count = 1] = offer;
  const people = ['office', 'visitor', 'courier'].includes(kind) ? count : 0;
  return { id: floor * 10 + index, floor, destination, label, kg, value, deadline,
    items: [{ kind, label, kg, value, people, cargo: people ? 0 : 1 }] };
}
export function floorParties(floor: number, scenario = 0, practice = false, roof = false): ElevatorParty[] {
  let offers: Offer[];
  if (practice) offers = ({ 1: [['office', 70, 2, 100], ['boxes', 330, 4, 120]], 2: [['courier', 180, 3, 450, '次階の速達便', 25]] } as Record<number, Offer[]>)[floor] ?? [];
  else if (roof) offers = ({ 10: [['boxes', 320, 14, 650, '屋上への引越し便'], ['office', 90, 12, 120]], 11: [['courier', 110, 12, 400, '途中の急ぎ便', 17]], 12: [['courier', 120, 13, 320, '残りの書類便', 22]], 13: [['plant', 180, 14, 360]] } as Record<number, Offer[]>)[floor] ?? [];
  else offers = scenarioOverrides[((scenario % 3) + 3) % 3]?.[floor] ?? baseline[floor] ?? [];
  return offers.map((offer, index) => make(floor, offer, index));
}
