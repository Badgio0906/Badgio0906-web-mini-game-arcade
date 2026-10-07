import type { ShoeRun } from './ShoeRun';
import type { Effect, Obstacle, ShoeType } from './types';
import { drawShoe, drawStar, INK } from './ShoeArt';
import {formatDistance} from './physics';
import {RARE_LABELS} from './rarePresentation';
import {kickPose,supportPose} from './kickPose';
import { canvasSpinAngle, spinDirection } from './spinGuide';
import { attachedShoe, releasedShoe, setupSwing } from './shoePose';

const TAU = Math.PI * 2;
const FONT = '"Arcade Rounded", sans-serif';
const SKY_NAMES: Readonly<Record<string, string>> = {
  'CLOUD NINE': '雲まで届いた！', 'AIRPLANE BREAK': 'スポーン！', 'UFO INCIDENT': '宇宙まで靴、来た。',
  'ORBITAL SHOE': '地球を見下ろす靴。', 'WALL BREAK': '壁、スポーン！', 'IRON GETA EVENT': '鉄下駄の本気。', 'JET STREAM': '紙、空へ。', 'TORNADO ZORI': '回れ。草履。',
  'BUSINESS MISSILE': '社会人の重み！', 'IRON BREAKER': '鉄下駄、飛んだ。', 'DRILL THROUGH': 'ドリルシューズ！', 'HIGHWAY STAR': '靴、道路を制す。',
};
export interface BoardOptions { title?: boolean; reducedMotion?: boolean; recordAt?:number|null }
export interface BoardProjection { width: number; height: number; cameraX: number; cameraY: number; scale: number; shoeX: number; shoeY: number }

