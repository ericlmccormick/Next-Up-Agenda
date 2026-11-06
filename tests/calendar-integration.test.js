'use strict';
// Calendar is the sole event source, including after migration from a prior ICS install.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/pkjs/index.js','utf8');
const now=Date.now();
function scenario(previousIcs) {
 const handlers={},sent=[],timers=new Map(),subs=[],data={};let nextId=0,requests=0;
 if(previousIcs) {
   data.user_ical_url_1='https://old.example/calendar.ics';
   data.hybrid_plugin_enabled='false'; // Legacy setting must be ignored.
   data.hybrid_calendar_color_map=JSON.stringify({Personal:2,Work:5});
   data.detail_cache_sources='[{"url":"https://old.example/calendar.ics","color":1}]';
   data.detail_cache_events=JSON.stringify([{title:'Obsolete ICS',timestampMs:now+3600000}]);
 }
 const storage={getItem:k=>Object.prototype.hasOwnProperty.call(data,k)?data[k]:null,
 setItem:(k,v)=>data[k]=String(v),removeItem:k=>delete data[k]};
 function LegacyRequest(){requests++ ;throw Error('ICS must never be fetched');}
 function Clay(){this.setSettings=()=>{};this.generateUrl=()=>'';this.getSettings=()=>({});}
 const pebble={
  addEventListener:(name,fn)=>handlers[name]=fn,
  subscribeToSource:options=>{subs.push(options);return {unsubscribe:()=>{}};},
  sendAppMessage:(payload,ok)=>{
    sent.push(payload);
    if(payload.CHUNK_INDEX!==undefined)
      handlers.appmessage({payload:{SYNC_ID:payload.SYNC_ID,CHUNK_ACK:payload.CHUNK_INDEX}});
    if(ok)ok();
  },
  getActiveWatchInfo:()=>({platform:'emery'}),openURL:()=>{}
 };
 const ctx={require:name=>name==='pebble-clay'?Clay:name==='message_keys'?{}:[],
  Pebble:pebble,localStorage:storage,XMLHttpRequest:LegacyRequest,
  setTimeout:(fn,ms)=>{let id=++nextId;timers.set(id,{fn,ms});return id;},
  clearTimeout:id=>timers.delete(id),console};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 function fire(ms){
  const entry=Array.from(timers.entries()).find(([,v])=>v.ms===ms);
  assert(entry,'Missing timer '+ms);
  timers.delete(entry[0]);entry[1].fn();
 }
 handlers.ready();
 assert.equal(subs.length,2,'Calendar and Weather plugin subscriptions');
 assert.equal(subs[0].category,'calendar');
 assert.equal(subs[1].category,'weather');
 assert.equal(requests,0);
 assert.equal(data.last_fetch_time,undefined,'no false sync on launch');
 assert(!ctx.detailCacheRestored,'outdated ICS cache ignored');
 const instances=[
  {instanceId:'a',properties:{name:{longText:{text:'Shared'}},
    starts_at:{timestamp:{value:Math.floor((now+1800000)/1000)}},
    ends_at:{timestamp:{value:Math.floor((now+5400000)/1000)}},
    calendar:{shortText:{text:'Personal'}},location:{longText:{text:'Test room'}}}},
  {instanceId:'b',properties:{name:{longText:{text:'Plugin Only'}},
    starts_at:{timestamp:{value:Math.floor((now+7200000)/1000)}},
    ends_at:{timestamp:{value:Math.floor((now+9000000)/1000)}},
    calendar:{shortText:{text:'Work'}}}},
  // Recurring title on another day must remain visible.
  {instanceId:'c',properties:{name:{shortText:{text:' Plugin Only '}},
    starts_at:{timestamp:{value:Math.floor((now+86400000)/1000)}},
    calendar:{shortText:{text:'Work'}}}},
  // Exact copy of the same Work event should be collapsed.
  {instanceId:'duplicate',properties:{name:{shortText:{text:' plugin only '}},
    starts_at:{timestamp:{value:Math.floor((now+7200000)/1000)}},
    ends_at:{timestamp:{value:Math.floor((now+9000000)/1000)}},
    calendar:{shortText:{text:'Work'}}}},
  // Same title/time on a different calendar is a distinct appointment.
  {instanceId:'other-calendar',properties:{name:{shortText:{text:'Shared'}},
    starts_at:{timestamp:{value:Math.floor((now+1800000)/1000)}},
    calendar:{shortText:{text:'Work'}}}},
  // Distinct same-calendar appointment with a different meeting room.
  {instanceId:'another-room',properties:{name:{shortText:{text:'Shared'}},
    starts_at:{timestamp:{value:Math.floor((now+1800000)/1000)}},
    ends_at:{timestamp:{value:Math.floor((now+5400000)/1000)}},
    calendar:{shortText:{text:'Personal'}},
    location:{longText:{text:'Other room'}}}}
 ];
 subs[0].onData({instances});fire(750);
 const events=JSON.parse(data.detail_cache_events);
 assert.equal(events.length,5,'recurrences, distinct rooms and calendars preserved; exact duplicate removed');
 assert.equal(events.filter(x=>x.title.trim().toLowerCase()==='plugin only').length,2,'same-title events on different days both remain');
 assert.equal(events.filter(x=>x.title.trim().toLowerCase()==='shared').length,3,'same-time events on different calendars or in different rooms remain');
 assert(!events.some(x=>x.title==='Obsolete ICS'),'old ICS data not reused');
 assert(events.some(x=>x.location==='Test room'),'native location retained');
 assert.equal(events.find(x=>x.calendarName==='Personal').calendarColor,previousIcs?2:4);
 assert.equal(events.find(x=>x.calendarName==='Work').calendarColor,previousIcs?5:4);
 assert(sent.some(x=>x.EVENT_DATA),'watch received events');
 assert(data.last_fetch_time,'cache written after full ACK');
 assert.equal(data.detail_cache_sources,'native-calendar-only-v1');
 assert.equal(requests,0);
 // An authoritative empty plugin update clears the watch instead of retaining stale events.
 subs[0].onData({instances:[]});fire(750);
 assert.equal(JSON.parse(data.detail_cache_events).length,0,'empty calendar clears cache');
 assert(sent.some(x=>x.TOTAL_EVENTS===0),'empty watch update sent');
}
scenario(false);
scenario(true);
console.log('Native Calendar-only integration, recurrence preservation, dedup, migration and empty-state tests passed');
