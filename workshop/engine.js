// Independent topology evaluator and deterministic path model.
// No production performance or correctness guarantees are inferred.
export function findPath(nodes,edges,source,target,offline=[],blocked=[]){
 const live=new Set(nodes.filter(n=>!offline.includes(n.id)).map(n=>n.id));
 if(!live.has(source)||!live.has(target))return null;
 const q=[[source]],seen=new Set([source]);while(q.length){const p=q.shift(),end=p[p.length-1];if(end===target)return p;for(const e of edges){if(e.from!==end||!live.has(e.to)||blocked.includes(e.id)||seen.has(e.to))continue;seen.add(e.to);q.push([...p,e.to])}}return null
}
export function checkTopology(challenge,nodes,edges){
 return challenge.rules.map(([label,from,to])=>{
 const origins=nodes.filter(n=>n.type===from),dest=nodes.filter(n=>n.type===to);
 const matches=origins.some(a=>dest.some(b=>{
 if(edges.some(e=>e.from===a.id&&e.to===b.id))return true;
 // Accept an explicit load balancer between source and destination.
 return nodes.filter(n=>n.type==='lb').some(l=>edges.some(e=>e.from===a.id&&e.to===l.id)&&edges.some(e=>e.from===l.id&&e.to===b.id));
 }));
 return {label,pass:matches};
 });
}
export function scoreDesign(challenge,nodes,edges){
 const checks=checkTopology(challenge,nodes,edges);
 return {checks,passed:checks.filter(c=>c.pass).length,total:checks.length,score:Math.round(checks.filter(c=>c.pass).length/checks.length*100)};
}
export function simulatePath({nodes,edges,palette,source,target,load,offline=[],blocked=[]}){
 const path=findPath(nodes,edges,source,target,offline,blocked);
 if(!path)return {path:null,capacity:0,served:0,dropped:load,latency:null,bottleneck:null};
 const types=new Map(palette.map(p=>[p[0],p])),byId=new Map(nodes.map(n=>[n.id,n]));
 const hops=path.map(id=>({id,type:types.get(byId.get(id).type)}));
 const constrained=hops.filter(h=>h.type[3]>0).sort((a,b)=>a.type[3]-b.type[3]);
 const cap=constrained[0]?.type[3]??load;
 const served=Math.min(load,cap);
 return {path,capacity:cap,served,dropped:load-served,latency:hops.reduce((n,h)=>n+h.type[4],0),bottleneck:constrained[0]?.id??null};
}
