/* Fixed, optional Godot JavaScriptBridge interface. No eval, engine internals or save scraping. */
(() => {
  'use strict';
  const game = ({'yokodori-days':'game012','tachibana-task-heaven':'game013','finger-heart-challenge':'game014'})[location.pathname.split('/').at(-2)];
  const session = new URLSearchParams(location.search).get('records_session');
  const uuid = v => typeof v === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
  const runs = new Set();
  function send(id,kind,mode,practice,extra={}) {
    if (id !== game || parent === window || !uuid(session) || typeof practice !== 'boolean' || !['normal','ojt'].includes(mode)) return;
    parent.postMessage({channel:'game100-native-record',schema:1,game_id:game,session,kind,ruleset_id:'1',mode_id:mode,practice,...extra},location.origin);
  }
  globalThis.GAME100_RECORD_BRIDGE = Object.freeze({
    legacyBest(id,value) {if(Number.isSafeInteger(value)&&value>=-1)send(id,'legacy_best','normal',false,{value});},
    currentBest(id,value) {if(Number.isSafeInteger(value)&&value>=-1)send(id,'current_best','normal',false,{value});},
    storageError(id) {send(id,'storage_error','normal',false);},
    cancelRun(id) {if(id!==game)return;runs.clear();send(id,'scope_end','normal',false);},
    startRun(id,rules,mode,practice) {
      if(id!==game||rules!=='1'||!uuid(session)||!['normal','ojt'].includes(mode)||typeof practice!=='boolean')return '';
      const run=crypto.randomUUID();runs.add(run);while(runs.size>32)runs.delete(runs.values().next().value);
      send(id,'start',mode,practice,{run_result_id:run});return run;
    },
    finishRun(id,run,rules,mode,value,practice) {
      if(id!==game||rules!=='1'||!runs.has(run)||!Number.isSafeInteger(value)||value<0||typeof practice!=='boolean')return;
      runs.delete(run);send(id,'result',mode,practice,{run_result_id:run,value});
    }
  });
})();
