"use client";
import { useState, useEffect, useRef } from "react";

const LOGO = "/titosvl.png";

const TIMES = ["9:10","9:45","10:20","10:55","11:30","12:05"];
const REFS = [4,3,2,4,1,3];
const POOLS = ["A","B","C","D"];
const RR = [[0,2],[1,3],[0,3],[1,2],[2,3],[0,1]];
const DT = {
  A:["Set Me Daddy","Big Juicy Biceps","Tacos and Timbits","Block Obama"],
  B:["Block It Like It\'s Hot","Lib\'idos","Dark Soy Sauce","Linglit"],
  C:["Hakuna Matata","Outlaws","OLLIEB\'s Fan Club","Spike Wazowski"],
  D:["Block Choy","OTeddies","Block Block","Vito\'s League"],
};

const T = {
  bg:"#FFFDF7",srf:"#FFFFFF",alt:"#FFF9EE",
  gold:"#F2A922",gDk:"#D4920A",gLt:"#FFD166",gBg:"#FFF8E1",gBd:"#F2A922",
  ch:"#333333",chL:"#555",chD:"#1A1A1A",
  acc:"#2A7C6F",accL:"#3AAFA9",
  mut:"#9E9484",bdr:"#EDE5D5",
  sil:"#6B7B8D",sBg:"#F0F3F6",sBd:"#B0BCC8",
  pA:{bg:"#FFF4ED",b:"#E8875C",h:"#D4700A",t:"#8B3E14"},
  pB:{bg:"#EEFAF7",b:"#3AAFA9",h:"#2A7C6F",t:"#145048"},
  pC:{bg:"#FFF7E6",b:"#F2A922",h:"#D4920A",t:"#7A5A10"},
  pD:{bg:"#F2F0FF",b:"#7C6BC4",h:"#5B4EA0",t:"#3D3470"},
};
const PT={A:T.pA,B:T.pB,C:T.pC,D:T.pD};
const ff="'Archivo Black',sans-serif";
const fb="'DM Sans',sans-serif";
const fm="'JetBrains Mono',monospace";

function useM(bp=640){
  const[m,s]=useState(false);
  useEffect(()=>{
    const h=()=>s(window.innerWidth<bp);
    h();
    window.addEventListener("resize",h);
    return()=>window.removeEventListener("resize",h);
  },[bp]);
  return m;
}

function initS(){const s={};POOLS.forEach(p=>{s[p]=RR.map(m=>({t1:m[0],t2:m[1],sets:[{s1:"",s2:""},{s1:"",s2:""}]}))});return s}

function calc(pool,teams,scores){
  const ps=scores[pool]||[];const st=teams.map((n,i)=>({idx:i,name:n,sW:0,sL:0,pd:0,w:0}));
  ps.forEach(g=>{g.sets.forEach(s=>{const a=parseInt(s.s1)||0,b=parseInt(s.s2)||0;if(!a&&!b)return;st[g.t1].pd+=a-b;st[g.t2].pd+=b-a;if(a>b){st[g.t1].sW++;st[g.t2].sL++}else if(b>a){st[g.t2].sW++;st[g.t1].sL++}});
    const a=g.sets.reduce((x,s)=>x+(parseInt(s.s1)||0),0),b=g.sets.reduce((x,s)=>x+(parseInt(s.s2)||0),0);if(a>b)st[g.t1].w++;else if(b>a)st[g.t2].w++});
  st.sort((a,b)=>b.sW-a.sW||a.sL-b.sL||b.pd-a.pd);return st}

function Pills({sel,onChange,mobile}){return(<div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:16}}>{POOLS.map(p=>{const a=sel===p,pc=PT[p];return(<button key={p} onClick={()=>onChange(p)} style={{padding:mobile?"8px 14px":"8px 20px",border:`2px solid ${pc.b}`,borderRadius:10,fontFamily:ff,fontSize:14,letterSpacing:1,cursor:"pointer",transition:"all 0.2s",background:a?pc.h:pc.bg,color:a?"#fff":pc.t,boxShadow:a?`0 2px 8px ${pc.b}66`:"none",transform:a?"scale(1.05)":"scale(1)"}}>POOL {p}</button>)})}</div>)}

