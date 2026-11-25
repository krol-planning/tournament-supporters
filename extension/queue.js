(function(root){'use strict';
function status(m,target){const a=m.team1,b=m.team2;if(a.score==null||b.score==null)return 'pending';if(a.score===b.score||a.winnerMark===b.winnerMark)return 'unconfirmed';const w=a.score>b.score?a:b;return w.winnerMark===true&&w.score===target?'finished':'unconfirmed';}
function signature(m){return JSON.stringify([m.number,m.round,m.team1.id,m.team1.name,m.team1.score,m.team2.id,m.team2.name,m.team2.score]);}
function compatible(m,d){return !!m&&!!d&&m.number===d.number&&m.round===d.round&&m.team1.name===d.teams[0]?.name&&m.team2.name===d.teams[1]?.name&&m.team1.score===d.teams[0]?.score&&m.team2.score===d.teams[1]?.score;}
function complete(m,d){if(!compatible(m,d)||d.warnings?.length)return false;const valid=d.battles.filter(b=>!b.invalid);return valid.length===m.team1.score+m.team2.score&&[0,1].every(i=>valid.filter(b=>b.winner===i).length===[m.team1.score,m.team2.score][i]);}
function plan(board,cache,target,failed={},now=Date.now()){const items=[];for(const m of board.matches){if(status(m,target)!=='finished')continue;const sig=signature(m);if(cache[m.number]?.signature===sig)continue;if(failed[m.number]?.signature===sig&&failed[m.number].next>now)continue;items.push(m);}return items;}
function prune(board,cache,target){return Object.fromEntries(Object.entries(cache).filter(([n,v])=>{const m=board.matches.find(x=>x.number===n);return m&&status(m,target)==='finished'&&signature(m)===v.signature&&complete(m,v.detail);}));}
root.SevenQueue={status,signature,compatible,complete,plan,prune};if(typeof module!=='undefined')module.exports=root.SevenQueue;
})(globalThis);
