export type PointerRole = 'move' | 'look' | 'dig' | 'place' | 'jump';
interface PointerState { role:PointerRole; startX:number; startY:number; x:number; y:number; maxDistance:number }

/** A pointer keeps its original role until release, even when it crosses another control. */
export class PointerRoles {
  private readonly pointers = new Map<number, PointerState>();
  begin(id:number, role:PointerRole, x:number, y:number):boolean {
    if (this.pointers.has(id) || ((role === 'move' || role === 'look') && this.has(role))) return false;
    this.pointers.set(id, { role, startX:x, startY:y, x, y, maxDistance:0 });
    return true;
  }
  update(id:number, x:number, y:number):{role:PointerRole; dx:number; dy:number}|null {
    const p = this.pointers.get(id);
    if (!p) return null;
    const delta = { role:p.role, dx:x-p.x, dy:y-p.y };
    p.x=x; p.y=y;
    p.maxDistance=Math.max(p.maxDistance, Math.hypot(x-p.startX, y-p.startY));
    return delta;
  }
  release(id:number, cancelled=false):{role:PointerRole; tap:boolean}|null {
    const p=this.pointers.get(id);
    if (!p) return null;
    this.pointers.delete(id);
    return {role:p.role, tap:!cancelled && p.role==='place' && p.maxDistance<=18};
  }
  has(role:PointerRole):boolean { return [...this.pointers.values()].some(p=>p.role===role); }
  get(id:number):Readonly<PointerState>|undefined { return this.pointers.get(id); }
  movement(radius=42):{right:number; forward:number} {
    const p=[...this.pointers.values()].find(p=>p.role==='move');
    if (!p) return {right:0, forward:0};
    const dx=p.x-p.startX, dy=p.y-p.startY;
    const scale=Math.max(radius, Math.hypot(dx,dy));
    return {right:dx/scale, forward:-dy/scale};
  }
  clear():void { this.pointers.clear(); }
}

export interface InputCallbacks {
  look:(dx:number,dy:number)=>void;
  place:()=>void;
  select:(id:number)=>void;
  pause:()=>void;
  unlockAudio:()=>void;
}

/** PC and touch adapter. No body, hand or tool is displayed by this controller. */
export class Input {
  active=false;
  sensitivity=.0025;
  readonly roles=new PointerRoles();
  private readonly keys=new Set<string>();
  private readonly captureTargets=new Map<number,HTMLElement>();
  private readonly lifetime=new AbortController();
  private pendingJump=false;
  private selected=1;
  private wasLocked=false;
  private ownLockExit=false;
  private readonly joystick:HTMLElement|null;
  private joystickRadius=42;

