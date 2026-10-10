import { describe, expect, it } from 'vitest';
import { summarizeFishing } from '../../analytics-worker/src/aggregate';
import type { AnalyticsEnvelope } from '../../src/data/analyticsEnvelope';

// Synthetic reproduction of the currently observed controller payload contract.
// It does not claim a browser RUN or production upload (032 transport is disabled).
const base: AnalyticsEnvelope = {schema_version:2,event_id:'00000000-0000-4000-8000-000000000001',occurred_at:'2026-10-10T00:00:00.000Z',game_id:'game032',game_version:'prototype-1',rules_version:'1',presentation_version:'prototype-1',browser_id:'00000000-0000-4000-8000-000000000002',visit_id:'synthetic-visit',session_id:'synthetic-page',run_id:'synthetic-run',event_name:'run_start',environment:'synthetic',device_class:'desktop',input_type:'keyboard',page:'game032.html',data:{mode:'standard'}};

describe('Game032 completion mode is explicit per event, not inherited from RUN start',()=>{
  it('reproduces lost completed metrics without mode and recovers them by adding standard only to completion',()=>{
    const landed:AnalyticsEnvelope={...base,event_id:'00000000-0000-4000-8000-000000000003',event_name:'specific_game_events',data:{event:'fish_landed',mode:'standard',fish_id:'yamame',points:170}};
    const omitted:AnalyticsEnvelope={...base,event_id:'00000000-0000-4000-8000-000000000004',event_name:'run_end',data:{outcome:'complete',completed:true,score:170,fish_count:1}};
    expect(summarizeFishing([base,landed,omitted])).toMatchObject({landed_event_count:1,completed_outing_count:0,average_fish_per_completed_outing:null,average_score:null});
    const explicit:AnalyticsEnvelope={...omitted,data:{...omitted.data,mode:'standard'}};
    expect(summarizeFishing([base,landed,explicit])).toMatchObject({landed_event_count:1,completed_outing_count:1,average_fish_per_completed_outing:1,average_score:170,sample_size_small:true});
    for(const data of [{...explicit.data,mode:'practice'},{...explicit.data,outcome:'quit',completed:false}])expect(summarizeFishing([{...explicit,data}])).toMatchObject({completed_outing_count:0,average_fish_per_completed_outing:null,average_score:null});
  });
});
