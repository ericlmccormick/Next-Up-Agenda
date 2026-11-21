'use strict';
// Verify native Weather envelope parsing, calendar coexistence, and solar fallback.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/pkjs/index.js','utf8');
const start=source.indexOf('var forecastPending=null;');
const end=source.indexOf('function stopPluginCalendar()',start);
assert(start>0 && end>start,'weather adapter present');
const signals=[];
const storage={};
const listeners=[];
let timerId=0,unsubscribed=0,ackSource;
const ctx={
  console:{log:()=>{}},
  localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=String(v)},
  Pebble:{
    subscribeToSource:options=>{
      listeners.push(options);
      return {unsubscribe:()=>{unsubscribed++;}};
    },
    sendAppMessage:(payload,success)=>{
      signals.push(payload);
      if (payload.WEATHER_SOURCE!==undefined) ackSource=success;
      else if(success)success();
    }
  },
  activeTransfer:null,syncBusy:false,
  setTimeout:(callback,ms)=>++timerId,
  clearTimeout:()=>{}
};
vm.createContext(ctx);
vm.runInContext(source.slice(start,end),ctx);
const now=Math.floor(Date.now()/1000);
const today=new Date();
const rise=new Date(today.getFullYear(),today.getMonth(),today.getDate(),6,15).getTime()/1000;
const set=new Date(today.getFullYear(),today.getMonth(),today.getDate(),18,5).getTime()/1000;
const envelope={instances:[{instanceId:'location',properties:{
  sunrise:{timestamp:{value:rise}},
  sunset:{timestamp:{value:set}}
}}]};
const solar=ctx.solarFromEnvelope(envelope);
assert.equal(solar.sunrise,rise);
assert.equal(solar.sunset,set);
assert.equal(ctx.solarFromEnvelope({instances:[]}),null);
assert.equal(ctx.solarFromEnvelope({instances:[{properties:{
  sunrise:{timestamp:{value:rise-86400}},
  sunset:{timestamp:{value:set-86400}}
}}]}),null,'yesterday rejected');
assert.equal(ctx.solarFromEnvelope({instances:[{properties:{
  sunrise:{timestamp:{value:rise}},
  sunset:{timestamp:{value:rise-10}}
}}]}),null,'reversed solar values rejected');
ctx.startWeatherPlugin();
assert.equal(listeners.length,1);
assert.equal(listeners[0].category,'weather');
assert.equal(listeners[0].item,'location');
listeners[0].onData(envelope);
assert.equal(signals.length,1);
assert.equal(signals[0].SUNRISE_TIME,rise);
assert.equal(signals[0].SUNSET_TIME,set);
assert(storage.hybrid_solar_cache);
listeners[0].onData(envelope);
assert.equal(signals.length,1,'identical solar readings not resent');
ctx.restoreSolarTimes();
assert.equal(signals.length,1,'cache restoration avoids duplicate send');
const weatherPlus='7f7b6c10-93e0-4f4c-9237-7e8204c5a121';
const other='1cc11111-aaaa-4444-bbbb-123456789abc';
ctx.Pebble.enumeratePlugins=()=>[
  {uuid:other,name:'Other Weather',sources:[{category:'weather',items:['location']}]},
  {uuid:weatherPlus,name:'Calendar only',sources:[{category:'calendar',items:['event']}]}
];
assert.deepEqual(Array.from(ctx.weatherPluginChoices(),choice=>choice.value),[other]);
storage.agenda_weather_source=weatherPlus;
ctx.configureWeatherSource();
assert.equal(unsubscribed,1);
assert.equal(listeners[1].plugin,weatherPlus);
assert.equal(signals.at(-1).WEATHER_SOURCE,weatherPlus);
assert.equal(signals.length,2,'switch does not replay the old source cache');
listeners[0].onData(envelope);
listeners[1].onData({...envelope,pluginUuid:other});
assert.equal(signals.length,2,'ignore callbacks from old or fallback sources');
listeners[1].onData({...envelope,pluginUuid:weatherPlus});
assert.equal(signals.length,2,'wait for the watch to clear previous source');
ackSource();
assert.equal(signals.at(-1).SUNRISE_TIME,rise);
assert(storage['hybrid_solar_cache:'+weatherPlus]);
storage.agenda_weather_source='none';
ctx.configureWeatherSource();
ackSource();
assert.equal(unsubscribed,2);
assert.equal(listeners.length,2,'No Weather leaves no subscription');
listeners[1].onData({...envelope,pluginUuid:weatherPlus});
assert.equal(signals.length,4);
assert.equal(signals.at(-1).WEATHER_SOURCE,'none');
console.log('Weather solar and source switching regression tests passed');