function SB({value,onChange,size="normal"}){
  const w=size==="small"?42:50,h=size==="small"?36:44,fs=size==="small"?15:18;
  return(<input type="number" inputMode="numeric" pattern="[0-9]*" min="0" max="99" value={value} onChange={e=>onChange(e.target.value)} placeholder="-" style={{width:w,height:h,textAlign:"center",border:`2px solid ${T.bdr}`,borderRadius:10,fontSize:fs,fontWeight:800,fontFamily:fm,outline:"none",background:T.srf,color:T.ch,transition:"border 0.2s,box-shadow 0.2s"}}
    onFocus={e=>{e.target.style.borderColor=T.gold;e.target.style.boxShadow=`0 0 0 3px ${T.gold}33`;e.target.select()}}
    onBlur={e=>{e.target.style.borderColor=T.bdr;e.target.style.boxShadow="none"}}/>)}

function NTab({label,icon,active,onClick,mobile}){return(<button onClick={onClick} style={{padding:mobile?"10px 4px":"12px 20px",border:"none",flex:mobile?1:"unset",borderBottom:active?`3px solid ${T.gold}`:"3px solid transparent",background:active?`${T.gold}12`:"transparent",color:active?T.gDk:T.mut,fontFamily:fb,fontWeight:active?700:500,fontSize:mobile?10:14,cursor:"pointer",transition:"all 0.2s",display:"flex",flexDirection:mobile?"column":"row",alignItems:"center",gap:mobile?2:8,justifyContent:"center"}}><span style={{fontSize:mobile?20:18}}>{icon}</span><span style={{letterSpacing:"0.02em"}}>{label}</span></button>)}

function SH({children,sub,mobile}){return(<div style={{textAlign:"center",marginBottom:mobile?12:20}}><h2 style={{fontFamily:ff,fontSize:mobile?20:28,letterSpacing:2,color:T.ch,margin:0,textTransform:"uppercase"}}>{children}</h2>{sub&&<p style={{color:T.mut,fontSize:12,fontFamily:fb,margin:"4px 0 0"}}>{sub}</p>}</div>)}

function Setup({teams,setTeams,onStart,mobile}){return(<div style={{padding:mobile?16:24}}>
  <SH sub="Enter your teams. Everything auto-generates." mobile={mobile}>Team Roster</SH>
  <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:mobile?12:16,maxWidth:800,margin:"0 auto"}}>
    {POOLS.map(pool=>{const pc=PT[pool];return(<div key={pool} style={{background:T.srf,borderRadius:14,border:`2px solid ${pc.b}`,overflow:"hidden",boxShadow:`0 2px 12px ${pc.b}15`}}>
      <div style={{background:pc.h,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontFamily:ff,fontSize:16,color:"#fff",letterSpacing:1}}>POOL {pool}</span>
        <span style={{marginLeft:"auto",fontSize:11,color:"rgba(255,255,255,0.7)",fontFamily:fb}}>Court {POOLS.indexOf(pool)+1}</span>
      </div>
      <div style={{padding:12}}>{[0,1,2,3].map(i=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontFamily:fm,fontSize:11,fontWeight:700,color:pc.t,width:24,textAlign:"center",background:pc.bg,borderRadius:4,padding:"2px 0"}}>{pool}{i+1}</span>
        <input value={teams[pool][i]} onChange={e=>{const n={...teams};n[pool]=[...n[pool]];n[pool][i]=e.target.value;setTeams(n)}}
          style={{flex:1,padding:"10px 12px",border:`2px solid ${T.bdr}`,borderRadius:8,fontSize:14,fontFamily:fb,background:T.alt,color:T.ch,outline:"none"}}
          onFocus={e=>{e.target.style.borderColor=pc.b}} onBlur={e=>{e.target.style.borderColor=T.bdr}} placeholder={`Team ${i+1}`}/>
      </div>))}</div>
    </div>)})}
  </div>
  <div style={{textAlign:"center",marginTop:mobile?20:32}}>
    <button onClick={onStart} style={{padding:"16px 48px",background:`linear-gradient(135deg,${T.gDk},${T.gold})`,color:"#fff",border:"none",borderRadius:12,fontFamily:ff,fontSize:16,letterSpacing:2,cursor:"pointer",width:mobile?"100%":"auto",boxShadow:`0 4px 16px ${T.gold}44`}}>GENERATE SCHEDULE</button>
  </div>
</div>)}

