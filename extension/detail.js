(function(root){'use strict';
function parseDetail(raw,meta={}){
 const l=String(raw).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);let i=0;const take=()=>l[i++];const fail=m=>{throw Error('詳細リザルト: '+m+'（行 '+i+'）');};const expect=x=>{if(take()!==x)fail(x+' が必要');};const int=()=>{const x=take();if(!/^\d+$/.test(x||''))fail('数値が必要');return +x;};
 const number=take(),r=take()?.match(/^第\s*(\d+)\s*試合$/);if(!/^\d{3,}$/.test(number||'')||!r)fail('試合番号・ラウンドが不明');const name1=take(),score1=int();expect('v');const name2=take(),score2=int();if(!name1||!name2||name1===name2)fail('チーム名が不正');const battles=[];
 const rules=['ガチエリア','ガチヤグラ','ガチホコバトル','ガチホコ','ガチアサリ','ナワバリバトル','ナワバリ'];
 while(i<l.length&&l[i]!=='閉じる'){
  const game=int(),label=take();if(battles.some(b=>b.game===game)||!label)fail('バトル番号・ルールが不正');const rule=rules.find(x=>label.startsWith(x));const stage=rule?label.slice(rule.length).trim():'';
  if(l[i]==='無効試合'){i++;battles.push({game,rule:rule||label,stage,invalid:true});continue;}
  expect('WIN!');const a=take(),b=take();let winner=null,counts=null,knockout=false;const labels=[a,b];
  if([a,b].includes('ノックアウト!')){knockout=true;if(![a,b].some(x=>/^\d+カウント$/.test(x||'')))fail('KOカウント不明');}
  else {const parse=x=>{const m=x?.match(/^(\d+(?:\.\d+)?)(?:カウント|%)$/);if(!m)fail('カウント未対応');return +m[1];};counts=[parse(a),parse(b)];if(counts[0]!==counts[1]&&(rule?.startsWith('ガチ')||labels.every(x=>x.endsWith('%'))))winner=counts[0]>counts[1]?0:1;}
  const readPlayers=name=>{expect(name);const out=[];for(let j=0;j<4;j++){const player=take(),p=take()?.match(/^(\d+)p$/);if(!player||!p)fail('選手・塗りポイント不明');expect('x');const kills=int();let assists=null;const m=l[i]?.match(/^<(\d+)>$/);if(m){assists=+m[1];i++;} // omitted assist notation is treated as zero for observed format
   expect('x');const deaths=int();expect('x');const specials=int();if(assists!==null&&assists>kills)fail('アシスト数がキル表示を超過');out.push({name:player,paint:+p[1],kills,assists:assists??0,deaths,specials});}return out;};
  const players=[readPlayers(name1),readPlayers(name2)];expect('バトルメモリー');expect('通報');const measured=meta.winners?.[game];if(measured===0||measured===1){if(winner!==null&&winner!==measured)fail('座標と数値の勝者が不一致');winner=measured;}battles.push({game,rule:rule||label,stage,invalid:false,winner,counts,labels,knockout,players,inferred:false});
 }
 if(l[i]==='閉じる')i++;if(i!==l.length||!battles.length)fail('末尾またはバトル情報が不正');
 // Assign weapon names only when the whole stage / weapon / SP sequence matches.
 if(Array.isArray(meta.images)){let k=0;const pending=[];let ok=true;for(const b of battles){if(meta.images[k++]!==b.stage){ok=false;break;}if(b.invalid)continue;for(const p of b.players.flat()){const weapon=meta.images[k++],sp=meta.images[k++];if(!weapon||weapon==='スペシャルウェポンはつどうかいすう'||sp!=='スペシャルウェポンはつどうかいすう'){ok=false;break;}pending.push([p,weapon]);}if(!ok)break;}if(ok&&k===meta.images.length)pending.forEach(([p,w])=>p.weapon=w);}
 const valid=battles.filter(b=>!b.invalid), unknown=valid.filter(b=>b.winner===null);const known=[0,1].map(x=>valid.filter(b=>b.winner===x).length);const remaining=[score1-known[0],score2-known[1]];const warnings=[];
 if(valid.length===score1+score2&&remaining.every(x=>x>=0)&&remaining[0]+remaining[1]===unknown.length){if(unknown.length&&(remaining[0]===0||remaining[1]===0)){const w=remaining[0]===0?1:0;unknown.forEach(b=>{b.winner=w;b.inferred=true;});}}else warnings.push('シリーズスコアとバトル結果の整合性を確認できません。');
 if(valid.some(b=>b.winner===null))warnings.push('勝者を確定できないバトルがあります。');
 return {number,round:+r[1],teams:[{name:name1,score:score1},{name:name2,score:score2}],battles,warnings};
}
function aggregate(d){return [0,1].map(side=>{const map=new Map();for(const b of d.battles){if(b.invalid)continue;for(const p of b.players[side]){let a=map.get(p.name);if(!a){a={name:p.name,paint:0,kills:0,assists:0,deaths:0,specials:0,games:0};map.set(p.name,a);}for(const k of ['paint','kills','assists','deaths','specials'])a[k]+=p[k];a.games++;}}return [...map.values()];});}
root.SevenDetail={parseDetail,aggregate};if(typeof module!=='undefined')module.exports=root.SevenDetail;
})(globalThis);