  constructor(private readonly canvas:HTMLCanvasElement, private readonly callbacks:InputCallbacks) {
    const signal=this.lifetime.signal;
    this.joystick=document.getElementById('joystick');
    canvas.addEventListener('pointerdown',e=>this.canvasDown(e),{signal});
    // A second mouse button pressed while left is held does not generate a
    // second pointerdown. mousedown preserves right-click placement for chords.
    canvas.addEventListener('mousedown',e=>{
      if(this.active&&document.pointerLockElement===canvas&&e.button===2) {
        e.preventDefault();callbacks.unlockAudio();callbacks.place();
      }
    },{signal});
    canvas.addEventListener('mousemove',e=>{
      if (this.active && document.pointerLockElement===canvas) this.look(e.movementX,e.movementY);
    },{signal});
    canvas.addEventListener('wheel',e=>{
      if (!this.active) return;
      e.preventDefault();
      if (!e.deltaY) return;
      this.selected=(this.selected-1+(e.deltaY>0?1:7))%8+1;
      callbacks.select(this.selected);
    },{signal,passive:false});
    canvas.addEventListener('contextmenu',e=>{if(this.active)e.preventDefault();},{signal});
    this.joystick?.addEventListener('pointerdown',e=>this.begin(e,'move',this.joystick!),{signal});
    for (const role of ['dig','place','jump'] as const) {
      const button=document.getElementById(role);
      button?.addEventListener('pointerdown',e=>this.begin(e,role,button),{signal});
      button?.addEventListener('contextmenu',e=>{if(this.active)e.preventDefault();},{signal});
    }
    document.querySelectorAll<HTMLElement>('#palette [data-material]').forEach(button=>{
      button.addEventListener('pointerdown',e=>{
        if(!this.active || (e.pointerType==='mouse' && e.button!==0))return;
        const id=Number(button.dataset.material);
        if(!Number.isInteger(id)||id<1||id>8)return;
        e.preventDefault();
        this.callbacks.unlockAudio();
        this.selectMaterial(id);
      },{signal});
      button.addEventListener('keydown',e=>{
        if(this.active && !e.repeat && (e.code==='Enter'||e.code==='Space')) {
          e.preventDefault(); this.selectMaterial(Number(button.dataset.material));
        }
      },{signal});
    });
    window.addEventListener('pointermove',e=>this.pointerMove(e),{signal,passive:false});
    window.addEventListener('pointerup',e=>this.release(e,false),{signal,passive:false});
    window.addEventListener('pointercancel',e=>this.release(e,true),{signal,passive:false});
    // Capture loss is not equivalent to releasing a placement tap.
    document.addEventListener('lostpointercapture',e=>this.release(e as PointerEvent,true),{signal,capture:true});
    window.addEventListener('keydown',e=>this.keyDown(e),{signal});
    window.addEventListener('keyup',e=>{this.keys.delete(e.code);},{signal});
    document.addEventListener('pointerlockchange',()=>{
      const locked=document.pointerLockElement===canvas;
      const lost=this.wasLocked&&!locked;
      this.wasLocked=locked;
      if(lost) {
        const pause=this.active&&!this.ownLockExit;
        this.ownLockExit=false;
        this.clear();
        if(pause)callbacks.pause();
      }
    },{signal});
    const interrupt=()=>{
      const pause=this.active;
      this.clear();
      if(pause)callbacks.pause();
    };
    window.addEventListener('blur',interrupt,{signal});
    window.addEventListener('orientationchange',interrupt,{signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();},{signal});
  }

