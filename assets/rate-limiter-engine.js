// Deterministic teaching model. Time is virtual seconds, not wall clock.
export const names=['Fixed window','Sliding log','Sliding counter','Token bucket','Leaky bucket'];
export function simulate(times,limit=5,window=10,capacity=5){
 if(!Number.isInteger(limit)||limit<=0||window<=0||!Number.isInteger(capacity)||capacity<=0||times.some((t,i)=>!Number.isFinite(t)||t<0||(i&&t<times[i-1])))throw Error('Invalid simulation inputs');
 let fixed=-1,count=0,sw=-1,cur=0,prev=0,log=[],tokens=capacity,last=0,nextDrain=null,queue=0;
 const rate=limit/window;
 return times.map(t=>{
  const w=Math.floor(t/window);
  if(w!==fixed){count=0;fixed=w}const a=count<limit;if(a)count++;
  log=log.filter(x=>x>t-window);const b=log.length<limit;if(b)log.push(t);
  if(w!==sw){prev=w===sw+1?cur:0;cur=0;sw=w}const est=prev*(1-(t%window)/window)+cur;const cc=est+1<=limit+1e-9;if(cc)cur++;
  tokens=Math.min(capacity,tokens+(t-last)*rate);last=t;const d=tokens+1e-9>=1;if(d)tokens=Math.max(0,tokens-1);
  while(queue>0&&nextDrain<=t+1e-9){queue--;nextDrain=queue?nextDrain+1/rate:null}
  const e=queue<capacity;let delay=null;if(e){if(queue===0)nextDrain=t+1/rate;queue++;delay=nextDrain+(queue-1)/rate-t}
  return {t,allowed:[a,b,cc,d,e],state:[count,log.length,Number((prev*(1-(t%window)/window)+cur).toFixed(2)),Number(tokens.toFixed(2)),queue],delay};
 });
}
export function race(atomic){return atomic?{a:true,b:false,remaining:0,trace:['A atomically reads and consumes last token','B sees zero; denied']}:{a:true,b:true,remaining:0,trace:['A reads 1; B reads 1','A writes 0; B writes 0; both allowed']}}
