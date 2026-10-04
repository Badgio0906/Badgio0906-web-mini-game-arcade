import { describe, expect, it } from 'vitest';
import { IMAGE_POOL, TEXT_POOL, UnkoRun } from '../../src/games/game011/UnkoRun';
import type { QuizAnswer, UnkoEvent } from '../../src/games/game011/contracts';

function random(seed:number){let value=seed>>>0;return()=>{value+=0x6D2B79F5;let x=value;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return((x^(x>>>14))>>>0)/4294967296;};}
function answer(run:UnkoRun){const before=run.inspection();expect(before.answerSide).not.toBeNull();expect(run.input(before.answerSide!,before.roundId)).toBe(true);return before;}
function images(run:UnkoRun){answer(run);expect(run.snapshot().phase).toBe('speed_warning');expect(run.advance()).toBe(true);for(let i=1;i<10;i++)answer(run);expect(run.snapshot()).toMatchObject({phase:'text_intro',imageCorrect:10,score:1000});}
function texts(run:UnkoRun){expect(run.advance()).toBe(true);for(let i=0;i<10;i++){expect(run.snapshot().phase).toBe('text_read');expect(run.ready()).toBe(true);answer(run);}expect(run.snapshot()).toMatchObject({phase:'final_choice',textCorrect:10,score:2500});}
function final(mode:QuizAnswer='unko',seed=71){const run=new UnkoRun(()=>{},random(seed));run.start();images(run);texts(run);expect(run.chooseFinal(mode)).toBe(true);return run;}

