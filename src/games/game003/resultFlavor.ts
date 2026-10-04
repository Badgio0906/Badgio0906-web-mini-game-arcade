export const BUILDING_TITLE_BANDS = [
  { minFloors: 0, title: '三流大工' },
  { minFloors: 2, title: '見習い大工' },
  { minFloors: 5, title: '町の職人' },
  { minFloors: 12, title: '一流棟梁' },
  { minFloors: 24, title: '伝説の棟梁' },
  { minFloors: 32, title: '超一流建築王' },
  { minFloors: 40, title: '天下無双の鉄骨マスター' },
  { minFloors: 50, title: '超絶伝説の天空積み求道者' },
  { minFloors: 60, title: '超スーパーエグゼクティブウルトラ神大工' },
  { minFloors: 80, title: '銀河最強積み積み大棟梁' },
  { minFloors: 100, title: 'ハイパーミラクル天空建築覇王' },
  { minFloors: 140, title: 'スーパーアルティメット無敵積層親方' },
] as const;

/** Accepted floors alone select a title; time, mass and precision points do not alter it. */
export function buildingTitle(floors: number, cMode = false): string {
  const count = Number.isFinite(floors) ? Math.max(0, Math.floor(floors)) : 0;
  if (cMode) {
    return count >= 140 ? 'スーパーアルティメット天空国家級神大工'
      : count >= 100 ? 'ハイパーミラクル超高速建築覇王'
      : count >= 80 ? '銀河最速・天空国家級大棟梁'
      : count >= 60 ? '超スーパー爆速ウルトラ建築神'
      : count >= 40 ? '超高速国家級大棟梁'
      : count >= 24 ? '爆速建築超人' : 'C国の一流棟梁';
  }
  let title: string = BUILDING_TITLE_BANDS[0].title;
  for (const band of BUILDING_TITLE_BANDS) if (count >= band.minFloors) title = band.title;
  return title;
}
