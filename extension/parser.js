(function(root){
  'use strict';
  const idRe=/^[A-Z]+\d+$/;
  const scoreRe=/^(\d+)\s*[-−–]\s*(\d+)$/;
  const roundRe=/^第\s*(\d+)\s*試合$/;
  const numRe=/^\d{3,}$/;
  const blankRe=/^(?:[-−–—]|未定|未確定|未対戦|未実施|対戦前)$/;
  function parseBoard(raw){
    const lines=String(raw).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const start=lines.indexOf('参加チーム一覧');
    const end=lines.indexOf('勝利試合数が同じ場合の順位の付き方',start+1);
    if(start<0||end<=start) throw Error('対戦表の既知の形式が見つかりません。');
    if(lines.filter(x=>x==='参加チーム一覧').length!==1) throw Error('複数リーグの同時表示には未対応です。');
    const teams=[], matches=[], warnings=[];
    for(let i=start+1;i<end;){
      const id=lines[i], name=lines[i+1], s=lines[i+2]?.match(scoreRe);
      if(!idRe.test(id)||!name||!s) throw Error('順位表の未対応形式: '+id);
      if(teams.some(t=>t.id===id)) throw Error('チームID重複: '+id);
      teams.push({rank:teams.length+1,id,name,wins:+s[1],losses:+s[2]}); i+=3;
    }
    if(!teams.length) throw Error('チームがありません。');
    const map=new Map(teams.map(t=>[t.id,t]));
    let round=0;
    for(let i=end+1;i<lines.length;i++){
      const r=lines[i].match(roundRe); if(r){round=+r[1];continue;}
      if(!round||!numRe.test(lines[i]))continue;
      const number=lines[i]; let j=i+1;
      function read(){const id=lines[j++]; if(!map.has(id))return null;
        let winnerMark=false; while(lines[j]===id){winnerMark=true;j++;}
        if(lines[j++]!==map.get(id).name)return null;
        const s=lines[j]; let score=null;
        if(/^\d+$/.test(s||'')){score=+s;j++;} else if(blankRe.test(s||'')){j++;}
        return {id,name:map.get(id).name,score,winnerMark};
      }
      const a=read(),b=read();
      if(!a||!b||a.id===b.id){warnings.push('試合 '+number+' は読み取り不能');continue;}
      if(matches.some(m=>m.number===number)){warnings.push('試合番号重複: '+number);continue;}
      matches.push({number,round,team1:a,team2:b});i=j-1;
    }
    const titleIdx=lines.indexOf('概要');
    const title=titleIdx>0?lines[titleIdx-1]:'大会';
    if(!matches.length)warnings.push('対戦カードを取得できませんでした。');
    const counts=new Map(teams.map(t=>[t.id,{wins:0,losses:0}]));
    for(const m of matches){const a=m.team1,b=m.team2;if(a.score===null||b.score===null||a.score===b.score||a.winnerMark===b.winnerMark||((a.score>b.score)!==a.winnerMark))continue;
      counts.get(a.score>b.score?a.id:b.id).wins++;counts.get(a.score>b.score?b.id:a.id).losses++;}
    if(teams.some(t=>counts.get(t.id).wins!==t.wins||counts.get(t.id).losses!==t.losses)) warnings.push('順位表と取得スコアの勝敗数が不一致（進行中・未取得の可能性）。');
    return {version:1,title,teams,matches,warnings,capturedAt:new Date().toISOString()};
  }
  root.SevenParser={parseBoard}; if(typeof module!=='undefined')module.exports={parseBoard};
})(globalThis);
