/** Original geometric faces. Shapes and marks carry identity independently of color. */
export const faceNames = ['輪・点', '三角・線', '星・点', 'ひし形・線', '四角・点', '六角・線', '二重の輪', '二重の三角', '二重の星', '二重のひし形', '二重の四角', '二重の六角'] as const;
const colors = ['#336c66','#956543','#737092','#426d91','#8e5b69','#657843'];
export function faceSvg(face: number): string {
  const shape = face % 6, double = face >= 6;
  const outlines = [
    '<circle cx="32" cy="32" r="19"/>',
    '<path d="M32 10L54 50H10Z"/>',
    '<path d="M32 9l6.7 15 16.3 1.5-12.3 11 3.5 16-14.2-8-14.2 8 3.5-16-12.3-11 16.3-1.5Z"/>',
    '<path d="M32 8L55 32 32 56 9 32Z"/>',
    '<rect x="13" y="13" width="38" height="38" rx="3"/>',
    '<path d="M22 12h20l12 20-12 20H22L10 32Z"/>',
  ];
  const marks = double ? '<circle cx="32" cy="32" r="7"/>' : shape % 2 === 0 ? '<circle cx="32" cy="32" r="3" fill="currentColor" stroke="none"/>' : '<path d="M25 28h14m-14 8h14"/>';
  return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" style="color:${colors[shape]}"><g fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${outlines[shape]}${marks}</g></svg>`;
}
