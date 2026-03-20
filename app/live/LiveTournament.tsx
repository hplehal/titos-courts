"use client";
import { useState, useEffect, useCallback } from "react";

const LOGO = "/titosvl.png";
const POOLS = ["A","B","C","D"];
const RR = [[0,2],[1,3],[0,3],[1,2],[2,3],[0,1]];
const TIMES = ["9:10","9:45","10:20","10:55","11:30","12:05"];
const REFS = [4,3,2,4,1,3];
const DT = {
  A:["Set Me Daddy","Big Juicy Biceps","Tacos and Timbits","Block Obama"],
  B:["Block It Like It's Hot","Lib'idos","Dark Soy Sauce","Linglit"],
  C:["Hakuna Matata","Outlaws","OLLIEB's Fan Club","Spike Wazowski"],
  D:["Block Choy","OTeddies","Block Block","Vito's League"],
};

// Dark broadcast theme
const C = {
  bg: "#0B0E14", bgCard: "#141822", bgCard2: "#1A1F2E",
  surface: "#1E2436", surfaceHover: "#252B3D",
  gold: "#F2A922", goldDk: "#D4920A", goldLt: "#FFD166",
  accent: "#3AAFA9", accentDk: "#2A7C6F",
  white: "#F0F0F0", white60: "rgba(240,240,240,0.6)", white30: "rgba(240,240,240,0.3)",
  white10: "rgba(240,240,240,0.1)", white05: "rgba(240,240,240,0.05)",
  red: "#FF6B6B", green: "#68D391", silver: "#94A3B8",
  pA: { bg: "#D4700A22", bd: "#D4700A", tx: "#F2A922" },
  pB: { bg: "#2A7C6F22", bd: "#3AAFA9", tx: "#3AAFA9" },
  pC: { bg: "#D4920A22", bd: "#F2A922", tx: "#FFD166" },
  pD: { bg: "#5B4EA022", bd: "#7C6BC4", tx: "#A78BFA" },
};
const PT = { A: C.pA, B: C.pB, C: C.pC, D: C.pD };
const ff = "'Bebas Neue', sans-serif";
const fb = "'DM Sans', sans-serif";
const fm = "'JetBrains Mono', monospace";

