// Control page only. The bridge never sends data to any external server.
if(location.pathname.endsWith('/seven-broadcast/')||location.pathname.endsWith('/seven-broadcast/index.html')){
 window.addEventListener('message',async e=>{if(e.source!==window||e.origin!==location.origin||e.data?.type!=='SEVEN_SOURCES_REQUEST')return;const all=await chrome.storage.local.get(null);const sources=Object.entries(all).filter(([k])=>k.startsWith('sevenSource:')).map(([,v])=>{const {cache,...record}=v;return record;});window.postMessage({type:'SEVEN_SOURCES_REPLY',requestId:e.data.requestId,sources},location.origin);});
}