/** Canvas artwork only. Trajectory, break state, altitude and effects come from ShoeRun. */
export class ShoeBoard {
  private readonly c: CanvasRenderingContext2D;
  private readonly observer: ResizeObserver;
  private readonly prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private width = 1000;
  private height = 650;
  private artScale = 1;
  private cameraX = 0;
  private cameraY = 0;
  private scale = 3;
  private shoeX = 0;
  private shoeY = 0;
  private previousTime = 0;
  private following = false;
  constructor(readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas2D unavailable');
    this.c = context; canvas.width = this.width; canvas.height = this.height;
    this.observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      this.height = Math.max(400, Math.min(2100, Math.round(height / width * this.width)));
      if (canvas.height !== this.height) canvas.height = this.height;
      this.artScale = Math.max(1, Math.min(2.4, 730 / width, this.height * .83 / 330));
    });
    this.observer.observe(canvas);
  }
  destroy(): void { this.observer.disconnect(); }
  get projection(): BoardProjection {
    return { width: this.width, height: this.height, cameraX: this.cameraX, cameraY: this.cameraY, scale: this.scale, shoeX: this.shoeX, shoeY: this.shoeY };
  }
  private text(value: string, x: number, y: number, size: number, color = INK, align: CanvasTextAlign = 'center'): void {
    const c = this.c; c.font = '900 ' + size + 'px ' + FONT; c.fillStyle = color; c.textAlign = align; c.fillText(value, x, y);
  }
  private line(x1: number, y1: number, x2: number, y2: number, color: string, width = 3): void {
    const c = this.c; c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  private cloud(x: number, y: number, size: number, color: string): void {
    const c = this.c; c.fillStyle = color; c.beginPath(); c.ellipse(x, y, size, size * .3, 0, 0, TAU); c.ellipse(x - size * .34, y - size * .14, size * .47, size * .36, 0, 0, TAU); c.ellipse(x + size * .25, y - size * .24, size * .5, size * .4, 0, 0, TAU); c.fill();
  }
  private capsule(x: number, y: number, w: number, h: number, fill: string): void {
    const c = this.c; c.fillStyle = fill; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.roundRect(x, y, w, h, Math.min(18, h * .25)); c.fill(); c.stroke();
  }
  private arrow(x: number, y: number, angle: number, length: number, color: string, width = 7): void {
    const c = this.c; c.save(); c.translate(x, y); c.rotate(angle); c.lineCap = 'round'; this.line(0, 0, length, 0, color, width);
    c.fillStyle = color; c.beginPath(); c.moveTo(length + 9, 0); c.lineTo(length - 14, -12); c.lineTo(length - 14, 12); c.closePath(); c.fill(); c.restore();
  }
  render(run: ShoeRun, now: number, options: BoardOptions = {}): void {
    const reduced = options.reducedMotion ?? this.prefersReducedMotion;
    const title = options.title ?? false;
    const c = this.c, h = this.height;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.lineCap = 'round'; c.lineJoin = 'round';
    const flight = !title && ['flight', 'landing', 'result'].includes(run.phase);
    const dt = run.paused ? 0 : Math.max(0, Math.min(.1, (now - this.previousTime) / 1000)); this.previousTime = now;
    c.save();
    if (!reduced && !title && run.phase === 'kick' && run.phaseProgress > .45) { const decay = (1 - run.phaseProgress) * 10; c.translate(Math.sin(run.phaseProgress * 83) * decay, Math.cos(run.phaseProgress * 71) * decay); }
    if (flight) {
      this.updateCamera(run, dt, reduced);
      this.flightSky(run);
      this.world(run);
      this.effects(run, reduced);
      this.flightCaption(run);
      this.flyingShoe(run, reduced);
      if (run.phase === 'result') {
        const size = Math.min(1.1, this.height / 420);
        this.boy(160, this.height - 180 * size, size, .15, run.shoeType, 0, .1, false, true);
        this.text('やったー！', 190, this.height - 420 * size, 27 * size, '#b04138');
      }
    } else {
      this.following = false;
      this.park(title ? now / 1000 : run.time);
      this.setup(run, title, reduced);
    }
    c.restore();
    if(!title&&!['angle','angle-lock','spin','spin-lock','power','practice-complete'].includes(run.phase))this.distanceHud(run,options.recordAt??null);
    // Ink border and small registration marks make the drawing feel like an authored comic panel.
    c.strokeStyle = '#18374635'; c.lineWidth = 2; c.strokeRect(12, 12, this.width - 24, h - 24);
  }
  private park(clock: number): void {
    const c = this.c, h = this.height;
    const sky = c.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#74dbda'); sky.addColorStop(.72, '#d6f3d5'); sky.addColorStop(1, '#fff0b9'); c.fillStyle = sky; c.fillRect(0, 0, this.width, h);
    drawStar(c, 850, h * .17, 68, '#fff0a5', .2);
    this.cloud(130, h * .15, 80, '#ffffffa8'); this.cloud(615 + Math.sin(clock * .1) * 8, h * .23, 105, '#ffffffa8');
    const ground = h * .83;
    c.fillStyle = '#a9d1ad'; c.beginPath(); c.moveTo(0, ground); c.bezierCurveTo(270, ground - 155, 410, ground - 25, 1000, ground - 145); c.lineTo(1000, h); c.lineTo(0, h); c.fill();
    for (let i = 0; i < 7; i++) {
      const x = i * 170 - 40, bh = 60 + i % 3 * 23;
      c.fillStyle = i % 2 ? '#b2ded2' : '#97c9c7'; c.fillRect(x, ground - bh - 28, 100, bh + 35); c.fillStyle = '#eff6cd';
      for (let j = 0; j < 3; j++) c.fillRect(x + 12 + j * 28, ground - bh - 9, 14, 19);
    }
    // Park railings are scenery, never disguised as destructible model obstacles.
    this.line(0, ground - 16, 1000, ground - 16, '#518e8990', 5);
    for (let x = 25; x < 1000; x += 90) this.line(x, ground - 16, x, ground + 25, '#518e8990', 4);
    c.fillStyle = '#efd792'; c.fillRect(0, ground + 15, 1000, h - ground);
    c.fillStyle = '#f9e5a7'; c.beginPath(); c.moveTo(0, ground + 41); c.lineTo(1000, ground + 17); c.lineTo(1000, ground + 46); c.lineTo(0, ground + 84); c.fill();
    this.line(0, ground + 17, 1000, ground + 17, '#baab76', 4);
    // A distant empty wall forecasts the low-angle route without falsely showing a break.
    c.fillStyle = '#e89875'; c.strokeStyle = '#976954'; c.lineWidth = 2; c.fillRect(858, ground - 36, 120, 51);
    for (let row = 0; row < 3; row++) { this.line(858, ground - 36 + row * 17, 978, ground - 36 + row * 17, '#a56b55', 2); for (let j = 0; j < 3; j++) this.line(858 + j * 43 + row % 2 * 20, ground - 36 + row * 17, 858 + j * 43 + row % 2 * 20, ground - 19 + row * 17, '#a56b55', 2); }
  }
  private setup(run: ShoeRun, title: boolean, reduced: boolean): void {
    const c = this.c, h = this.height, phase = run.phase, s = this.artScale;
    const spinFocus = !title && (phase === 'spin' || phase === 'spin-lock' || run.practice && run.practiceStage === 1 && phase === 'practice-complete');
    // Reserve the same headroom throughout setup so the fixed flight HUD never
    // hides the hair and the actor does not resize at the instant of release.
    const headroomScale = (h * .83 - this.hudHeight - 28) / 333;
    const scale = Math.min(s, h / 430, title ? 1.7 : headroomScale);
    const hipX = title ? 330 : Math.max(320, 185 * scale), hipY = h * .83 - 115 * scale;
    const poseAngle = title ? 60 : run.angle;
    const swing = title ? 1.15 : setupSwing(poseAngle);
    const selectedSpin = run.locked.spin ?? run.spin;
    const pose = kickPose(phase === 'kick' ? run.phaseProgress : 0, swing);
    const shoe = attachedShoe(pose, selectedSpin);
    if (phase === 'kick' && !title && run.justMax && run.phaseProgress >= .63) {
      const released = releasedShoe(pose, selectedSpin, run.angle);
      const x = hipX + released.x * scale;
      const y = hipY + released.y * scale;
      // The actor draws the released shoe exactly once. Its trail shares that
      // position and is painted first, behind the character and shoe.
      this.justTrail(run, x, y, Math.min(scale, 1.7), -run.angle * Math.PI / 180, 1 - run.phaseProgress * .3, reduced);
    }
    this.boy(hipX, hipY, scale, swing, run.shoeType, selectedSpin, title ? .82 : phase === 'kick' ? run.phaseProgress : 0, phase === 'max', false, title, run.angle);
    if (spinFocus) this.spinGuide(run, hipX, hipY, scale, pose);
    if (title) {
      this.arrow(hipX + 177 * scale, hipY - 6 * scale, -.55, 150 * scale, '#ef7250', 6 * scale);
      drawShoe(c, run.shoeType, hipX + 285 * scale, hipY - 81 * scale, 1.12 * scale, -.65, true);
      this.text('FLY!', hipX + 279 * scale, hipY - 140 * scale, 43 * scale, '#b9412b');
    }
    if (['angle', 'angle-lock'].includes(phase) && !title) {
      const x = hipX + shoe.center.x * scale, y = hipY + shoe.center.y * scale, radians = run.angle * Math.PI / 180;
      c.save(); c.strokeStyle = '#fff8cf'; c.lineWidth = 4 * scale; c.setLineDash([7 * scale, 7 * scale]); c.beginPath(); c.arc(x, y, 65 * scale, -radians, 0); c.stroke(); c.restore();
      this.line(x, y, x + 69 * scale, y, '#fff8cf', 3 * scale);
      this.arrow(x, y, -radians, 105 * scale, '#e56b46', 6 * scale);
      this.pivot(x, y, 6 * scale);
      if (phase === 'angle') {
        this.capsule(535, h * .14, 360, 68, '#fff9dd');
        this.text(run.angle.toFixed(0) + '°  /  ' + (run.angle <= 25 ? '低く＝破壊' : run.angle < 55 ? '中＝距離' : '高く＝空'), 715, h * .14 + 44, 27);
      }
    }
    if (phase === 'power' && !title) {
      this.powerGauge(run.power);
      const y = h > 900 ? h * .36 : h * .64;
      this.capsule(550, y, 400, 74, '#fff9dd');
      this.text('SPIN LOCK · ' + Math.round(Math.abs(selectedSpin) * 100) + '%', 750, y + 29, 25);
      this.text(spinDirection(selectedSpin), 750, y + 57, 23, '#ae4734');
    }
    if (phase === 'angle-lock') {
      this.text('ANGLE LOCK!', 500, h * .17, 42 * s, '#183746');
    }
    if (phase === 'max' && !title) {
      if (!reduced) { c.fillStyle = run.shoeType === 'iron-geta' ? '#ffffffbc' : '#fffbd170'; c.fillRect(0, 0, 1000, h); }
      for (let i = 0; i < 6; i++) drawStar(c, 110 + i * 153, h * (.27 + i % 2 * .11), 18 * s, i % 2 ? '#ec6d51' : '#ffcc49', i * .8);
      this.text('JUST MAX!!', 500, h * .25, 68 * Math.min(s, 1.65), '#b04138');
      this.text('靴の未来が、変わった。', 500, h * .25 + 55 * s, 25 * s, '#183746');
    }
    if (phase === 'kick' && !title) {
      // Reserve the upper-right sky for the callout, clear of the face and release trajectory.
      const bubbleScale = Math.min(s, 1.1), bubbleY = Math.min(h*.21,112*s)+12*s;
      this.capsule(590, bubbleY, 330 * bubbleScale, 68 * bubbleScale, '#fffbed');
      this.text('いっけぇぇぇ！！', 590 + 165 * bubbleScale, bubbleY + 46 * bubbleScale, 29 * bubbleScale);
      if (!reduced && run.phaseProgress > .45) {
        c.save(); c.globalAlpha = (1 - run.phaseProgress) * .5; c.fillStyle = '#fff9cd'; c.fillRect(0, 0, 1000, h); c.restore();
      }
    }
  }
  /** Original profile illustration: red tee, denim shorts, brown spikes and an expressive grin. */
  private boy(x: number, y: number, size: number, swing: number, shoe: ShoeType, spin: number, kick: number, glowing: boolean, launched = false, title = false, launchAngle = 45): void {
    const c = this.c; c.save(); c.translate(x, y); c.scale(size, size);
    const pose=kickPose(kick,swing,launched),support=supportPose(),hit=pose.released;
    const {x:fx,y:fy}=pose.ankle;
    const path = (fill: string, draw: () => void) => { c.fillStyle = fill; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); draw(); c.closePath(); c.fill(); c.stroke(); };
    const limb = (ax: number, ay: number, bx: number, by: number, width: number) => { this.line(ax, ay, bx, by, INK, width + 7); this.line(ax, ay, bx, by, '#ffbe8a', width); };
    c.fillStyle = '#18374624'; c.beginPath(); c.ellipse(-11, 138, 91, 12, 0, 0, TAU); c.fill();
    // Supporting leg: calf, striped sock and blue sneaker stay visibly planted.
    limb(support.hip.x,support.hip.y,support.knee.x,support.knee.y,24); limb(support.knee.x,support.knee.y,support.ankle.x,support.ankle.y,18);
    const sx=support.ankle.x+(support.knee.x-support.ankle.x)*.28,sy=support.ankle.y+(support.knee.y-support.ankle.y)*.28;
    this.line(sx,sy,support.ankle.x,support.ankle.y,'#fff4da',21);
    const sd=Math.hypot(support.ankle.x-sx,support.ankle.y-sy),nx=(support.ankle.y-sy)/sd,ny=-(support.ankle.x-sx)/sd;this.line(sx-7*nx,sy-7*ny,sx+7*nx,sy+7*ny,'#416b90',3);
    c.save(); c.translate(-40, 124); c.scale(.68, .68); drawShoe(c, 'sneaker', 0, 0, 1); c.fillStyle = '#416b90'; c.fillRect(-28, -15, 27, 15); c.restore();
    // A connected thigh, bent knee, calf and a bare, upturned foot at release.
    const {x:kx,y:ky}=pose.knee;
    limb(pose.hip.x,pose.hip.y,kx,ky,28); limb(kx,ky,fx,fy,21);
    const attachment = attachedShoe(pose, spin);
    c.save(); c.translate(fx,fy); this.foot(shoe, attachment.footAngle, !launched && !title && !hit); c.restore();
    if (!launched && !title) {
      if (hit) {
        const released = releasedShoe(pose, spin, launchAngle);
        drawShoe(c, shoe, released.x, released.y, .83, released.rotation, true);
        c.save(); c.translate(released.x, released.y); c.rotate(-launchAngle * Math.PI / 180);
        for (let i = 0; i < 3; i++) this.line(-35 - i * 7, -10 + i * 10, -73 - i * 7, -10 + i * 10, '#fffce4', 4);
        c.restore();
      }
    }
    // Two separate denim cuffs articulate the hip; seams and highlights avoid a flat block.
    path('#315d7f', () => { c.moveTo(-45, -33); c.lineTo(26, -41); c.lineTo(53, -5); c.lineTo(11, 17); c.lineTo(-3, -4); c.lineTo(-10, 24); c.lineTo(-51, 18); });
    c.save();c.translate(pose.hip.x,pose.hip.y);c.rotate(-pose.a);path('#315d7f',()=>{c.moveTo(-21,-15);c.lineTo(20,-15);c.lineTo(19,31);c.quadraticCurveTo(0,37,-20,31);});this.line(-18,29,18,29,'#6589a1',4);c.restore();
    this.line(-10, -30, -3, -4, '#17394f', 3); this.line(12, 11, 46, -4, '#6589a1', 4); this.line(-47, 12, -12, 18, '#6589a1', 4);
    // Counterbalanced arms and rounded fists point in the direction of travel.
    limb(-23, -93, -69, -83 - kick * 12, 17); limb(-69, -83 - kick * 12, -110, -53 - kick * 35, 14);
    path('#ffbe8a', () => { c.roundRect(-119, -66 - kick * 35, 24, 25, 7); });
    path('#e45538', () => { c.moveTo(-26, -113); c.quadraticCurveTo(3, -122, 31, -99); c.lineTo(38, -39); c.quadraticCurveTo(-5, -29, -46, -36); c.lineTo(-40, -83); c.lineTo(-61, -82); c.lineTo(-63, -103); });
    path('#f66b43', () => { c.moveTo(21, -102); c.lineTo(47, -97); c.lineTo(52, -74); c.lineTo(26, -66); });
    this.line(-32, -52, 20, -45, '#b7382c', 3); this.line(-26, -104, -6, -107, '#ff9460', 5);
    limb(47, -85, 87, -75 - kick * 21, 16); limb(87, -75 - kick * 21, 121, -80 - kick * 20, 13);
    path('#ffbe8a', () => { c.roundRect(116, -92 - kick * 20, 24, 24, 7); });
    // Neck and large right-facing profile, with a real nose, ear and one white eye.
    path('#ffbe8a', () => { c.moveTo(-12, -122); c.lineTo(-8, -107); c.quadraticCurveTo(10, -99, 20, -115); c.lineTo(18, -131); });
    path('#ffc591', () => { c.moveTo(-26, -171); c.bezierCurveTo(-13, -208, 42, -198, 51, -168); c.lineTo(46, -153); c.lineTo(59, -145); c.quadraticCurveTo(61, -139, 47, -136); c.quadraticCurveTo(45, -118, 26, -114); c.quadraticCurveTo(1, -111, -16, -133); c.lineTo(-28, -147); });
    path('#f4a976', () => { c.ellipse(-17, -149, 13, 17, -.2, 0, TAU); });
    c.strokeStyle = '#ba7852'; c.lineWidth = 2.3; c.beginPath(); c.moveTo(-21, -154); c.quadraticCurveTo(-8, -157, -15, -142); c.stroke();
    path('#734525', () => { c.moveTo(-35, -145); c.lineTo(-43, -168); c.lineTo(-32, -172); c.lineTo(-43, -185); c.lineTo(-20, -187); c.lineTo(-30, -201); c.lineTo(-4, -198); c.lineTo(3, -218); c.lineTo(12, -203); c.lineTo(40, -210); c.lineTo(34, -196); c.lineTo(58, -190); c.lineTo(43, -181); c.lineTo(52, -170); c.lineTo(34, -173); c.lineTo(23, -151); c.lineTo(22, -175); c.quadraticCurveTo(5, -151, -4, -158); c.lineTo(-9, -138); c.lineTo(-21, -157); });
    this.line(-26, -182, -10, -178, '#a46a3a', 4); this.line(3, -197, 22, -193, '#a46a3a', 4);
    path('#fff9ef', () => { c.ellipse(35, -154, 10, 16, .19, 0, TAU); });
    c.fillStyle = INK; c.beginPath(); c.ellipse(40, -151, 5, 10, .13, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(41, -156, 2.7, 0, TAU); c.fill();
    this.line(24, -173, 40, -175, '#59391e', 4);
    path('#fff9ef', () => { c.moveTo(20, -135); c.quadraticCurveTo(30, -131, 44, -133); c.quadraticCurveTo(39, -118, 28, -124); });
    this.line(24, -127, 37, -126, '#dab790', 1.4);
    c.fillStyle = '#f69579'; c.beginPath(); c.ellipse(12, -138, 7, 4, .3, 0, TAU); c.fill();
    if (glowing) drawStar(c, 38, -153, 12, '#fff3a4');
    if (hit) { c.strokeStyle = '#f27846'; c.lineWidth = 5; c.beginPath(); c.arc(3, 1, 155, -.65, .65); c.stroke(); }
    c.restore();
  }
  private foot(shoe: ShoeType, angle: number, wearing: boolean): void {
    const c = this.c; c.save(); c.rotate(angle); c.fillStyle = '#ffbe8a'; c.strokeStyle = INK; c.lineWidth = 4;
    c.beginPath(); c.moveTo(-9,-11); c.lineTo(7,-12); c.quadraticCurveTo(12,-5,25,-5); c.quadraticCurveTo(42,-16,46,-8); c.quadraticCurveTo(47,3,35,9); c.lineTo(-8,12); c.quadraticCurveTo(-15,4,-9,-11); c.closePath(); c.fill(); c.stroke();
    for(let i=0;i<3;i++) this.line(33+i*4,-6,35+i*3,0,'#d88c61',1.4);
    // The shoe center is translated inside the foot rotation, so the heel stays attached.
    if (wearing) drawShoe(c, shoe, 14, 0, .83);
    c.restore();
  }
  private pivot(x: number, y: number, radius: number): void {
    const c = this.c; c.fillStyle = '#ffe179'; c.strokeStyle = INK; c.lineWidth = 2;
    c.beginPath(); c.arc(x, y, radius, 0, TAU); c.fill(); c.stroke();
  }
  private spinGuide(run: ShoeRun, hipX: number, hipY: number, size: number, pose: ReturnType<typeof kickPose>): void {
    const c = this.c, h = this.height, portrait = h > 900, spin = run.locked.spin ?? run.spin;
    const attachment = attachedShoe(pose, spin), neutral = attachedShoe(pose, 0), magnitude = Math.abs(spin);
    const x = portrait ? 60 : 555, y = 28, width = portrait ? 880 : 405;
    const height = portrait ? Math.min(430, hipY - 218 * size - 64) : Math.min(310, h - 65);
    const ankleX = hipX + pose.ankle.x * size, ankleY = hipY + pose.ankle.y * size;
    c.save(); c.strokeStyle = '#e56543'; c.lineWidth = 3; c.setLineDash([9, 8]); c.beginPath(); c.moveTo(ankleX, ankleY);
    if (portrait) { c.lineTo(945, ankleY); c.lineTo(945, y + height); c.lineTo(x + width, y + height); }
    else c.lineTo(x, y + height * .73);
    c.stroke(); c.restore();
    this.pivot(ankleX, ankleY, 7 * size);
    this.capsule(x, y, width, height, '#fff9e7');
    this.text(run.locked.spin === null ? '足首を調整 · SPIN' : '足首を固定 · SPIN LOCK', x + width / 2, y + 40, portrait ? 36 : 27);
    const cx = x + width * .46, cy = y + height * (portrait ? .44 : .48), zoom = portrait ? 2.1 : 1.45;
    c.save(); c.beginPath(); c.rect(x + 4, y + 52, width - 8, height - 150); c.clip(); c.translate(cx, cy); c.scale(zoom, zoom);
    // This magnifier samples the same calf/ankle and attachment as the visible full-body actor.
    this.line(pose.knee.x - pose.ankle.x, pose.knee.y - pose.ankle.y, 0, 0, INK, 28);
    this.line(pose.knee.x - pose.ankle.x, pose.knee.y - pose.ankle.y, 0, 0, '#ffbe8a', 21);
    c.save(); c.setLineDash([4, 4]); this.line(0, 0, neutral.toe.x - pose.ankle.x, neutral.toe.y - pose.ankle.y, '#97aaa1', 2); c.restore();
    this.foot(run.shoeType, attachment.footAngle, true);
    this.line(0, 0, attachment.toe.x - pose.ankle.x, attachment.toe.y - pose.ankle.y, '#e56543', 2);
    this.pivot(0, 0, 5); c.fillStyle = '#e56543'; c.beginPath(); c.arc(attachment.toe.x - pose.ankle.x, attachment.toe.y - pose.ankle.y, 4, 0, TAU); c.fill(); c.restore();
    const labelY = portrait ? y + height - 126 : cy + 54;
    this.text('固定支点', cx - 65, labelY, portrait ? 30 : 21);
    this.text('つま先', cx + 110, labelY, portrait ? 30 : 21, '#ae4734');
    const locked = run.locked.spin !== null, label = spinDirection(spin) + ' ' + Math.round(magnitude * 100) + '%';
    this.text(label, x + width / 2, y + height - 66, portrait ? 32 : 24, '#ae4734');
    const center = x + width / 2, barY = y + height - 40, half = width * .38;
    this.line(center - half, barY, center + half, barY, '#d3dfcd', 12);
    if (magnitude >= .04) this.arrow(center, barY, spin > 0 ? Math.PI : 0, half * magnitude, '#e56543', 9);
    this.pivot(center, barY, 5);
    this.text(locked ? '確定した足首の向き' : '左 ←  強さ  → 右', center, y + height - 12, portrait ? 27 : 20);
  }
  private powerGauge(power: number): void {
    const c = this.c, s = this.artScale, h = this.height;
    const width = 620, height = 42 * s, x = 190, y = h * .23;
    this.text('POWER', 500, y - 30 * s, 35 * s);
    this.capsule(x - 13, y - 13, width + 26, height + 26, '#fffbe3');
    c.fillStyle = '#d3dfcd'; c.fillRect(x, y, width, height);
    const gradient = c.createLinearGradient(x, y, x + width, y); gradient.addColorStop(0, '#45b6b2'); gradient.addColorStop(.78, '#e4cb59'); gradient.addColorStop(.97, '#e86c4e'); gradient.addColorStop(1, '#fff3a2');
    c.fillStyle = gradient; c.fillRect(x, y, width * power / 100, height);
    c.fillStyle = '#fffcdb'; c.fillRect(x + width * .98, y, width * .02, height);
    c.strokeStyle = '#e65e46'; c.lineWidth = 4; c.strokeRect(x + width * .995, y - 3, width * .005, height + 6);
    for (let i = 0; i <= 4; i++) this.line(x + width * i / 4, y + height, x + width * i / 4, y + height + 10 * s, INK, 2);
    const px = x + width * power / 100;
    this.line(px, y - 9, px, y + height + 10, INK, 6); drawStar(c, px, y - 15, 13 * s, '#ef6953');
    this.text('0', x, y + height + 37 * s, 20 * s); this.text('MAX!', x + width - 22, y + height + 37 * s, 20 * s, '#ac433a');
  }
  private updateCamera(run: ShoeRun, dt: number, reduced: boolean): void {
    const speed = Math.hypot(run.velocity.x, run.velocity.y);
    // Camera pulls back with speed; the shoe stays visually enlarged independently of world scale.
    const wantedScale = Math.max(.012, Math.min(4, 620 / Math.max(155, speed * .075)));
    const ease = this.following ? 1 - Math.exp(-dt * 9) : 1;
    this.scale += (wantedScale - this.scale) * ease;
    const wantedX = run.position.x - this.width * .43 / this.scale;
    const lowY = this.hudHeight + 68 * this.artScale;
    const highY = this.height - 70 * this.artScale;
    const centerY = Math.max(lowY, Math.min(highY, this.height * .5));
    const wantedY = run.position.y - (this.height - centerY) / this.scale;
    this.cameraX += (wantedX - this.cameraX) * ease; this.cameraY += (wantedY - this.cameraY) * ease;
    this.following = true;
    let sx = (run.position.x - this.cameraX) * this.scale, sy = this.height - (run.position.y - this.cameraY) * this.scale;
    // Bound the tracking lag. High-speed records must never leave the visible panel.
    const lowX = 120 * this.artScale, highX = this.width - 120 * this.artScale;
    if (sx < lowX || sx > highX) { sx = Math.max(lowX, Math.min(highX, sx)); this.cameraX = run.position.x - sx / this.scale; }
    if (sy < lowY || sy > highY) { sy = Math.max(lowY, Math.min(highY, sy)); this.cameraY = run.position.y - (this.height - sy) / this.scale; }
    this.shoeX = sx; this.shoeY = sy;
    if (reduced) { this.cameraX = wantedX; this.cameraY = wantedY; this.shoeX = this.width * .43; this.shoeY = centerY; }
  }
  private flightSky(run: ShoeRun): void {
    const c = this.c, h = this.height, altitude = run.position.y;
    const t = Math.max(0, Math.min(1, altitude / 11000));
    const mix = (a: number, b: number): number => Math.round(a + (b - a) * t);
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, 'rgb(' + mix(106, 18) + ',' + mix(210, 27) + ',' + mix(218, 72) + ')');
    sky.addColorStop(1, 'rgb(' + mix(230, 48) + ',' + mix(245, 75) + ',' + mix(199, 127) + ')'); c.fillStyle = sky; c.fillRect(0, 0, 1000, h);
    if (altitude > 6500) {
      c.save(); c.globalAlpha = Math.min(1, (altitude - 6500) / 8500);
      for (let i = 0; i < 34; i++) { const x = (i * 163 + 83) % 970 + 15, y = (i * 97 + 41) % Math.floor(h * .75); drawStar(c, x, y, i % 5 ? 2.4 : 6, '#f7f4cf', i); } c.restore();
    }
    // Clouds are background. AIRPLANE/UFO/satellite are only drawn for actual model events.
    const cloudFade = altitude < 4000 ? 1 : Math.max(0, 1 - (altitude - 4000) / 2500);
    if (cloudFade > 0) {
      c.save(); c.globalAlpha = cloudFade;
      const offset = run.position.x * .007;
      for (let i = 0; i < 5; i++) { const x = ((i * 293 - offset) % 1450 + 1450) % 1450 - 180, y = h * .21 + (i % 3) * h * .13 + Math.min(220, altitude * .03); this.cloud(x, y, 75 + i % 3 * 23, '#fffdf0aa'); } c.restore();
    }
    if (altitude > 18000) {
      c.save(); c.globalAlpha = Math.min(1, (altitude - 18000) / 7000); c.fillStyle = '#4aaeb9'; c.strokeStyle = '#b6f4dc'; c.lineWidth = 8;
      c.beginPath(); c.ellipse(530, h * 1.27, 790, h * .46, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#99d29f'; c.beginPath(); c.ellipse(355, h * .975, 100, 32, -.25, 0, TAU); c.ellipse(725, h * .985, 150, 43, .2, 0, TAU); c.fill(); c.restore();
    }
  }
  private world(run: ShoeRun): void {
    const c = this.c, h = this.height;
    const ground = h + this.cameraY * this.scale;
    if (ground < h + 190) {
      // Distant scenery repeats a bounded set; no world-sized array is generated.
      const district = Math.floor(run.position.x / 1400) % 5;
      const offset = ((run.position.x * .012) % 150 + 150) % 150;
      for (let i = -1; i < 8; i++) {
        const x = i * 150 - offset, base = Math.min(h * .95, ground - 12), high = 70 + (i + 8) % 3 * 42;
        if (district === 3) { c.fillStyle = '#77a99d'; c.beginPath(); c.moveTo(x - 60, base); c.lineTo(x + 70, base - high); c.lineTo(x + 190, base); c.closePath(); c.fill(); }
        else if (district === 4) { c.fillStyle = '#5cbcc9'; c.fillRect(x, base - 36, 150, h); this.line(x, base - 24, x + 70, base - 24, '#d9f1d8', 4); }
        else { c.fillStyle = district === 1 ? '#92bcc0' : '#add2bf'; c.fillRect(x, base - high, 110, high); c.fillStyle = '#e6edc9'; for (let k = 0; k < 3; k++) c.fillRect(x + 16 + k * 29, base - high + 18, 14, 19); }
      }
      c.fillStyle = '#e9d48e'; c.fillRect(0, ground, 1000, h - ground); this.line(0, ground, 1000, ground, '#8d9c6d', 5);
      const stripeStep = Math.max(60, 40 * this.scale), start = -((this.cameraX * this.scale) % stripeStep);
      if (ground + 38 < h) for (let x = start; x < 1000; x += stripeStep) this.line(x, ground + 38, x + stripeStep * .5, ground + 38, '#fff3bf', 5);
    }
    // The boy stays at the real launch origin for the first departing frames only.
    // He carries no launched shoe and leaves naturally as the tracking camera moves.
    const originX = -this.cameraX * this.scale;
    if (run.phase === 'flight' && run.flightElapsed < .9 && originX > -90 && originX < 1000 && ground < h + 100) {
      const size = Math.min(.8 * this.artScale, h / 720);
      this.boy(originX - 40 * size, ground - 117 * size, size, .9, run.shoeType, 0, 1, false, true);
    }
    for (const obstacle of run.obstacles) this.obstacle(obstacle, run.effects);
  }
  private obstacle(o: Readonly<Obstacle>, effects: readonly Effect[]): void {
    const c = this.c;
    const x = (o.x - this.cameraX) * this.scale, y = this.height - (o.y - this.cameraY) * this.scale;
    const w = o.width * this.scale, h = o.height * this.scale;
    if (x + w < -100 || x > 1100 || y < -100 || y - h > this.height + 100) return;
    c.save(); c.translate(x, y - h); c.lineWidth = Math.max(2, this.scale * .65); c.strokeStyle = INK;
    const base = o.type === 'truck' ? '#edb456' : o.type === 'vending' ? '#f17761' : o.type === 'wall' ? '#d68b70' : '#e9d5ac';
    c.fillStyle = base;
    if (o.type === 'fence') {
      c.fillStyle = '#9a8771'; for (let i = 0; i < 4; i++) c.fillRect(w * i / 4, 0, Math.max(2, w * .12), h);
      c.fillRect(0, h * .22, w, h * .12); c.fillRect(0, h * .72, w, h * .1);
    } else if (o.type === 'sign') {
      c.fillStyle = '#6c7e76'; c.fillRect(w * .42, h * .46, w * .17, h * .54);
      c.fillStyle = '#ffd671'; c.beginPath(); c.roundRect(0, 0, w, h * .6, Math.min(10, w * .1)); c.fill(); c.stroke();
      this.arrow(w * .16, h * .25, 0, w * .55, '#476479', Math.max(2, h * .04));
    } else if (o.type === 'truck') {
      c.fillRect(0, 0, w * .7, h * .78); c.strokeRect(0, 0, w * .7, h * .78);
      c.fillStyle = '#e47959'; c.fillRect(w * .7, h * .18, w * .3, h * .62);
      c.fillStyle = '#c1e8de'; c.fillRect(w * .77, h * .25, w * .15, h * .2);
      c.fillStyle = '#284252'; for (const a of [.23, .8]) { c.beginPath(); c.arc(w * a, h * .83, h * .15, 0, TAU); c.fill(); }
    } else {
      c.fillRect(0, 0, w, h); c.strokeRect(0, 0, w, h);
      if (o.type === 'wall') {
        c.strokeStyle = '#995c49'; const row = Math.max(5, h / 5); for (let j = 1; j < 5; j++) { this.line(0, j * row, w, j * row, '#995c49', 1.5); for (let k = 0; k < 3; k++) this.line(w * (k / 3 + j % 2 / 6), (j - 1) * row, w * (k / 3 + j % 2 / 6), j * row, '#995c49', 1.5); }
      } else if (o.type === 'vending') { c.fillStyle = '#b5e4df'; c.fillRect(w * .12, h * .12, w * .76, h * .43); c.fillStyle = '#fff4b5'; for (let j = 0; j < 3; j++) c.fillRect(w * (.2 + j * .22), h * .2, w * .1, h * .21); c.fillStyle = '#43595c'; c.fillRect(w * .2, h * .76, w * .55, h * .12); }
      else { c.fillStyle = '#89bfb7'; for (let j = 0; j < 3; j++) for (let k = 0; k < 2; k++) c.fillRect(w * (.12 + k * .46), h * (.1 + j * .25), w * .27, h * .12); c.fillStyle = '#a98c6d'; c.fillRect(w * .3, h * .76, w * .42, h * .24); }
    }
    if (o.broken) {
      const impact = effects.find(e => e.obstacleId === o.id && e.type === 'impact');
      if (impact) {
        const holeX = (impact.x - o.x) * this.scale, holeY = h - (impact.y - o.y) * this.scale;
        const r = Math.max(8, Math.min(w * .45, 11 * this.scale));
        // A dark comic hole sits on the true collision point; it is never assigned to intact objects.
        c.fillStyle = '#294653'; c.strokeStyle = '#ffebb3'; c.lineWidth = 3; c.beginPath();
        for (let i = 0; i < 14; i++) { const a = i * TAU / 14, rr = r * (i % 2 ? .72 : 1.1); const px = holeX + Math.cos(a) * rr, py = holeY + Math.sin(a) * rr; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.closePath(); c.fill(); c.stroke();
      }
    }
    c.restore();
  }
  private effects(run: ShoeRun, reduced: boolean): void {
    const c = this.c, s = this.artScale;
    for (const effect of run.effects) {
      const age = run.flightElapsed - effect.time;
      if (age < 0 || age > 2.5) continue;
      const x = (effect.x - this.cameraX) * this.scale, y = this.height - (effect.y - this.cameraY) * this.scale;
      if (effect.type === 'impact') {
        c.save(); c.globalAlpha = Math.max(0, 1 - age / .9);
        if (!reduced && effect.name === 'BREAK!') for (let i = 0; i < 7; i++) { const a = i * TAU / 7, r = (25 + age * 95) * s; c.fillStyle = i % 2 ? '#f37d50' : '#ffe09b'; c.save(); c.translate(x + Math.cos(a) * r, y + Math.sin(a) * r + age * age * 65); c.rotate(a + age * 5); c.fillRect(-7 * s, -5 * s, 14 * s, 10 * s); c.restore(); }
        drawStar(c, x, y, 50 * s * Math.max(.2, 1 - age), '#ffe899', .3); this.text(effect.name === 'BREAK!' ? 'ドゴッ！' : 'ゴツン！', x + 40 * s, y - 40 * s, 25 * s, '#a64939'); c.restore();
      } else this.specialObject(effect, x, y, age, s);
    }
  }
  private specialObject(effect: Effect, x: number, y: number, age: number, size: number): void {
    const c = this.c;
    if (!['CLOUD NINE', 'AIRPLANE BREAK', 'UFO INCIDENT', 'ORBITAL SHOE'].includes(effect.name)) return;
    c.save(); c.translate(x - age * 42, y); c.scale(size, size); c.lineWidth = 3; c.strokeStyle = INK;
    if (effect.name === 'CLOUD NINE') { this.cloud(0, 0, 86, '#fff9e6'); }
    else if (effect.name === 'AIRPLANE BREAK') {
      c.fillStyle = '#fff4d5'; c.beginPath(); c.moveTo(-112, 0); c.lineTo(-63, -11); c.lineTo(70, -11); c.quadraticCurveTo(117, -3, 107, 9); c.lineTo(-105, 12); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ec7962'; c.beginPath(); c.moveTo(-50, -4); c.lineTo(-87, -43); c.lineTo(-65, -43); c.lineTo(-20, -5); c.moveTo(17, 2); c.lineTo(41, 43); c.lineTo(67, 43); c.lineTo(52, -2); c.fill(); c.stroke();
      c.fillStyle = '#3a99b0'; for (let i = -35; i <= 70; i += 22) c.fillRect(i, -5, 9, 7);
      c.fillStyle = '#265574'; c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.fill(); c.strokeStyle = '#ffedb6'; c.stroke();
    } else if (effect.name === 'UFO INCIDENT') {
      c.fillStyle = '#bbf0bc'; c.beginPath(); c.ellipse(0, -13, 41, 30, 0, Math.PI, TAU); c.fill(); c.stroke();
      c.fillStyle = '#889eae'; c.beginPath(); c.ellipse(0, 2, 81, 24, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#f2d557'; for (let i = -54; i <= 54; i += 27) { c.beginPath(); c.arc(i, 6, 5, 0, TAU); c.fill(); }
      c.fillStyle = '#183746'; c.beginPath(); c.arc(0, -12, 17, 0, TAU); c.fill(); this.text('!?', 28, -42, 26, '#fff4cb');
    } else {
      c.fillStyle = '#a2c8d1'; c.fillRect(-16, -20, 32, 40); c.strokeRect(-16, -20, 32, 40);
      for (const ax of [-74, 27]) { c.fillStyle = '#5373a9'; c.fillRect(ax, -24, 48, 48); c.strokeRect(ax, -24, 48, 48); for (let i = 1; i < 3; i++) { this.line(ax + i * 16, -24, ax + i * 16, 24, '#b6e9e8', 1); this.line(ax, -24 + i * 16, ax + 48, -24 + i * 16, '#b6e9e8', 1); } }
      this.line(0, -20, 10, -43, '#d9f1e5', 3); drawStar(c, 10, -43, 8, '#f9e5a4');
    }
    c.restore();
  }
  private flyingShoe(run: ShoeRun, reduced: boolean): void {
    const c = this.c, s = this.artScale, x = this.shoeX, y = this.shoeY;
    const speed = Math.hypot(run.velocity.x, run.velocity.y), angle = Math.atan2(-run.velocity.y, run.velocity.x);
    if (run.phase === 'flight' && !reduced && speed > 30) {
      c.save(); c.translate(x, y); c.rotate(angle); c.globalAlpha = .44;
      for (let i = 0; i < 5; i++) this.line(-75 * s - i % 2 * 25, (i - 2) * 14 * s, -(125 + Math.min(110, speed * .03)) * s - i % 2 * 30, (i - 2) * 14 * s, '#fffbdc', (i % 2 ? 3 : 5) * s);
      c.restore();
    }
    const reentry = run.maxHeight >= 18000 && run.velocity.y < -200 && run.position.y > 1000;
    if (reentry && !reduced) {
      c.save(); c.translate(x, y); c.rotate(angle); c.fillStyle = '#ffac5b'; c.beginPath(); c.moveTo(-25 * s, -25 * s); c.lineTo(-160 * s, -13 * s); c.lineTo(-125 * s, 4 * s); c.lineTo(-165 * s, 20 * s); c.lineTo(-25 * s, 27 * s); c.closePath(); c.fill(); c.restore();
    }
    if(run.justMax&&run.phase==='flight'&&run.flightElapsed<3.2)this.justTrail(run,x,y,s,angle,Math.max(.12,1-run.flightElapsed/3.2),reduced);
    if(run.presentation.selected&&run.phase==='flight')this.rareFlight(run,x,y,s);
    if(run.presentation.selected==='iron-meteor'&&['landing','result'].includes(run.phase))this.crater(x,y,s,run);
    drawShoe(c, run.shoeType, x, y, 1.13 * s, canvasSpinAngle(run.rotation), true);
    if (run.phase === 'landing' || run.phase === 'result') {
      c.fillStyle = '#18374620'; c.beginPath(); c.ellipse(x, y + 35 * s, 59 * s, 10 * s, 0, 0, TAU); c.fill();
      this.text('ポスッ。', x + 95 * s, y - 35 * s, 27 * s, '#415961');
      if (run.phase === 'landing') for (let i = 0; i < 3; i++) this.cloud(x + (i - 1) * 57 * s, y + 22 * s, 27 * s, '#fff1bfaa');
    }
  }
  private flightCaption(run: ShoeRun): void {
    const c = this.c, s = this.artScale;
    let latest: Effect | undefined;
    const effects = run.effects;
    for (let i = effects.length - 1; i >= 0; i--) { const e = effects[i], age = run.flightElapsed - e.time; if (e.type === 'special' && age >= 0 && age < 2.5) { latest = e; break; } }
    if (latest) {
      const w = 860, x = (1000 - w) / 2, height = Math.min(86 * s, this.height * .18);
      // Keep the announcement away from the actual tracking position, with shoe art on top.
      const y = this.shoeY < this.height * .42 ? this.height - height - 24 * s : Math.min(this.height*.21,112*s)+15*s;
      c.save(); c.globalAlpha = .93; this.capsule(x, y, w, height, '#fff8d9'); c.restore();
      this.text(latest.name, 500, y + height * .45, 30 * Math.min(s, 1.75), '#a74739');
      this.text(SKY_NAMES[latest.name] ?? '靴の可能性、拡大中。', 500, y + height * .79, 18 * s, '#294956');
    } else if (run.breakCombo > 1) {
      this.text('BREAK COMBO × ' + run.breakCombo, 500, Math.min(this.height*.21,112*s)+35*s, 30 * s, '#fff6d3');
    }
  }
  private distanceHud(run:ShoeRun,recordAt:number|null):void{
    const c=this.c,s=this.artScale,h=Math.min(this.height*.21,112*s);
    c.fillStyle='#fffaf0';c.fillRect(14,14,972,h-14);this.line(14,h,986,h,INK,3);
    this.text('飛距離',48,42*s,20*s,INK,'left');
    const value=formatDistance(run.position.x);const font=Math.min(45*s,670/Math.max(6,value.length)*1.65);
    this.text(value,510,72*s,font,INK);
    this.text('最高高度 '+formatDistance(run.maxHeight),960,h-15*s,14*s,'#526b71','right');
    if(recordAt!==null&&run.time-recordAt<1.8)this.text('この靴の記録更新！',48,h-14*s,17*s,'#b04138','left');
  }
  private get hudHeight():number { return Math.min(this.height*.21,112*this.artScale); }
  private justTrail(run:ShoeRun,x:number,y:number,s:number,angle:number,alpha:number,reduced:boolean):void{
    const c=this.c;c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=alpha;
    if(run.shoeType==='zori'){
      c.strokeStyle='#d4f7ee';c.lineWidth=8*s;c.beginPath();for(let i=0;i<65;i++){const t=i/64,px=-30*s-t*220*s,py=Math.sin(t*24+canvasSpinAngle(run.rotation))*25*s;if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.stroke();
    }else if(run.shoeType==='paper'){
      for(let i=0;i<10;i++){const px=-(35+i*23)*s,py=((i%3)-1)*20*s;c.fillStyle=i%2?'#fff9df':'#f6db78';c.beginPath();c.moveTo(px,py);c.lineTo(px-18*s,py-9*s);c.lineTo(px-9*s,py+13*s);c.closePath();c.fill();}
    }else{
      const bulky=run.shoeType==='iron-geta',bullet=run.shoeType==='leather';
      c.fillStyle=bullet?'#d2e6ed':bulky?'#d84337':'#f27a31';c.beginPath();c.moveTo(-20*s,-24*s);c.lineTo(-210*s,-(bulky?48:12)*s);c.lineTo(-145*s,0);c.lineTo(-235*s,(bulky?35:16)*s);c.lineTo(-20*s,25*s);c.closePath();c.fill();
      c.fillStyle=bullet?'#fffaf0':'#ffe692';c.beginPath();c.moveTo(-17*s,-12*s);c.lineTo(-165*s,0);c.lineTo(-17*s,13*s);c.closePath();c.fill();
      if(bulky)for(let i=0;i<4;i++)drawStar(c,-(55+i*40)*s,(i%2?35:-36)*s,9*s,'#e6eef3',i*.7);
    }
    for(let i=0;i<4;i++)this.line(-70*s,(i-1.5)*42*s,-260*s,(i-1.5)*42*s,'#fffaf0',4*s);c.restore();
    if(run.phase==='kick'||run.flightElapsed<.8){c.save();const h=this.hudHeight;const hasCaption=run.phase==='flight'&&run.effects.some(e=>e.type==='special'&&run.flightElapsed-e.time>=0&&run.flightElapsed-e.time<2.5);c.translate(run.phase==='kick'?745:625,h+(run.phase==='kick'?155:hasCaption?180:80)*Math.min(s,1.4));c.rotate(reduced?0:-.1);const word=run.shoeType==='iron-geta'?'ズドォォン!!':run.shoeType==='paper'?'バシュゥゥ!!':'グオオオ!!';c.font='900 '+Math.min(46*s,75)+'px '+FONT;c.textAlign='center';c.strokeStyle=INK;c.lineWidth=10;c.strokeText(word,0,0);c.fillStyle='#ffe272';c.fillText(word,0,0);c.restore();}
  }
  private rareFlight(run:ShoeRun,x:number,y:number,s:number):void{
    const c=this.c,id=run.presentation.selected;
    if(id==='zori-whirlwind'){c.save();c.strokeStyle='#efffed';c.lineWidth=5*s;for(let j=0;j<5;j++){const offset=Math.sin(canvasSpinAngle(run.rotation)+j*.8)*14*s;c.beginPath();c.ellipse(x+offset,y+(j-2)*16*s,(28+j*12)*s,12*s,0,0,TAU);c.stroke();}c.restore();}
    if(id==='paper-star-mail')for(let j=0;j<7;j++)drawStar(c,x-(60+j*26)*s,y+Math.sin(j+run.time)*24*s,(4+j%3*3)*s,'#fff8bd',run.rotation+j);
    if(id)this.text(RARE_LABELS[id],500,this.height-45*s,24*s,'#fff8dc');
  }
  private crater(x:number,y:number,s:number,run:ShoeRun):void{
    const c=this.c;c.save();c.fillStyle='#a37c54';c.strokeStyle='#57443b';c.lineWidth=5*s;c.beginPath();c.ellipse(x,y+30*s,125*s,32*s,0,0,TAU);c.fill();c.stroke();
    for(let i=0;i<9;i++){const a=i*TAU/9;this.line(x+Math.cos(a)*75*s,y+30*s+Math.sin(a)*21*s,x+Math.cos(a)*160*s,y+30*s+Math.sin(a)*52*s,'#6f4b3a',4*s);}
    if(run.phase==='landing')for(let i=0;i<6;i++)this.cloud(x+(i-2.5)*48*s,y+15*s-Math.sin(i)*25*s,30*s,'#ead8b6a0');
    this.text('鉄下駄、天体になる',500,this.height-45*s,28*s,'#713a2e');c.restore();
  }

}