function GCard({pool,game,gi,teams,upd}){
  const pc=PT[pool],t1=game.t1,t2=game.t2;
  const has=game.sets.some(s=>s.s1!==""||s.s2!=="");
  const a=game.sets.reduce((x,s)=>x+(parseInt(s.s1)||0),0),b=game.sets.reduce((x,s)=>x+(parseInt(s.s2)||0),0);
  const st=!has?"":a!==b?"FINAL":"LIVE";
  return(<div style={{background:T.srf,borderRadius:14,border:`2px solid ${pc.b}`,overflow:"hidden",marginBottom:10,boxShadow:`0 2px 8px ${pc.b}12`}}>
    <div style={{background:`linear-gradient(135deg,${pc.h},${pc.h}DD)`,color:"#fff",padding:"8px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:fb,fontSize:13,fontWeight:600}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontFamily:fm,fontSize:13}}>{TIMES[gi]}</span><span style={{opacity:0.7,fontSize:11}}>Ref {REFS[gi]}</span></div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        {st&&<span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,fontFamily:fb,background:st==="FINAL"?"rgba(56,161,105,0.25)":"rgba(255,80,80,0.25)",color:st==="FINAL"?"#c6f6d5":"#fed7d7"}}>{st}</span>}
        <span style={{fontFamily:ff,letterSpacing:1,fontSize:12}}>CT {POOLS.indexOf(pool)+1}</span>
      </div>
    </div>
    <div style={{padding:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <div style={{textAlign:"center",flex:1}}><div style={{display:"inline-block",padding:"1px 6px",borderRadius:4,background:pc.bg,fontSize:10,fontWeight:700,color:pc.t,fontFamily:fm,marginBottom:3}}>{pool}{t1+1}</div><div style={{fontSize:14,fontWeight:700,color:T.ch}}>{teams[pool][t1]}</div></div>
        <div style={{alignSelf:"center",fontFamily:ff,fontSize:14,color:T.mut,padding:"0 6px"}}>VS</div>
        <div style={{textAlign:"center",flex:1}}><div style={{display:"inline-block",padding:"1px 6px",borderRadius:4,background:pc.bg,fontSize:10,fontWeight:700,color:pc.t,fontFamily:fm,marginBottom:3}}>{pool}{t2+1}</div><div style={{fontSize:14,fontWeight:700,color:T.ch}}>{teams[pool][t2]}</div></div>
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:20,background:pc.bg,borderRadius:12,padding:"12px 10px"}}>
        {[0,1].map(si=>(<div key={si} style={{textAlign:"center"}}><div style={{fontSize:10,fontWeight:800,color:pc.t,marginBottom:6,fontFamily:ff,letterSpacing:1}}>SET {si+1}</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><SB value={game.sets[si]?.s1||""} onChange={v=>upd(pool,gi,si,"s1",v)}/><span style={{color:T.mut,fontWeight:900,fontSize:14}}>:</span><SB value={game.sets[si]?.s2||""} onChange={v=>upd(pool,gi,si,"s2",v)}/></div>
        </div>))}
      </div>
    </div>
  </div>)}

function Sched({teams,scores,setScores,mobile}){
  const[ap,sAP]=useState("A");
  const upd=(p,gi,si,f,v)=>{const n=JSON.parse(JSON.stringify(scores));n[p][gi].sets[si][f]=v;setScores(n)};
  if(mobile)return(<div style={{padding:12}}><SH sub="Tap a pool to enter scores" mobile>Pool Play</SH><Pills sel={ap} onChange={sAP} mobile/>{scores[ap]?.map((g,gi)=>(<GCard key={gi} pool={ap} game={g} gi={gi} teams={teams} upd={upd}/>))}</div>);
  return(<div style={{padding:16,overflowX:"auto"}}><SH sub="All courts running simultaneously">Pool Play Schedule</SH>
    <div style={{background:T.srf,borderRadius:14,border:`2px solid ${T.bdr}`,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,fontFamily:fb}}>
      <thead><tr><th style={{padding:"12px 10px",background:T.chD,color:"#fff",fontFamily:ff,letterSpacing:1,fontSize:13}}>TIME</th>
        {POOLS.map((p,ci)=>(<th key={p} style={{padding:"12px 8px",textAlign:"center",background:PT[p].h,color:"#fff",fontFamily:ff,letterSpacing:1,fontSize:13}}>Court {ci+1}  Pool {p}</th>))}</tr></thead>
      <tbody>{RR.map((m,gi)=>(<tr key={gi} style={{borderBottom:`1px solid ${T.bdr}`,background:gi%2===0?T.alt:T.srf}}>
        <td style={{padding:"10px",fontFamily:fm,fontWeight:700,fontSize:13,textAlign:"center",whiteSpace:"nowrap"}}>{TIMES[gi]} <span style={{color:T.mut,fontSize:11}}>R{REFS[gi]}</span></td>
        {POOLS.map(pool=>{const t1=RR[gi][0],t2=RR[gi][1],g=scores[pool]?.[gi];return(
          <td key={pool} style={{padding:"8px 6px",background:`${PT[pool].bg}88`}}><div style={{textAlign:"center"}}>
            <div style={{fontWeight:700,fontSize:12,color:PT[pool].t,marginBottom:2}}>{teams[pool][t1]} <span style={{color:T.mut}}>vs</span> {teams[pool][t2]}</div>
            <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:6}}>
              {[0,1].map(si=>(<div key={si} style={{display:"flex",alignItems:"center",gap:3,background:T.srf,borderRadius:8,padding:"4px 6px",border:`1px solid ${T.bdr}`}}>
                <span style={{fontSize:9,fontWeight:800,color:T.mut,fontFamily:ff}}>S{si+1}</span>
                <SB size="small" value={g?.sets[si]?.s1||""} onChange={v=>upd(pool,gi,si,"s1",v)}/><span style={{color:T.mut,fontWeight:900,fontSize:10}}>:</span><SB size="small" value={g?.sets[si]?.s2||""} onChange={v=>upd(pool,gi,si,"s2",v)}/>
              </div>))}</div></div></td>)})}</tr>))}</tbody></table></div></div>)}

