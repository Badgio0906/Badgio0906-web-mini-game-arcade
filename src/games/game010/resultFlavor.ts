import type { MeetingMode } from './contracts';

export function meetingTitle(score: number, mode: MeetingMode): string {
  const points = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  if (points >= 6000) return '全社会議完全無視型超絶マルチタスク神';
  if (points >= 3000) return '超スーパー聞いてるふりエグゼクティブ';
  if (points >= 1500) return '会議内職主任';
  if (points >= 700) return mode === 'board' ? '役員会の二窓仕事人' : '二窓仕事人';
  if (points >= 250) return 'ながら仕事の達人';
  if (points >= 50) return '会議を聞いていた人';
  return '真面目な参加者';
}
