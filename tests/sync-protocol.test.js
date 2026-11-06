'use strict';
// Transaction ACKs and retry with native Calendar plugin as the only data source.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/pkjs/index.js','utf8');
const handlers={},sent=[],subs=[],data={};const timers=new Map();let timerId=0;
const storage={getItem:k=>Object.prototype.hasOwnProperty.call(data,k)?data[k]:null,
setItem:(k,v)=>data[k]=String(v),removeItem:k=>delete data[k]};
function Clay(){this.setSettings=()=>{};this.getSettings=()=>({});this.generateUrl=()=>'';}
const Pebble={addEventListener:(name,fn)=>handlers[name]=fn,
subscribeToSource:options=>{subs.push(options);return {unsubscribe:()=>{}};},
getActiveWatchInfo:()=>({platform:'emery'}),
sendAppMessage:(msg,success)=>{sent.push(msg);if(success)success();},
openURL:()=>{}};
const ctx={require:name=>name==='pebble-clay'?Clay:name==='message_keys'?{}:[],
Pebble,localStorage:storage,
setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;},
clearTimeout:id=>timers.delete(id),console};
vm.createContext(ctx);vm.runInContext(source,ctx);
function ack(id,index){handlers.appmessage({payload:{SYNC_ID:id,CHUNK_ACK:index}});}
function fire(ms){const t=Array.from(timers.entries()).find(([,v])=>v.ms===ms);
assert(t,'Expected timer '+ms);timers.delete(t[0]);t[1].fn();}
handlers.ready();
assert.equal(subs[0].category,'calendar');
assert.equal(sent.length,0,'no event payload without calendar response');
const now=Math.floor(Date.now()/1000);
const instances=['Réunion','Gym','Meeting'].map((name,i)=>({instanceId:String(i),properties:{
 name:{longText:{text:name}},
 starts_at:{timestamp:{value:now+3600+i*86400}},
 ends_at:{timestamp:{value:now+7200+i*86400}},
 calendar:{shortText:{text:'Personal'}}
}}));
subs[0].onData({instances});fire(750);
assert.equal(sent.length,1,'initial chunk sent');
const first=sent[0],id=first.SYNC_ID;
assert.equal(first.EVENT_DATA.length,130);
assert.equal(data.last_fetch_time,undefined,'cache must not commit before final ACK');
ack(id+1,0);assert.equal(sent.length,1,'stale ACK ignored');
fire(10000);fire(350);
assert.equal(sent.length,2,'retransmission after timeout');
assert.equal(sent[1].SYNC_ID,id,'retry preserves ID');
assert.deepEqual(Array.from(sent[1].EVENT_DATA),Array.from(first.EVENT_DATA));
ack(id,0);assert.equal(sent.length,3,'second chunk after first ACK');
ack(id,0);assert.equal(data.last_fetch_time,undefined,'duplicate ACK ignored');
ack(id,1);
assert(data.last_fetch_time,'committed after final ACK');
assert.equal(JSON.parse(data.detail_cache_events).length,3);
// Watch has lost its stored event list but the plugin data is unchanged.
// A new watch request must resend events despite an identical signature.
handlers.appmessage({payload:{SYNC_COMMAND:'sync'}});
assert.equal(sent.length,4,'explicit watch resync sends unchanged calendar');
assert.notEqual(sent[3].SYNC_ID,id,'resync uses a new transaction');
console.log('Calendar plugin transactional ACK/retry regression tests passed');
