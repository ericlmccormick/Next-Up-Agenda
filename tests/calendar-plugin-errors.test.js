'use strict';
// Failure paths that must never clear a valid calendar or strand Force Sync.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/pkjs/index.js','utf8');

function harness(noPlugin) {
  const handlers={},subs=[],sent=[],data={},timers=new Map();
  let id=0,unsubs=0;
  function Clay(){this.setSettings=()=>{};this.getSettings=()=>({});this.generateUrl=()=>'';}
  const Pebble={
    addEventListener:(name,fn)=>handlers[name]=fn,
    sendAppMessage:(message,ok)=>{
      sent.push(message);
      if(message.CHUNK_INDEX!==undefined)
        handlers.appmessage({payload:{SYNC_ID:message.SYNC_ID,CHUNK_ACK:message.CHUNK_INDEX}});
      if(ok)ok();
    },
    getActiveWatchInfo:()=>({platform:'emery'}),openURL:()=>{}
  };
  if(!noPlugin) Pebble.subscribeToSource=options=>{
    subs.push(options);return {unsubscribe:()=>{unsubs++;}};
  };
  const storage={getItem:k=>Object.prototype.hasOwnProperty.call(data,k)?data[k]:null,
    setItem:(k,v)=>data[k]=String(v),removeItem:k=>delete data[k]};
  const scope={require:n=>n==='pebble-clay'?Clay:n==='message_keys'?{}:[],
    Pebble,localStorage:storage,
    setTimeout:(fn,delay)=>{let key=++id;timers.set(key,{fn,delay});return key;},
    clearTimeout:key=>timers.delete(key),console};
  vm.createContext(scope);vm.runInContext(source,scope);
  function fire(delay) {
    const t=Array.from(timers.entries()).find(([,v])=>v.delay===delay);
    assert(t,'Expected '+delay+'ms timer');
    timers.delete(t[0]);t[1].fn();
  }
  function messages(type){return sent.filter(m=>type in m);}
  handlers.ready();
  return {handlers,subs,sent,data,scope,fire,messages,get unsubs(){return unsubs;}};
}

const unavailable=harness(true);
assert.equal(unavailable.messages('SYNC_STATUS').length,1,
  'unavailable Calendar plugin reports a watch-visible failure');
assert.equal(unavailable.messages('SYNC_STATUS')[0].SYNC_STATUS,'error');

const h=harness(false);
const start=Math.floor(Date.now()/1000)+3600;
const event={instanceId:'one',properties:{
  name:{longText:{text:'Weekly Meeting'}},
  starts_at:{timestamp:{value:start}},
  ends_at:{timestamp:{value:start+3600}},
  calendar:{shortText:{text:'Personal'}}
}};
h.subs[0].onData({instances:[event]});
h.fire(750);
const initialCount=h.messages('TOTAL_EVENTS').length;
assert.equal(initialCount,1);
assert.equal(JSON.parse(h.data.detail_cache_events).length,1);
// Incomplete/mismatched plugin payloads must not replace the cached agenda.
h.subs[0].onData({});
h.subs[0].onData({instances:[{properties:{unexpected:{shortText:{text:'value'}}}}]});
assert.equal(h.messages('TOTAL_EVENTS').length,initialCount);
assert.equal(JSON.parse(h.data.detail_cache_events).length,1);
// Force Sync restarts the source, discards any late old-source callbacks and
// sends the same calendar again even when its content has not changed.
h.handlers.appmessage({payload:{SYNC_COMMAND:'refresh'}});
assert.equal(h.subs.filter(x=>x.category==='calendar').length,2);
assert.equal(h.unsubs,1);
h.subs[0].onData({instances:[]}); // stale result from unsubscribed source
assert.equal(h.messages('TOTAL_EVENTS').length,initialCount);
h.subs[2].onData({instances:[event]});
h.fire(750);
assert.equal(h.messages('TOTAL_EVENTS').length,initialCount+1,
  'Force Sync must resend unchanged appointments and finish watchdog on watch');
assert.equal(JSON.parse(h.data.detail_cache_events).length,1);
// A properly formed empty response is different from a schema error.
h.subs[2].onData({instances:[]});
h.fire(750);
assert.equal(JSON.parse(h.data.detail_cache_events).length,0);
assert.equal(h.messages('TOTAL_EVENTS').at(-1).TOTAL_EVENTS,0);

// A calendar source that never returns data must report an error after startup.
const delayed=harness(false);
delayed.fire(12000);
assert.equal(delayed.messages('SYNC_STATUS').at(-1).SYNC_STATUS,'error');
console.log('Plugin errors, malformed envelopes, stale callbacks and forced resync tests passed');