  get forward():number {
    if(!this.active)return 0;
    return Math.max(-1,Math.min(1,this.roles.movement(this.joystickRadius).forward+
      (this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)));
  }
  get right():number {
    if(!this.active)return 0;
    return Math.max(-1,Math.min(1,this.roles.movement(this.joystickRadius).right+
      (this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0)));
  }
  get jump():boolean {return this.active&&this.pendingJump;}
  get dig():boolean {return this.active&&(this.keys.has('KeyF')||this.roles.has('dig'));}
  consumeJump():boolean {const jump=this.jump;this.pendingJump=false;return jump;}
  /** Keep wheel selection aligned with a restored world's selected material. */
  syncSelected(id:number):void {if(Number.isInteger(id)&&id>=1&&id<=8)this.selected=id;}
  setActive(active:boolean):void {
    this.clear();this.active=active;
    if(!active&&document.pointerLockElement===this.canvas) {
      this.ownLockExit=true;document.exitPointerLock();
    }
  }
  clear():void {
    this.keys.clear();this.roles.clear();this.pendingJump=false;
    const captures=[...this.captureTargets.entries()];this.captureTargets.clear();
    for(const [id,target] of captures) {
      try {if(target.hasPointerCapture(id))target.releasePointerCapture(id);} catch { /* already released */ }
    }
    this.updateStick();
  }
  async requestLock():Promise<boolean> {
    if(typeof this.canvas.requestPointerLock!=='function')return false;
    try {
      const request=this.canvas.requestPointerLock();
      if(request && typeof request.then==='function')await request;
      // Promise-based browsers have committed the lock; older implementations
      // report the asynchronous result through pointerlockchange.
      return document.pointerLockElement===this.canvas;
    } catch {return false;}
  }
  destroy():void {this.setActive(false);this.lifetime.abort();}
  private look(dx:number,dy:number):void {this.callbacks.look(dx*this.sensitivity,dy*this.sensitivity);}
  private selectMaterial(id:number):void {
    if(Number.isInteger(id)&&id>=1&&id<=8){this.selected=id;this.callbacks.select(id);}
  }
  private canvasDown(e:PointerEvent):void {
    if(!this.active)return;
    this.callbacks.unlockAudio();
    if(e.pointerType==='mouse'&&document.pointerLockElement===this.canvas) {
      if(e.button===0)this.begin(e,'dig',this.canvas);
      else if(e.button===2)e.preventDefault();
    } else if(e.pointerType!=='mouse'||e.button===0)this.begin(e,'look',this.canvas);
  }
  private begin(e:PointerEvent,role:PointerRole,target:HTMLElement):void {
    if(!this.active||(e.pointerType==='mouse'&&e.button!==0))return;
    if(!this.roles.begin(e.pointerId,role,e.clientX,e.clientY))return;
    e.preventDefault();this.callbacks.unlockAudio();
    this.captureTargets.set(e.pointerId,target);
    try{target.setPointerCapture(e.pointerId);}catch{/* Keyboard/test environments may lack capture. */}
    if(role==='jump')this.pendingJump=true;
    if(role==='move') {
      const box=target.getBoundingClientRect();
      this.joystickRadius=Math.max(24,Math.min(box.width,box.height)/2);
      this.updateStick();
    }
  }
  private pointerMove(e:PointerEvent):void {
    if(!this.active)return;
    const delta=this.roles.update(e.pointerId,e.clientX,e.clientY);
    if(!delta)return;
    e.preventDefault();
    if(delta.role==='look')this.look(delta.dx,delta.dy);
    if(delta.role==='move')this.updateStick();
  }
  private release(e:PointerEvent,cancelled:boolean):void {
    const target=this.captureTargets.get(e.pointerId);
    if(!target)return;
    this.roles.update(e.pointerId,e.clientX,e.clientY);
    const result=this.roles.release(e.pointerId,cancelled);
    this.captureTargets.delete(e.pointerId);
    if(e.cancelable)e.preventDefault();
    try {if(target.hasPointerCapture(e.pointerId))target.releasePointerCapture(e.pointerId);}catch{/* already released */}
    if(result?.role==='move')this.updateStick();
    if(this.active&&result?.tap) {
      const rect=target.getBoundingClientRect();
      if(e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom) {
        this.callbacks.place();
      }
    }
  }
  private updateStick():void {
    const move=this.roles.movement(this.joystickRadius);
    this.joystick?.style.setProperty('--stick-x',`${move.right*this.joystickRadius*.6}px`);
    this.joystick?.style.setProperty('--stick-y',`${-move.forward*this.joystickRadius*.6}px`);
  }
  private keyDown(e:KeyboardEvent):void {
    if(!this.active||e.defaultPrevented)return;
    const target=e.target;
    if(target instanceof HTMLElement&&(target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))return;
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyF','KeyG','Escape'].includes(e.code)) {
      // Held keys cannot re-enter gameplay after a menu cleared their press.
      if(e.repeat&&!this.keys.has(e.code))return;
      e.preventDefault();this.callbacks.unlockAudio();
      const wasDown=this.keys.has(e.code);
      this.keys.add(e.code);
      if(!e.repeat&&!wasDown) {
        if(e.code==='Space')this.pendingJump=true;
        if(e.code==='KeyG')this.callbacks.place();
        if(e.code==='Escape'){this.clear();this.callbacks.pause();}
      }
    }
    if(!e.repeat&&/^Digit[1-8]$/.test(e.code)){e.preventDefault();this.selectMaterial(Number(e.code.slice(-1)));}
  }
}