function Stand({teams,scores,mobile}){
  const[ap,sAP]=useState("A");
  const Tbl=({pool})=>{const st=calc(pool,teams[pool],scores),pc=PT[pool];return(
    <div style={{background:T.srf,borderRadius:14,border:`2px solid ${pc.b}`,overflow:"hidden",boxShadow:`0 2px 12px ${pc.b}12`}}>
      {!mobile&&<div style={{background:`linear-gradient(135deg,${pc.h},${pc.h}CC)`,padding:"10px 16px",fontFamily:ff,fontSize:16,color:"#fff",letterSpacing:1}}>POOL {pool}</div>}
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,fontFamily:fb}}>
        <thead><tr style={{background:pc.bg}}>{["#","TEAM","SW","SL","+/-"].map(h=>(<th key={h} style={{padding:"10px 8px",textAlign:h==="TEAM"?"left":"center",fontWeight:800,fontSize:10,color:pc.t,fontFamily:ff,letterSpacing:1,borderBottom:`2px solid ${pc.b}33`}}>{h}</th>))}</tr></thead>
        <tbody>{st.map((s,i)=>(<tr key={s.idx} style={{background:i===0?`${T.gold}15`:i===1?`${T.sil}08`:"transparent",borderBottom:`1px solid ${T.bdr}`}}>
          <td style={{padding:"12px 8px",textAlign:"center",fontWeight:800,fontFamily:fm,fontSize:13}}>{i===0?"\u{1F947}":i===1?"\u{1F947}":i===2?"\u{1F948}":"\u{1F948}"}</td>
          <td style={{padding:"12px 8px",fontWeight:600,color:T.ch}}>{s.name}</td>
          <td style={{padding:"12px 8px",textAlign:"center",fontFamily:fm,fontWeight:700,color:T.acc}}>{s.sW}</td>
          <td style={{padding:"12px 8px",textAlign:"center",fontFamily:fm,fontWeight:700,color:"#D4700A"}}>{s.sL}</td>
          <td style={{padding:"12px 8px",textAlign:"center",fontFamily:fm,fontWeight:800,color:s.pd>0?T.acc:s.pd<0?"#D4700A":T.mut}}>{s.pd>0?"+":""}{s.pd}</td>
        </tr>))}</tbody></table></div>)};
  if(mobile)return(<div style={{padding:12}}><SH sub="Ranked by Sets Won, then Point Diff" mobile>Standings</SH><Pills sel={ap} onChange={sAP} mobile/><Tbl pool={ap}/></div>);
  return(<div style={{padding:16}}><SH sub="Ranked by Sets Won, then Point Differential">Standings</SH>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,maxWidth:900,margin:"0 auto"}}>{POOLS.map(p=><Tbl key={p} pool={p}/>)}</div></div>)}

