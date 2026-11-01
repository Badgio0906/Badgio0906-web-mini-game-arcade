#!/usr/bin/env python3
"""Limited design checks only. Not game implementation, browser, art or launcher QA."""
from __future__ import annotations
from collections import deque
from pathlib import Path
import json

checks: list[dict] = []
def check(name: str, passed: bool, detail=None):
    checks.append({'name': name, 'passed': bool(passed), 'detail': detail})

# C21: initial formation, resource schedule and score arithmetic.
impact = [(180 + 24*i, 160) for i in range(6)]
check('C21_initial_six_in_blast', all((x-240)**2+(y-160)**2 <= (68+14)**2 for x,y in impact), impact)
start = [(x-64*.9, y) for x,y in impact]
check('C21_initial_positions_on_field', all(32 <= x <= 448 for x,y in start), start)
check('C21_six_score_2100', 100*6+50*6*5 == 2100)
check('C21_six_beats_separate', 100*6+50*6*5 > 6*100)
check('C21_normal_supply_48', 8*6 == 48)
check('C21_boss_has_ten_seconds', 8*5.5 == 44 and 54-44 == 10)
check('C21_slot_not_ready_before_2100ms', 900+1200 == 2100)
# Example 3 independent initial slots: 3 separate strikes, each >800ms apart.
check('C21_boss_three_hits_time_budget', max([44900, 45800, 46700]) <= 54000 and min([900,900]) >= 800)

# C22: a reference BFS, no game source import.
boards=[
    ([1,2,3,2], []),
    ([0,1,4,2], []),
    ([4,4,1,3], [(0,1)]),
    ([1,3,0,4], [(2,3)]),
    ([2,0,3,4], [(0,1),(2,3)]),
    ([4,1,3,2], [(0,1),(2,3)])
]
def shift(state, row, delta, pairs):
    nxt=list(state)
    nxt[row]=(nxt[row]+delta)%5
    for a,b in pairs:
        if row == a: nxt[b]=(nxt[b]-delta)%5
        elif row == b: nxt[a]=(nxt[a]-delta)%5
    return tuple(nxt)

def solve(init,pairs):
    initial=tuple(init); queue=deque([initial]); pred={initial:None}
    while queue:
        node=queue.popleft()
        if len(set(node))==1:
            trail=[]; cur=node
            while pred[cur] is not None:
                old, action=pred[cur]; trail.append(action); cur=old
            return node[0], list(reversed(trail)), len(pred)
        for row in range(4):
            for d in (-1,1):
                nxt=shift(node,row,d,pairs)
                if nxt not in pred:
                    pred[nxt]=(node, (row,d)); queue.append(nxt)
    return None, [], len(pred)
solutions=[]
for i,(initial,pairs) in enumerate(boards,1):
    target, moves, visited=solve(initial,pairs)
    check(f'C22_room{i}_solvable',target is not None,{'target':target,'moves':moves,'visited':visited})
    cur=tuple(initial)
    for row,d in moves: cur=shift(cur,row,d,pairs)
    check(f'C22_room{i}_replay_aligned',len(set(cur))==1 and cur[0]==target,cur)
    check(f'C22_room{i}_state_bound',visited<=625,visited)
    check(f'C22_room{i}_pair_sums_preserved', all((initial[a]+initial[b])%5==(cur[a]+cur[b])%5 for a,b in pairs))
    solutions.append({'room':i,'initial':initial,'pairs':pairs,'target':target,'min_steps':len(moves),'moves':moves})
check('C22_room1_two_steps',solutions[0]['min_steps']==2)
check('C22_ammo_sufficient',12 >= len(boards))
check('C22_full_pierce_beats_singles',100*4*4+400 > 4*100+100)
check('C22_all_solutions_small',sum(x['min_steps'] for x in solutions) <= 30, sum(x['min_steps'] for x in solutions))

# C23: exact millisecond schedule and receiving docks, no mouse/browser claim.
def is_open(t_ms, dock):
    return (t_ms - (1000 + dock*1800)) % 5400 < 2700