describe('UNKO or UKON explicit phases, real deadlines and public-input scoring',()=>{
  it('publishes two balanced twenty-item pools, unique selections and varied shuffled runs',()=>{
    expect(IMAGE_POOL).toHaveLength(20);expect(TEXT_POOL).toHaveLength(20);
    for(const pool of [IMAGE_POOL,TEXT_POOL]){expect(new Set(pool.map(item=>item.id)).size).toBe(20);expect(pool.filter(item=>item.answer==='unko')).toHaveLength(10);expect(pool.filter(item=>item.answer==='ukon')).toHaveLength(10);}
    expect(TEXT_POOL.find(item=>item.id==='Q01')).toMatchObject({text:'トイレで出会う可能性が高いのはどっち？',answer:'unko'});
    expect(TEXT_POOL.find(item=>item.id==='Q10')).toMatchObject({text:'ショウガの仲間なのはどっち？',answer:'ukon'});
    expect(TEXT_POOL.find(item=>item.id==='Q20')).toMatchObject({text:'食材・香辛料として利用されるのはどっち？',answer:'ukon'});
    const seenImages=new Set<string>(),seenTexts=new Set<string>(),selections=new Set<string>();
    for(let seed=1;seed<=80;seed++){const run=new UnkoRun(()=>{},random(seed));run.start();const s=run.inspection();expect(s.imageSelection).toHaveLength(10);expect(s.textSelection).toHaveLength(10);expect(new Set(s.imageSelection.map(q=>q.id)).size).toBe(10);expect(new Set(s.textSelection.map(q=>q.id)).size).toBe(10);for(const q of s.imageSelection){expect(IMAGE_POOL.some(item=>item.id===q.id&&item.answer===q.answer&&item.asset===q.asset)).toBe(true);seenImages.add(q.id);}for(const q of s.textSelection){expect(TEXT_POOL.some(item=>item.id===q.id&&item.answer===q.answer&&item.text===q.text)).toBe(true);seenTexts.add(q.id);}selections.add(s.imageSelection.map(q=>q.id).join(','));}
    expect(seenImages.size).toBe(20);expect(seenTexts.size).toBe(20);expect(selections.size).toBeGreaterThan(70);
  });

  it('Q1 grants five seconds, later images one second, and explicit untimed notices cannot answer or queue',()=>{
    const run=new UnkoRun(()=>{},random(21));run.start();expect(run.snapshot()).toMatchObject({phase:'image_answer',deadline:5,remaining:5,score:0});run.step(4.999);expect(run.snapshot().alive).toBe(true);answer(run);
    const notice=run.snapshot();expect(notice).toMatchObject({phase:'speed_warning',score:100,choices:null,deadline:null,remaining:null});expect(run.input('left')).toBe(false);expect(run.ready()).toBe(false);run.step(1000);expect({...run.snapshot(),time:notice.time}).toEqual(notice);expect(run.snapshot().time-notice.time).toBe(1000);
    expect(run.advance()).toBe(true);expect(run.snapshot()).toMatchObject({imageCorrect:1,score:100,deadline:1,remaining:1});expect(run.advance()).toBe(false);
    for(let i=1;i<10;i++){run.step(.99);expect(run.snapshot().alive).toBe(true);answer(run);}expect(run.snapshot()).toMatchObject({phase:'text_intro',imageCorrect:10,score:1000,choices:null});
  });

  it('text reading is unlimited with hidden choices; ready starts a new epoch and exactly .8 seconds',()=>{
    const run=new UnkoRun(()=>{},random(31));run.start();images(run);expect(run.advance()).toBe(true);
    for(let i=0;i<10;i++){const reading=run.snapshot();expect(reading).toMatchObject({phase:'text_read',choices:null,deadline:null,remaining:null});expect(run.input('left')).toBe(false);run.step(123.456);expect({...run.snapshot(),time:reading.time}).toEqual(reading);expect(run.ready()).toBe(true);const ready=run.inspection();expect(ready.roundId).toBeGreaterThan(reading.roundId);expect(ready).toMatchObject({phase:'text_answer',deadline:.8,remaining:.8,answerElapsed:0});expect(run.ready()).toBe(false);expect(run.input(ready.answerSide!,reading.roundId)).toBe(false);run.step(.799);expect(run.snapshot().alive).toBe(true);answer(run);expect(run.snapshot().textCorrect).toBe(i+1);}
    expect(run.snapshot()).toMatchObject({phase:'final_choice',score:2500,textCorrect:10,choices:null});
  });

  it.each(['unko','ukon'] as const)('final %s choice waits indefinitely, awards only future250 and immediately presents a fresh random round',mode=>{
    const run=new UnkoRun(()=>{},random(39));run.start();images(run);texts(run);const choice=run.snapshot();run.step(5000);expect({...run.snapshot(),time:choice.time}).toEqual(choice);expect(run.input('left')).toBe(false);expect(run.chooseFinal(mode)).toBe(true);expect(run.chooseFinal(mode==='unko'?'ukon':'unko')).toBe(false);
    for(let i=0;i<120;i++){const before=run.inspection();expect(before).toMatchObject({phase:'final_answer',deadline:.5,remaining:.5,finalMode:mode});expect(before.question?.answer).toBe(mode);run.step(.499);answer(run);expect(run.snapshot()).toMatchObject({score:2500+250*(i+1),finalStreak:i+1,phase:'final_answer',answerElapsed:0});expect(run.input(run.inspection().answerSide!,before.roundId)).toBe(false);}
  });

  it('full elapsed wall intervals expire each deadline once and reject late inputs instead of stretching a quiz clock',()=>{
    const cases=[()=>{const r=new UnkoRun();r.start();return r;},()=>{const r=new UnkoRun();r.start();answer(r);r.advance();return r;},()=>{const r=new UnkoRun();r.start();images(r);r.advance();r.ready();return r;},()=>final()];
    for(const [index,create] of cases.entries()){const run=create(),before=run.inspection(),deadline=[5,1,.8,.5][index];run.step(deadline+30);expect(run.result()).toMatchObject({outcome:'timeout',actual:null,score:before.score});expect(run.snapshot().answerElapsed).toBeCloseTo(deadline,10);expect(run.result()!.time-before.time).toBeCloseTo(deadline,10);expect(run.input(before.answerSide!)).toBe(false);const ended=run.snapshot();run.step(100);expect(run.snapshot()).toEqual(ended);}
  });

  it('one wrong answer commits once; result/snapshot/selection copies cannot mutate the next run',()=>{
    const events:UnkoEvent[]=[],run=new UnkoRun(event=>events.push(event),random(91));run.start();const inspected=run.inspection();inspected.imageSelection[0].answer='ukon';inspected.textSelection[0].text='external edit';inspected.question!.id='external edit';inspected.choices![0]=inspected.choices![1];expect(run.inspection().question?.id).not.toBe('external edit');expect(run.inspection().textSelection[0].text).not.toBe('external edit');
    const current=run.inspection();run.input(current.answerSide==='left'?'right':'left');const result=run.result()!;expect(result.outcome).toBe('wrong');result.question.text='external edit';expect(run.result()!.question.text).not.toBe('external edit');for(let i=0;i<20;i++){expect(run.input('left')).toBe(false);run.step(50);run.advance();run.ready();run.chooseFinal('unko');}expect(events.filter(e=>e.type==='wrong'||e.type==='timeout')).toHaveLength(1);
    run.start();expect(run.snapshot()).toMatchObject({alive:true,imageCorrect:0,textCorrect:0,finalMode:null,finalStreak:0,score:0,time:0,deadline:5});expect(run.result()).toBeNull();run.reset();expect(run.snapshot()).toMatchObject({alive:false,score:0,time:0,question:null,choices:null});
  });

  it('more than five thousand independent placements per phase approach50:50 and permit repeated same-side answers',()=>{
    const counts={image:{left:0,right:0},text:{left:0,right:0},final:{left:0,right:0}},seenSequence:{image:string;text:string;final:string}={image:'',text:'',final:''};
    const record=(run:UnkoRun,key:keyof typeof counts)=>{const s=run.inspection();expect(s.choices).toHaveLength(2);expect(new Set(s.choices).size).toBe(2);counts[key][s.answerSide!]++;seenSequence[key]+=s.answerSide==='left'?'L':'R';};
    for(let seed=1;seed<=510;seed++){const run=new UnkoRun(()=>{},random(seed*101));run.start();for(let i=0;i<10;i++){record(run,'image');answer(run);if(i===0)run.advance();}run.advance();for(let i=0;i<10;i++){run.ready();record(run,'text');answer(run);}}
    const run=final('unko',8881);for(let i=0;i<5100;i++){record(run,'final');answer(run);expect(run.inspection().imageSelection).toHaveLength(10);expect(run.inspection().textSelection).toHaveLength(10);}
    for(const key of ['image','text','final'] as const){const ratio=counts[key].left/(counts[key].left+counts[key].right);expect(ratio,key).toBeGreaterThan(.47);expect(ratio,key).toBeLessThan(.53);expect(seenSequence[key],`${key} permits same-side streaks`).toMatch(/LLLL|RRRR/);}
    expect(run.snapshot()).toMatchObject({finalStreak:5100,score:1277500});
  });

  it('invalid elapsed deltas and invalid sides cannot advance an active question',()=>{
    const run=new UnkoRun();run.start();const initial=run.snapshot();for(const dt of [NaN,Infinity,-Infinity,-1,0])run.step(dt);expect(run.input('up' as 'left')).toBe(false);expect(run.snapshot()).toEqual(initial);
  });
});