function Playoff({teams,scores,ps,setPS,mobile}){
  const aS={};POOLS.forEach(p=>{aS[p]=calc(p,teams[p],scores)});
  const sd=(p,r)=>aS[p]?.[r]?.name||`${p}${r+1}`;
  const gQF=[{id:"QF1",l:"QF1",t1:sd("A",0),t2:sd("B",1),ct:1,tm:"1:00 PM"},{id:"QF2",l:"QF2",t1:sd("C",0),t2:sd("D",1),ct:2,tm:"1:00 PM"},{id:"QF5",l:"QF5",t1:sd("A",1),t2:sd("B",0),ct:1,tm:"1:45 PM"},{id:"QF6",l:"QF6",t1:sd("C",1),t2:sd("D",0),ct:2,tm:"1:45 PM"}];
  const sQF=[{id:"QF3",l:"QF3",t1:sd("A",2),t2:sd("B",3),ct:3,tm:"1:00 PM"},{id:"QF4",l:"QF4",t1:sd("C",2),t2:sd("D",3),ct:4,tm:"1:00 PM"},{id:"QF7",l:"QF7",t1:sd("A",3),t2:sd("B",2),ct:3,tm:"1:45 PM"},{id:"QF8",l:"QF8",t1:sd("C",3),t2:sd("D",2),ct:4,tm:"1:45 PM"}];
  const W=id=>{const m=ps[id];if(!m)return null;let a=0,b=0;m.sets.forEach(s=>{const x=parseInt(s.s1)||0,y=parseInt(s.s2)||0;if(x>y)a++;else if(y>x)b++});return a>b?m.t1:b>a?m.t2:null};
  const gSF=[{id:"GS1",l:"Gold SF1",t1:W("QF1")||"W QF1",t2:W("QF2")||"W QF2",ct:1,tm:"2:30 PM"},{id:"GS2",l:"Gold SF2",t1:W("QF5")||"W QF5",t2:W("QF6")||"W QF6",ct:2,tm:"2:30 PM"}];
  const sSF=[{id:"SS1",l:"Silver SF1",t1:W("QF3")||"W QF3",t2:W("QF4")||"W QF4",ct:3,tm:"2:30 PM"},{id:"SS2",l:"Silver SF2",t1:W("QF7")||"W QF7",t2:W("QF8")||"W QF8",ct:4,tm:"2:30 PM"}];
  const gF={id:"GF",l:"GOLD FINAL",t1:W("GS1")||"W GS1",t2:W("GS2")||"W GS2",ct:1,tm:"3:15 PM"};
  const sF={id:"SF",l:"SILVER FINAL",t1:W("SS1")||"W SS1",t2:W("SS2")||"W SS2",ct:3,tm:"3:15 PM"};
  const upd=(id,t1,t2,si,f,v)=>{setPS(p=>{const m=p[id]||{t1,t2,sets:[{s1:"",s2:""},{s1:"",s2:""},{s1:"",s2:""}]};const ns=[...m.sets];ns[si]={...ns[si],[f]:v};return{...p,[id]:{...m,t1,t2,sets:ns}}})};

  const MC=({match,div})=>{const isG=div==="gold",bg=isG?T.gBg:T.sBg,bc=isG?T.gBd:T.sBd,hbg=isG?T.gDk:T.sil,m=ps[match.id],w=W(match.id),isFin=match.l.includes("FINAL");
    return(<div style={{background:bg,borderRadius:14,border:`2px solid ${bc}`,overflow:"hidden",flex:mobile?"1 1 100%":"1 1 calc(50% - 6px)",boxShadow:isFin?`0 4px 20px ${bc}44`:`0 2px 8px ${bc}15`}}>
      <div style={{background:isFin?`linear-gradient(135deg,${hbg},${T.gold})`:hbg,color:"#fff",padding:"8px 14px",display:"flex",justifyContent:"space-between",fontFamily:fb,fontSize:13,fontWeight:600}}>
        <span style={{fontFamily:ff,letterSpacing:1,fontSize:isFin?14:12}}>{isFin?"\u{1F3C6} ":""}{match.l}</span>
        <span style={{fontSize:11,opacity:0.85}}>{match.tm} Ct {match.ct}</span>
      </div>
      <div style={{padding:10}}>{[match.t1,match.t2].map((team,ti)=>{const isW=w===team;return(
        <div key={ti} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:10,marginBottom:ti===0?4:0,background:isW?`${T.acc}12`:"transparent",border:isW?`2px solid ${T.acc}33`:"2px solid transparent"}}>
          <span style={{flex:1,fontFamily:fb,fontSize:13,fontWeight:isW?800:500,color:isW?T.acc:T.ch}}>{isW?"\u2713 ":""}{team}</span>
           <div style={{display:"flex",gap:4}}>{[0,1,2].map(si=>(<input key={si} type="number" inputMode="numeric" min="0" max="99"
            value={m?.sets[si]?.[ti===0?"s1":"s2"]||""} onChange={e=>upd(match.id,match.t1,match.t2,si,ti===0?"s1":"s2",e.target.value)}
            onFocus={e=>{if(!ps[match.id])setPS(p=>({...p,[match.id]:{t1:match.t1,t2:match.t2,sets:[{s1:"",s2:""},{s1:"",s2:""},{s1:"",s2:""}]}}));e.target.select()}}
            style={{width:38,height:34,textAlign:"center",border:`2px solid ${T.bdr}`,borderRadius:8,fontSize:14,fontWeight:800,fontFamily:fm,WebkitAppearance:"none",MozAppearance:"textfield",background:T.srf,color:T.ch}} placeholder="-"/>))}</div>
        </div>)})}</div></div>)};

  const Sec=({title,matches,div})=>(<div style={{marginBottom:16}}><h3 style={{fontFamily:ff,fontSize:14,letterSpacing:1,color:div==="gold"?T.gDk:T.sil,marginBottom:8,textTransform:"uppercase"}}>{title}</h3>
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{matches.map(m=><MC key={m.id} match={m} div={div}/>)}</div></div>);

  const Div=({title,emoji,color,bc,qfs,sfs,final,div})=>(<div style={{flex:1,minWidth:0}}>
    <div style={{fontFamily:ff,fontSize:mobile?16:20,color,letterSpacing:2,borderBottom:`3px solid ${bc}`,paddingBottom:6,marginBottom:14}}>{emoji} {title}</div>
    <Sec title="Quarter Finals" matches={qfs.slice(0,2)} div={div}/><Sec title="QF Round 2" matches={qfs.slice(2)} div={div}/>
    <Sec title="Semi Finals" matches={sfs} div={div}/><Sec title="Championship" matches={[final]} div={div}/></div>);

  return(<div style={{padding:mobile?12:16}}>
    <SH sub="Crossover single elimination  auto-seeded from standings" mobile={mobile}>Playoff Bracket</SH>
    <div style={{display:"flex",flexDirection:mobile?"column":"row",gap:24}}>
      <Div title="GOLD DIVISION" emoji={"\u{1F947}"} color={T.gDk} bc={T.gBd} qfs={gQF} sfs={gSF} final={gF} div="gold"/>
      <Div title="SILVER DIVISION" emoji={"\u{1F948}"} color={T.sil} bc={T.sBd} qfs={sQF} sfs={sSF} final={sF} div="silver"/>
    </div>
    <div style={{marginTop:24,padding:16,background:`linear-gradient(135deg,${T.chD},${T.chL})`,borderRadius:14,textAlign:"center",color:"#fff",fontFamily:ff,fontSize:mobile?14:18,letterSpacing:2}}>{"\u{1F3C6}"} 4:00 - 5:00 PM  AWARDS + CLEAN UP</div>
  </div>)}