pods=[]
for wave in range(12):
    a=(2*wave)%3; b=(a+1)%3
    lanes=[a]*5 if wave<4 else [a,a,b,b,a]
    for j,lane in enumerate(lanes):
        tin=4000*wave+1000+450*j
        tout=tin+450
        possible=[d for d in range(3) if is_open(tout,d)]
        pods.append({'id':f'{wave}-{j}','wave':wave,'lane':lane,'tin_ms':tin,'tout_ms':tout,'safe_docks':possible})
check('C23_sixty_unique_pods',len(pods)==60 and len({p['id'] for p in pods})==60)
check('C23_all_have_open_destination',all(p['safe_docks'] for p in pods))
check('C23_last_arrival_47250',max(p['tout_ms'] for p in pods)==47250)
check('C23_all_before_end',max(p['tout_ms'] for p in pods)<50000)
check('C23_input_spacing_450ms',min(b['tin_ms']-a['tin_ms'] for a,b in zip(pods,pods[1:]))>=450)
check('C23_first_wave_single_dock0',all(0 in p['safe_docks'] for p in pods[:5]))
check('C23_open_start_inclusive',is_open(1000,0))
check('C23_open_end_exclusive',not is_open(3700,0))
check('C23_wrapped_open',is_open(6400,0))
check('C23_each_cycle_has_open_dock',all(any(is_open(t,d) for d in range(3)) for t in range(5400)))
no_input=sum(p['lane']==0 and 0 in p['safe_docks'] for p in pods)
fixed_out=[sum(d in p['safe_docks'] for p in pods) for d in range(3)]
check('C23_no_input_not_clear',no_input<42,no_input)
check('C23_input_only_fixed_exit_not_best',max(fixed_out)<60,fixed_out)
# Available one-finger timing schedule: choose inlet at tin-200 and exit at tin-100.
# These are scheduled control changes, NOT proof that a human can execute them.
controls=[]; out=0
for p in pods:
    if out not in p['safe_docks']: out=p['safe_docks'][0]
    controls.extend([{'at_ms':p['tin_ms']-200,'selector':'in','value':p['lane']},
                     {'at_ms':p['tin_ms']-100,'selector':'out','value':out}])
check('C23_reference_control_changes_ordered',all(a['at_ms'] < b['at_ms'] for a,b in zip(controls,controls[1:])))
check('C23_reference_control_gap_over80',min(b['at_ms']-a['at_ms'] for a,b in zip(controls,controls[1:]))>=80)
whole=[]
for w in range(12):
    group=pods[w*5:(w+1)*5]
    possible=[d for d in range(3) if all(d in p['safe_docks'] for p in group)]
    whole.append({'wave':w,'single_dock_candidates':possible})
check('C23_has_same_boat_and_split_boat_waves',any(g['single_dock_candidates'] for g in whole) and any(not g['single_dock_candidates'] for g in whole), whole)
def group_bonus(resolved):
    if len(resolved) != 5 or not all(r['rescued'] for r in resolved): return 0
    return 500 if len({r['dock'] for r in resolved}) == 1 else 300
check('C23_group_single_dock_bonus500', group_bonus([{'rescued':True,'dock':1} for _ in range(5)])==500)
check('C23_group_multiple_dock_bonus300', group_bonus([{'rescued':True,'dock':j%3} for j in range(5)])==300)
check('C23_group_failure_bonus0', group_bonus([{'rescued':j<4,'dock':1} for j in range(5)])==0)
check('C23_group_partial_not_resolved', group_bonus([{'rescued':True,'dock':1} for _ in range(4)])==0)

report={
 'scope':'Design arithmetic, finite-board reachability and timing table only. NOT game/launcher QA.',
 'passed':sum(c['passed'] for c in checks),'total':len(checks),'checks':checks,
 'shift_solutions':solutions,
 'warp_control_schedule':controls,
 'not_tested':['game source','browser input','Windows launcher','ImageGen assets','audio listening','performance','human fun'],
}
p=Path(__file__).with_name('DESIGN_PRECHECK_RESULTS.json')
p.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'passed':report['passed'],'total':report['total'],'output':str(p)},ensure_ascii=False))
if report['passed'] != report['total']:
    for c in checks:
        if not c['passed']: print('FAIL', c)
    raise SystemExit(1)

