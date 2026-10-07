/** One physical gesture may activate only the menu generation where it began. */
export class InputEpoch {
    epoch = 0;
    private down: {
        target: EventTarget;
        epoch: number;
        pointer: number;
    } | null = null;
    private keys = new Set<string>();
    change(): void { this.epoch++; this.down = null; }
    pointerDown(target: EventTarget, pointer: number): void { this.down = { target, epoch: this.epoch, pointer }; }
    cancel(): void { this.down = null; }
    click(target: EventTarget, detail: number): boolean { if (detail === 0)
        return true; const valid = this.down?.epoch === this.epoch && this.down.target === target; this.down = null; return valid; }
    press(key: string, repeat = false): boolean { if (repeat || this.keys.has(key))
        return false; this.keys.add(key); return true; }
    release(key: string): void { this.keys.delete(key); }
    clearKeys(): void { this.keys.clear(); }
}