export default function Tournament(){
  const mobile=useM();
  const[teams,setTeams]=useState(DT);
  const[scores,setScores]=useState(initS());
  const[ps,setPS]=useState({});
  const[tab,setTab]=useState("setup");
  const[started,setStarted]=useState(false);
  const[loaded,setLoaded]=useState(false);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState(null);
  const saveTimer=useRef(null);

  // Load from Postgres via API on mount
  useEffect(()=>{
    fetch("/api/tournament")
      .then(r=>r.json())
      .then(data=>{
        if(data.teams)setTeams(data.teams);
        if(data.scores)setScores(data.scores);
        if(data.playoffScores)setPS(data.playoffScores);
        if(data.started){setStarted(true);setTab("schedule")}
        setLoaded(true);
      })
      .catch(err=>{
        console.error("Failed to load tournament:",err);
        setError("Failed to load from database");
        setLoaded(true);
      });
  },[]);

  // Auto-save to Postgres via API (debounced 800ms)
  useEffect(()=>{
    if(!loaded)return;
    if(saveTimer.current)clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>{
      setSaving(true);
      fetch("/api/tournament",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({teams,scores,playoffScores:ps,started}),
      })
        .then(r=>{if(!r.ok)throw new Error("Save failed");return r.json()})
        .then(()=>{setSaving(false);setError(null)})
        .catch(err=>{console.error("Save error:",err);setSaving(false);setError("Save failed")});
    },800);
    return()=>{if(saveTimer.current)clearTimeout(saveTimer.current)};
  },[teams,scores,ps,started,loaded]);

  const reset=()=>{
    if(typeof window!=="undefined"&&!window.confirm("Reset all tournament data?"))return;
    fetch("/api/tournament",{method:"DELETE"})
      .then(()=>{
        setTeams(DT);setScores(initS());setPS({});setStarted(false);setTab("setup");setError(null);
      })
      .catch(err=>{console.error("Reset error:",err);setError("Reset failed")});
  };

  if(!loaded)return(<div style={{fontFamily:fb,background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{textAlign:"center",color:T.mut}}>
      <div style={{fontSize:40,marginBottom:8}}>{"\u{1F3D0}"}</div>
      <div style={{fontFamily:ff,fontSize:18,letterSpacing:2,color:T.ch}}>LOADING TOURNAMENT...</div>
    </div>
  </div>);

  return(<div style={{fontFamily:fb,background:T.bg,minHeight:"100vh",color:T.ch}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700;800&display=swap');
    input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}*{box-sizing:border-box;margin:0}body{margin:0}`}</style>

    <div style={{background:`linear-gradient(135deg,${T.chD} 0%,${T.ch} 60%,${T.chL} 100%)`,padding:mobile?"16px 12px 12px":"20px 24px 16px",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:`radial-gradient(circle,${T.gold} 1px,transparent 1px)`,backgroundSize:"32px 32px"}}/>
      <div style={{position:"relative"}}>
        <img src={LOGO} alt="Tito\'s Volleyball League" style={{height:mobile?60:90,marginBottom:4,filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.3))"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginTop:4}}>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.45)",fontFamily:fb}}>4 Pools {"\u2022"} Round Robin {"\u2022"} Crossover Playoffs</span>
          <span style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:error?"rgba(255,80,80,0.3)":saving?"rgba(242,169,34,0.3)":"rgba(56,161,105,0.3)",color:error?"#fed7d7":saving?T.gLt:"#68D391",fontWeight:700,fontFamily:fb}}>{error||( saving?"SAVING...":"\u2713 SYNCED")}</span>
        </div>
      </div>
    </div>

    {started&&<div style={{display:"flex",borderBottom:`2px solid ${T.bdr}`,background:T.srf,position:"sticky",top:0,zIndex:10,boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
      <NTab icon={"\u{1F3D0}"} label="Schedule" active={tab==="schedule"} onClick={()=>setTab("schedule")} mobile={mobile}/>
      <NTab icon={"\u{1F4CA}"} label="Standings" active={tab==="standings"} onClick={()=>setTab("standings")} mobile={mobile}/>
      <NTab icon={"\u{1F3C6}"} label="Playoffs" active={tab==="playoffs"} onClick={()=>setTab("playoffs")} mobile={mobile}/>
      <NTab icon={"\u{1F465}"} label="Teams" active={tab==="setup"} onClick={()=>setTab("setup")} mobile={mobile}/>
    </div>}

    <div style={{maxWidth:1100,margin:"0 auto",paddingBottom:40}}>
      {tab==="setup"&&<Setup teams={teams} setTeams={setTeams} onStart={()=>{setStarted(true);setTab("schedule")}} mobile={mobile}/>}
      {tab==="schedule"&&<Sched teams={teams} scores={scores} setScores={setScores} mobile={mobile}/>}
      {tab==="standings"&&<Stand teams={teams} scores={scores} mobile={mobile}/>}
      {tab==="playoffs"&&<Playoff teams={teams} scores={scores} ps={ps} setPS={setPS} mobile={mobile}/>}
    </div>

    {started&&<div style={{textAlign:"center",padding:"16px 0 32px"}}>
      <button onClick={reset} style={{padding:"8px 24px",background:"transparent",border:`1px solid ${T.bdr}`,borderRadius:8,color:T.mut,fontSize:12,fontFamily:fb,cursor:"pointer",fontWeight:600}}>Reset Tournament</button>
    </div>}
  </div>)}