function useM(bp=700) {
  const [m,s] = useState(false);
  useEffect(() => { const h=()=>s(window.innerWidth<bp); h(); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[bp]);
  return m;
}

function initS(){const s={};POOLS.forEach(p=>{s[p]=RR.map(m=>({t1:m[0],t2:m[1],sets:[{s1:"",s2:""},{s1:"",s2:""}]}))});return s}

function calc(pool,teams,scores){
  const ps=scores[pool]||[];const st=teams.map((n,i)=>({idx:i,name:n,sW:0,sL:0,pd:0,w:0}));
  ps.forEach(g=>{g.sets.forEach(s=>{const a=parseInt(s.s1)||0,b=parseInt(s.s2)||0;if(!a&&!b)return;st[g.t1].pd+=a-b;st[g.t2].pd+=b-a;if(a>b){st[g.t1].sW++;st[g.t2].sL++}else if(b>a){st[g.t2].sW++;st[g.t1].sL++}});
    const a=g.sets.reduce((x,s)=>x+(parseInt(s.s1)||0),0),b=g.sets.reduce((x,s)=>x+(parseInt(s.s2)||0),0);if(a>b)st[g.t1].w++;else if(b>a)st[g.t2].w++});
  st.sort((a,b)=>b.sW-a.sW||a.sL-b.sL||b.pd-a.pd);return st}

function PoolPill({pool, active, onClick}) {
  const pc = PT[pool];
  return <button onClick={onClick} style={{
    padding:"6px 16px",border:`1.5px solid ${active?pc.bd:C.white10}`,borderRadius:8,
    fontFamily:ff,fontSize:15,letterSpacing:2,cursor:"pointer",transition:"all 0.2s",
    background:active?pc.bg:"transparent",color:active?pc.tx:C.white60,
  }}>POOL {pool}</button>;
}

// ── Standings Table ──
function StandingsTable({pool, teams, scores}) {
  const st = calc(pool, teams[pool], scores);
  const pc = PT[pool];
  return (
    <div style={{background:C.bgCard,borderRadius:12,border:`1px solid ${pc.bd}33`,overflow:"hidden"}}>
      <div style={{background:`${pc.bd}15`,padding:"10px 16px",borderBottom:`1px solid ${pc.bd}33`,display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:4,height:20,borderRadius:2,background:pc.bd}}/>
        <span style={{fontFamily:ff,fontSize:18,letterSpacing:2,color:pc.tx}}>POOL {pool}</span>
        <span style={{marginLeft:"auto",fontSize:11,color:C.white30,fontFamily:fb}}>Court {POOLS.indexOf(pool)+1}</span>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",fontFamily:fb,fontSize:13}}>
        <thead><tr>{["#","TEAM","SW","SL","+/-"].map(h=>(
          <th key={h} style={{padding:"8px 10px",textAlign:h==="TEAM"?"left":"center",fontSize:10,fontWeight:700,color:C.white30,fontFamily:ff,letterSpacing:1,borderBottom:`1px solid ${C.white05}`}}>{h}</th>
        ))}</tr></thead>
        <tbody>{st.map((s,i)=>(
          <tr key={s.idx} style={{borderBottom:`1px solid ${C.white05}`,background:i===0?`${C.gold}08`:i===1?`${C.gold}08`:`${C.silver}05`}}>
            <td style={{padding:"10px",textAlign:"center",fontWeight:800,fontFamily:fm,fontSize:14,color:i<2?C.gold:C.silver}}>
              {i===0?"\u{1F947}":i===1?"\u{1F947}":"\u{1F948}"}
            </td>
            <td style={{padding:"10px",fontWeight:600,color:i<2?C.gold:C.silver,fontSize:13}}>{s.name}</td>
            <td style={{padding:"10px",textAlign:"center",fontFamily:fm,fontWeight:700,color:C.green}}>{s.sW}</td>
            <td style={{padding:"10px",textAlign:"center",fontFamily:fm,fontWeight:700,color:C.red}}>{s.sL}</td>
            <td style={{padding:"10px",textAlign:"center",fontFamily:fm,fontWeight:700,color:s.pd>0?C.green:s.pd<0?C.red:C.white30}}>{s.pd>0?"+":""}{s.pd}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ── Schedule View ──
function ScheduleCard({pool, game, gi, teams}) {
  const pc = PT[pool];
  const t1 = game.t1, t2 = game.t2;
  const has = game.sets.some(s=>s.s1!==""||s.s2!=="");

  // Per-set scores
  const setScores = game.sets.map(s=>({a:parseInt(s.s1)||0,b:parseInt(s.s2)||0,played:s.s1!==""||s.s2!==""})).filter(s=>s.played);

  // Sets won
  const t1Sets = setScores.filter(s=>s.a>s.b).length;
  const t2Sets = setScores.filter(s=>s.b>s.a).length;

  // Total points
  const t1Pts = setScores.reduce((x,s)=>x+s.a,0);
  const t2Pts = setScores.reduce((x,s)=>x+s.b,0);
  const ptDiff = t1Pts - t2Pts;

  // Game is FINAL when both sets have been played (pool play = 2 sets, no tiebreaker)
  const allSetsPlayed = setScores.length >= 2;
  const done = has && allSetsPlayed;
  const isDraw = done && t1Sets === t2Sets;
  const t1Win = !isDraw && t1Sets > t2Sets;
  const t2Win = !isDraw && t2Sets > t1Sets;

  const rows = [
    {name:teams[pool][t1],seed:`${pool}${t1+1}`,setsWon:t1Sets,setScores:setScores.map(s=>s.a),win:done&&t1Win,draw:isDraw,pts:t1Pts},
    {name:teams[pool][t2],seed:`${pool}${t2+1}`,setsWon:t2Sets,setScores:setScores.map(s=>s.b),win:done&&t2Win,draw:isDraw,pts:t2Pts},
  ];

  return (
    <div style={{background:C.bgCard,borderRadius:12,border:`1px solid ${C.white05}`,overflow:"hidden",marginBottom:8}}>
      {/* Header bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",background:C.white05}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontFamily:fm,fontSize:11,color:C.white30}}>{TIMES[gi]}</span>
          <span style={{fontFamily:ff,fontSize:11,letterSpacing:1,color:pc.tx}}>COURT {POOLS.indexOf(pool)+1}</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {done && !isDraw && <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:4,background:`${C.green}20`,color:C.green,fontFamily:fb}}>FINAL</span>}
          {done && isDraw && <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:4,background:`${C.gold}20`,color:C.gold,fontFamily:fb}}>DRAW</span>}
          {has && !done && <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:4,background:`${C.red}20`,color:C.red,fontFamily:fb,animation:"pulse 2s infinite"}}>LIVE</span>}
          <span style={{fontSize:10,color:C.white30,fontFamily:fb}}>Ref: <span style={{color:C.white60,fontWeight:600}}>{teams[pool][REFS[gi]-1]}</span></span>
        </div>
      </div>

      {/* Team rows */}
      {rows.map((tm,i)=>(
        <div key={i} style={{
          display:"flex",alignItems:"center",padding:"12px 14px",
          borderBottom:i===0?`1px solid ${C.white05}`:"none",
          background:tm.win?`${C.green}06`:tm.draw?`${C.gold}06`:"transparent",
        }}>
          {/* Seed badge */}
          <span style={{fontFamily:fm,fontSize:10,color:pc.tx,fontWeight:700,width:26,flexShrink:0}}>{tm.seed}</span>

          {/* Team name */}
          <span style={{flex:1,fontSize:14,fontWeight:tm.win||tm.draw?700:400,color:tm.win?C.white:tm.draw?C.goldLt:`${C.white}99`,fontFamily:fb}}>
            {tm.name}
          </span>

          {/* Individual set scores */}
          {has && <div style={{display:"flex",gap:10,marginRight:16,flexShrink:0}}>
            {tm.setScores.map((sc,si)=>{
              const won = rows[0].setScores[si] !== undefined && (i===0 ? sc > rows[1].setScores[si] : sc > rows[0].setScores[si]);
              return <span key={si} style={{fontFamily:fm,fontSize:13,fontWeight:won?700:400,color:won?C.white:C.white30,minWidth:18,textAlign:"right"}}>{sc}</span>;
            })}
          </div>}

          {/* Sets won - big bold number */}
          {has && <span style={{
            fontFamily:ff,fontSize:22,fontWeight:400,letterSpacing:1,
            color:tm.win?C.white:tm.draw?C.gold:C.white30,
            minWidth:28,textAlign:"right",flexShrink:0,
          }}>{tm.setsWon}</span>}
        </div>
      ))}

      {/* Point difference bar */}
      {has && (
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"6px 14px",background:C.white05,gap:12}}>
          <span style={{fontSize:10,color:C.white30,fontFamily:fb}}>Point Diff</span>
          <span style={{fontFamily:fm,fontSize:12,fontWeight:700,color:ptDiff>0?C.green:ptDiff<0?C.red:C.white30}}>
            {rows[0].name}: {ptDiff>0?"+":""}{ptDiff}
          </span>
          <span style={{color:C.white10}}>|</span>
          <span style={{fontFamily:fm,fontSize:12,fontWeight:700,color:ptDiff<0?C.green:ptDiff>0?C.red:C.white30}}>
            {rows[1].name}: {-ptDiff>0?"+":""}{-ptDiff}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Bracket Match Card ──
function BracketMatch({match, ps, W, isGold, isFinal, mobile}) {
  const m = ps[match.id];
  const winner = W(match.id);
  const accent = isGold ? C.gold : C.silver;
  const bgColor = isGold ? `${C.gold}08` : `${C.silver}08`;
  const bdColor = isGold ? `${C.gold}33` : `${C.silver}33`;

  return (
    <div style={{
      background: isFinal ? `linear-gradient(135deg,${C.bgCard},${bgColor})` : C.bgCard,
      borderRadius: 10, border: `1.5px solid ${isFinal ? accent : bdColor}`,
      overflow: "hidden", width: mobile ? "100%" : 240,
      boxShadow: isFinal ? `0 0 20px ${accent}15` : "none",
    }}>
      {/* Header: match label + time */}
      <div style={{
        padding: "6px 10px", background: `${accent}15`,
        borderBottom: `1px solid ${accent}22`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{fontFamily:ff,fontSize:11,letterSpacing:1,color:accent}}>
          {isFinal ? "\u{1F3C6} " : ""}{match.l}
        </span>
        <span style={{fontSize:9,color:C.white30,fontFamily:fb}}>{match.tm}</span>
      </div>

      {/* Court + Ref info bar */}
      <div style={{
        display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"4px 10px",background:C.white05,borderBottom:`1px solid ${C.white05}`,
      }}>
        <span style={{fontSize:10,fontFamily:fm,color:C.white30}}>
          {"\u{1F3DF}\uFE0F"} Court {match.ct}
        </span>
        {match.ref && <span style={{fontSize:10,fontFamily:fb,color:C.white30}}>
          Ref: <span style={{color:C.white60,fontWeight:600}}>{match.ref}</span>
        </span>}
        {!match.ref && isFinal && <span style={{fontSize:10,fontFamily:fb,color:C.white30,fontStyle:"italic"}}>
          Certified Ref
        </span>}
      </div>

      {/* Team rows */}
      {[match.t1, match.t2].map((team, ti) => {
        const isW = winner === team;
        const sets = m?.sets || [];
        const setsWon = sets.filter(s => {
          const a=parseInt(s.s1)||0, b=parseInt(s.s2)||0;
          if(!a&&!b) return false;
          return ti===0 ? a>b : b>a;
        }).length;
        const hasScores = sets.some(s=>s.s1!==""||s.s2!=="");

        return (
          <div key={ti} style={{
            display:"flex",alignItems:"center",padding:"8px 10px",
            borderBottom: ti===0 ? `1px solid ${C.white05}` : "none",
            background: isW ? `${C.green}10` : "transparent",
          }}>
            <span style={{
              flex:1,fontSize:12,fontWeight:isW?700:400,
              color:isW?C.white:team.startsWith("W ")||team.startsWith("L ")? C.white30:C.white60,
              fontFamily:team.startsWith("W ")||team.startsWith("L ")?fm:fb,
              fontStyle:team.startsWith("W ")||team.startsWith("L ")?"italic":"normal",
            }}>
              {isW && "\u2713 "}{team}
            </span>
            {hasScores && <span style={{
              fontFamily:fm,fontSize:13,fontWeight:800,
              color:isW?C.green:C.white30,minWidth:20,textAlign:"right",
            }}>{setsWon}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Visual Bracket ──
function Bracket({teams, scores, ps, mobile, division}) {
  const aS = {};
  POOLS.forEach(p => { aS[p] = calc(p, teams[p], scores); });
  const sd = (p,r) => aS[p]?.[r]?.name || `${p}${r+1}`;
  const isGold = division === "gold";

  const W = id => {
    const m = ps[id]; if(!m) return null;
    let a=0,b=0;
    m.sets.forEach(s=>{const x=parseInt(s.s1)||0,y=parseInt(s.s2)||0;if(x>y)a++;else if(y>x)b++});
    return a>b?m.t1:b>a?m.t2:null;
  };
  const L = id => {
    const m = ps[id]; if(!m) return null;
    const w = W(id); if(!w) return null;
    return w===m.t1?m.t2:m.t1;
  };

  let qfs, sfs, final;
  if (isGold) {
    qfs = [
      {id:"QF1",l:"QF1",t1:sd("A",0),t2:sd("B",1),ct:1,tm:"1:00 PM",ref:sd("A",1)},
      {id:"QF2",l:"QF2",t1:sd("C",0),t2:sd("D",1),ct:2,tm:"1:00 PM",ref:sd("C",1)},
      {id:"QF5",l:"QF5",t1:sd("A",1),t2:sd("B",0),ct:1,tm:"1:45 PM",ref:L("QF1")||"L QF1"},
      {id:"QF6",l:"QF6",t1:sd("C",1),t2:sd("D",0),ct:2,tm:"1:45 PM",ref:L("QF2")||"L QF2"},
    ];
    sfs = [
      {id:"GS1",l:"SEMI 1",t1:W("QF1")||"W QF1",t2:W("QF2")||"W QF2",ct:1,tm:"2:30 PM",ref:L("QF5")||"L QF5"},
      {id:"GS2",l:"SEMI 2",t1:W("QF5")||"W QF5",t2:W("QF6")||"W QF6",ct:2,tm:"2:30 PM",ref:L("QF6")||"L QF6"},
    ];
    final = {id:"GF",l:"GOLD FINAL",t1:W("GS1")||"W S1",t2:W("GS2")||"W S2",ct:1,tm:"3:15 PM",ref:null};
  } else {
    qfs = [
      {id:"QF3",l:"QF3",t1:sd("A",2),t2:sd("B",3),ct:3,tm:"1:00 PM",ref:sd("A",3)},
      {id:"QF4",l:"QF4",t1:sd("C",2),t2:sd("D",3),ct:4,tm:"1:00 PM",ref:sd("C",3)},
      {id:"QF7",l:"QF7",t1:sd("A",3),t2:sd("B",2),ct:3,tm:"1:45 PM",ref:L("QF3")||"L QF3"},
      {id:"QF8",l:"QF8",t1:sd("C",3),t2:sd("D",2),ct:4,tm:"1:45 PM",ref:L("QF4")||"L QF4"},
    ];
    sfs = [
      {id:"SS1",l:"SEMI 3",t1:W("QF3")||"W QF3",t2:W("QF4")||"W QF4",ct:3,tm:"2:30 PM",ref:L("QF7")||"L QF7"},
      {id:"SS2",l:"SEMI 4",t1:W("QF7")||"W QF7",t2:W("QF8")||"W QF8",ct:4,tm:"2:30 PM",ref:L("QF8")||"L QF8"},
    ];
    final = {id:"SF",l:"SILVER FINAL",t1:W("SS1")||"W S3",t2:W("SS2")||"W S4",ct:3,tm:"3:15 PM",ref:null};
  }

  const accent = isGold ? C.gold : C.silver;

  if (mobile) {
    return (
      <div>
        <div style={{fontFamily:ff,fontSize:16,letterSpacing:2,color:accent,borderBottom:`2px solid ${accent}33`,paddingBottom:6,marginBottom:12}}>
          {isGold ? "\u{1F947} GOLD" : "\u{1F948} SILVER"} DIVISION
        </div>
        <div style={{fontSize:11,color:C.white30,fontFamily:ff,letterSpacing:1,marginBottom:6}}>QUARTER FINALS</div>
        {qfs.map(m=><div key={m.id} style={{marginBottom:6}}><BracketMatch match={m} ps={ps} W={W} isGold={isGold} mobile/></div>)}
        <div style={{fontSize:11,color:C.white30,fontFamily:ff,letterSpacing:1,marginBottom:6,marginTop:12}}>SEMI FINALS</div>
        {sfs.map(m=><div key={m.id} style={{marginBottom:6}}><BracketMatch match={m} ps={ps} W={W} isGold={isGold} mobile/></div>)}
        <div style={{fontSize:11,color:C.white30,fontFamily:ff,letterSpacing:1,marginBottom:6,marginTop:12}}>FINAL</div>
        <BracketMatch match={final} ps={ps} W={W} isGold={isGold} isFinal mobile/>
      </div>
    );
  }

  // Desktop: visual bracket with lines
  return (
    <div>
      <div style={{fontFamily:ff,fontSize:18,letterSpacing:3,color:accent,textAlign:"center",marginBottom:16}}>
        {isGold ? "\u{1F947} GOLD" : "\u{1F948} SILVER"} DIVISION
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,position:"relative"}}>
        {/* QF Column */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <BracketMatch match={qfs[0]} ps={ps} W={W} isGold={isGold}/>
          <BracketMatch match={qfs[1]} ps={ps} W={W} isGold={isGold}/>
          <div style={{height:24}}/>
          <BracketMatch match={qfs[2]} ps={ps} W={W} isGold={isGold}/>
          <BracketMatch match={qfs[3]} ps={ps} W={W} isGold={isGold}/>
        </div>

        {/* Connector lines QF -> SF */}
        <svg width="40" height="340" style={{flexShrink:0}}>
          <line x1="0" y1="45" x2="40" y2="75" stroke={`${accent}44`} strokeWidth="1.5"/>
          <line x1="0" y1="115" x2="40" y2="75" stroke={`${accent}44`} strokeWidth="1.5"/>
          <line x1="0" y1="235" x2="40" y2="265" stroke={`${accent}44`} strokeWidth="1.5"/>
          <line x1="0" y1="305" x2="40" y2="265" stroke={`${accent}44`} strokeWidth="1.5"/>
        </svg>

        {/* SF Column */}
        <div style={{display:"flex",flexDirection:"column",gap:12,justifyContent:"center"}}>
          <BracketMatch match={sfs[0]} ps={ps} W={W} isGold={isGold}/>
          <div style={{height:100}}/>
          <BracketMatch match={sfs[1]} ps={ps} W={W} isGold={isGold}/>
        </div>

        {/* Connector lines SF -> Final */}
        <svg width="40" height="340" style={{flexShrink:0}}>
          <line x1="0" y1="75" x2="40" y2="170" stroke={`${accent}44`} strokeWidth="1.5"/>
          <line x1="0" y1="265" x2="40" y2="170" stroke={`${accent}44`} strokeWidth="1.5"/>
        </svg>

        {/* Final */}
        <div style={{display:"flex",flexDirection:"column",justifyContent:"center"}}>
          <BracketMatch match={final} ps={ps} W={W} isGold={isGold} isFinal/>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──
export default function LiveTournament() {
  const mobile = useM();
  const [teams, setTeams] = useState(DT);
  const [scores, setScores] = useState(initS());
  const [ps, setPS] = useState({});
  const [started, setStarted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [tab, setTab] = useState("standings");
  const [activePool, setActivePool] = useState("A");
  const [bracketDiv, setBracketDiv] = useState("gold");

  const fetchData = useCallback(() => {
    fetch("/api/tournament")
      .then(r=>r.json())
      .then(data=>{
        if(data.teams)setTeams(data.teams);
        if(data.scores)setScores(data.scores);
        if(data.playoffScores)setPS(data.playoffScores);
        if(data.started)setStarted(true);
        setLoaded(true);
        setLastUpdate(new Date());
      })
      .catch(()=>setLoaded(true));
  }, []);

  // Initial load + auto-refresh every 15s
  useEffect(() => { fetchData(); const i=setInterval(fetchData,15000); return()=>clearInterval(i); }, [fetchData]);

  if (!loaded) return (
    <div style={{fontFamily:fb,background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>{"\u{1F3D0}"}</div>
        <div style={{fontFamily:ff,fontSize:20,letterSpacing:3,color:C.gold}}>LOADING...</div>
      </div>
    </div>
  );

  const tabs = [
    {id:"standings",icon:"\u{1F4CA}",label:"Standings"},
    {id:"schedule",icon:"\u{1F3D0}",label:"Schedule"},
    {id:"bracket",icon:"\u{1F3C6}",label:"Bracket"},
  ];

  return (
    <div style={{fontFamily:fb,background:C.bg,minHeight:"100vh",color:C.white}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700;800&display=swap');
      *{box-sizing:border-box;margin:0}body{margin:0}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>

      {/* Header */}
      <div style={{
        background:`linear-gradient(180deg,${C.bgCard} 0%,${C.bg} 100%)`,
        padding:mobile?"16px 12px":"20px 24px",textAlign:"center",
        borderBottom:`1px solid ${C.white05}`,position:"relative",
      }}>
        <div style={{position:"absolute",inset:0,opacity:0.03,
          backgroundImage:`radial-gradient(circle,${C.gold} 1px,transparent 1px)`,backgroundSize:"24px 24px"}}/>
        <div style={{position:"relative"}}>
          <img src={LOGO} alt="Tito's Volleyball League" style={{height:mobile?50:70,marginBottom:4,filter:"drop-shadow(0 2px 12px rgba(242,169,34,0.3))"}}/>
          <div style={{fontFamily:ff,fontSize:mobile?12:14,letterSpacing:3,color:C.gold,marginTop:2}}>
            MARCH 21, 2026 {"\u2022"} LIVE SCORES
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:6}}>
            <div style={{width:6,height:6,borderRadius:3,background:C.green,animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:10,color:C.white30,fontFamily:fm}}>
              Auto-refresh {lastUpdate ? `\u2022 ${lastUpdate.toLocaleTimeString()}` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{
        display:"flex",borderBottom:`1px solid ${C.white05}`,background:C.bgCard,
        position:"sticky",top:0,zIndex:10,
      }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1,padding:mobile?"10px 4px":"12px 16px",border:"none",cursor:"pointer",
            borderBottom:tab===t.id?`2px solid ${C.gold}`:"2px solid transparent",
            background:tab===t.id?`${C.gold}08`:"transparent",
            color:tab===t.id?C.gold:C.white30,
            fontFamily:fb,fontWeight:tab===t.id?700:500,fontSize:mobile?10:13,
            display:"flex",flexDirection:mobile?"column":"row",alignItems:"center",justifyContent:"center",gap:mobile?2:8,
            transition:"all 0.2s",
          }}>
            <span style={{fontSize:mobile?18:16}}>{t.icon}</span>
            <span style={{letterSpacing:"0.03em"}}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:mobile?12:24}}>

        {/* ── Standings Tab ── */}
        {tab==="standings" && (
          <div>
            {mobile && (
              <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:16}}>
                {POOLS.map(p=><PoolPill key={p} pool={p} active={activePool===p} onClick={()=>setActivePool(p)}/>)}
              </div>
            )}
            {mobile ? (
              <StandingsTable pool={activePool} teams={teams} scores={scores}/>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {POOLS.map(p=><StandingsTable key={p} pool={p} teams={teams} scores={scores}/>)}
              </div>
            )}
          </div>
        )}

        {/* ── Schedule Tab ── */}
        {tab==="schedule" && (
          <div>
            <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:16}}>
              {POOLS.map(p=><PoolPill key={p} pool={p} active={activePool===p} onClick={()=>setActivePool(p)}/>)}
            </div>
            <div style={{maxWidth:500,margin:"0 auto"}}>
              {scores[activePool]?.map((g,gi)=>(
                <ScheduleCard key={gi} pool={activePool} game={g} gi={gi} teams={teams}/>
              ))}
            </div>
          </div>
        )}

        {/* ── Bracket Tab ── */}
        {tab==="bracket" && (
          <div>
            {/* Division toggle */}
            <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:24}}>
              {["gold","silver"].map(d=>(
                <button key={d} onClick={()=>setBracketDiv(d)} style={{
                  padding:"8px 24px",borderRadius:8,cursor:"pointer",
                  fontFamily:ff,fontSize:15,letterSpacing:2,
                  border:`1.5px solid ${bracketDiv===d?(d==="gold"?C.gold:C.silver):C.white10}`,
                  background:bracketDiv===d?(d==="gold"?`${C.gold}15`:`${C.silver}15`):"transparent",
                  color:bracketDiv===d?(d==="gold"?C.gold:C.silver):C.white30,
                  transition:"all 0.2s",
                }}>
                  {d==="gold"?"\u{1F947} GOLD":"\u{1F948} SILVER"}
                </button>
              ))}
            </div>
            <Bracket teams={teams} scores={scores} ps={ps} mobile={mobile} division={bracketDiv}/>

            {/* Awards */}
            <div style={{
              marginTop:32,padding:16,background:`linear-gradient(135deg,${C.bgCard},${C.surface})`,
              borderRadius:12,textAlign:"center",border:`1px solid ${C.gold}22`,
            }}>
              <span style={{fontFamily:ff,fontSize:mobile?14:18,letterSpacing:3,color:C.gold}}>
                {"\u{1F3C6}"} 4:00 - 5:00 PM {"\u2014"} AWARDS + CLEAN UP
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{textAlign:"center",padding:"24px 16px 32px",borderTop:`1px solid ${C.white05}`,marginTop:40}}>
        <div style={{fontSize:11,color:C.white30,fontFamily:fb}}>
          Vaughan Sportsplex {"\u2022"} 8301 Keele St, Concord, ON
        </div>
        <div style={{fontSize:10,color:C.white10,fontFamily:fb,marginTop:4}}>
          Tito's Volleyball League {"\u2022"} COED 4:2
        </div>
      </div>
    </div>
  );
}