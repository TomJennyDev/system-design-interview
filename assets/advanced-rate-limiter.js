import {simulate,race,names} from './rate-limiter-engine.js?v=8';
const $=id=>document.getElementById(id);function el(t,v,c){const e=document.createElement(t);if(v!==undefined)e.textContent=v;if(c)e.className=c;return e}function pair(en,vi){let d=el('div',undefined,'bilingual');for(const [lang,label,v] of [['en','ENGLISH',en],['vi','TIẾNG VIỆT',vi]]){let s=el('section');s.lang=lang;s.append(el('div',label,'lang-label'),el('p',v));d.append(s)}return d}
function row(parent,title,en,vi,extra){let d=el('div',undefined,'option-row');d.append(el('h3',title),pair(en,vi));if(extra)d.append(el('p',extra,'muted'));parent.append(d)}
let events=[],cursor=0,timer=null;const presets={boundary:[9.8,9.8,9.9,9.9,9.9,10,10,10.1,10.1,10.2],burst:[0,0,0,0,0,0,1,2,4,4,6,10],steady:[0,2,4,6,8,10,12,14,16,18]};
function stop(){clearInterval(timer);timer=null;$('play').textContent='▶ Play'}function reset(){stop();cursor=0;events=simulate(presets[$('preset').value]);render()}function next(){if(cursor>=events.length){stop();return}cursor++;render();if(cursor===events.length)stop()}
function render(){let r=events[cursor-1];$('event').textContent=r?'Request '+cursor+' / '+events.length+' · virtual t = '+r.t+' s':'Ready · '+events.length+' requests';let box=$('sim-results');box.replaceChildren();names.forEach((name,i)=>{let d=el('div',undefined,'sim-row'),meter=el('div',undefined,'meter');let count=r?r.state[i]:(i===3?5:0);for(let k=0;k<5;k++){let s=el('span');if(k<Math.ceil(count))s.className='on';meter.append(s)}let verdict=r?(r.allowed[i]?(i===4?'QUEUED':'ALLOW'):'DENY'):'—';let right=el('span',verdict,r?(r.allowed[i]?'yes':'no'):'muted');d.append(el('strong',name),meter,right);d.append(el('span',i===3?'Tokens remaining: '+count:i===4?'Queue depth: '+count+(r?.delay!=null?' · wait '+r.delay.toFixed(1)+'s':''):'Count: '+count,'muted'));box.append(d)});let t=el('table'),head=el('tr');for(const name of ['t (s)',...names])head.append(el('th',name));t.append(head);for(const e of events.slice(0,cursor)){let tr=el('tr');tr.append(el('td',String(e.t)));e.allowed.forEach((a,i)=>tr.append(el('td',a?(i===4?'queued':'allow'):'deny',a?'yes':'no')));t.append(tr)}$('history').replaceChildren(t);$('next').disabled=cursor>=events.length}
$('preset').onchange=reset;$('reset').onclick=reset;$('next').onclick=()=>{stop();next()};$('play').onclick=()=>{if(timer){stop();return}if(cursor>=events.length)reset();next();if(cursor<events.length){$('play').textContent='Ⅱ Pause';timer=setInterval(next,1000)}};reset();
function showRace(a){const r=race(a);$('race-result').replaceChildren(el('div',r.trace.join('\n')+'\n\nA: '+(r.a?'ALLOW':'DENY')+'   B: '+(r.b?'ALLOW':'DENY')+'\nRemaining tokens: '+r.remaining,'race-diagram'),pair(a?'Only one operation consumes the token.':'Both requests were admitted even though only one token existed.',a?'Chỉ một thao tác tiêu token.':'Cả hai request được nhận dù chỉ có một token.'))}$('atomic').onclick=()=>showRace(true);$('nonatomic').onclick=()=>showRace(false);showRace(false);
const options=[
['A · Per-instance memory','Client → Gateway (local bucket) → Backend','Fast, no network dependency. Quota multiplies across independent instances; suitable only for local protection or intentionally divided budgets.','Nhanh, không phụ thuộc mạng. Quota nhân lên qua instance độc lập; chỉ phù hợp bảo vệ local hoặc chia ngân sách có chủ đích.'],
['B · Centralized atomic state','Client → Gateway → Limiter → Redis primary → Backend','Shared authoritative bucket across gateways. Atomic per-key decision, extra network latency and a hot-key serialization point. Shard by independent quota keys.','Bucket chuẩn chung qua gateway. Quyết định atomic mỗi key, thêm latency mạng và điểm tuần tự key nóng. Shard theo key quota độc lập.'],
['C · Hierarchical regional budgets','Global allocator → fenced regional leases → gateway buckets','Preallocate bounded quota per region to avoid a global round trip. Coordination moves to lease allocation and reclaim; unused regional capacity may be stranded.','Cấp trước quota giới hạn mỗi vùng để tránh round trip toàn cầu. Phối hợp chuyển sang cấp/thu hồi lease; capacity dư vùng có thể không dùng được.']];
function architectureDiagram(i){const ns='http://www.w3.org/2000/svg',s=(tag,attrs={},label)=>{let e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(label!==undefined)e.textContent=label;return e};let svg=s('svg',{viewBox:'0 0 640 240',role:'img','aria-label':'Architecture option '+(i+1),style:'min-width:420px'}),defs=s('defs'),mk=s('marker',{id:'ad-arrow-'+i,markerWidth:7,markerHeight:7,refX:6,refY:3.5,orient:'auto'});mk.append(s('path',{d:'M0 0L7 3.5L0 7Z',fill:'#71899f'}));defs.append(mk);svg.append(defs);const graphs=[{nodes:[['Client',80,48],['Gateway A',300,48],['Local bucket A',300,160],['Gateway B',500,48],['Local bucket B',500,160]],edges:[[0,1],[0,3],[1,2],[3,4]]},{nodes:[['Client',70,50],['Gateway',240,50],['Limiter',400,50],['Redis primary',400,170],['Backend',560,125]],edges:[[0,1],[1,2],[2,3],[1,4]]},{nodes:[['Global allocator',320,45],['Region A lease',165,125],['Region B lease',475,125],['Gateway buckets',165,205],['Gateway buckets',475,205]],edges:[[0,1],[0,2],[1,3],[2,4]]}];let g=graphs[i];for(const [a,b] of g.edges){let [,x,y]=g.nodes[a],[,u,v]=g.nodes[b],dx=u-x,dy=v-y,d=Math.max(Math.abs(dx)/66,Math.abs(dy)/21);svg.append(s('line',{x1:x+dx/d,y1:y+dy/d,x2:u-dx/d,y2:v-dy/d,stroke:'#71899f','stroke-width':1.6,'marker-end':'url(#ad-arrow-'+i+')'}))}for(const [label,x,y] of g.nodes){svg.append(s('rect',{x:x-65,y:y-20,width:130,height:40,rx:6,fill:/bucket|lease|Redis/.test(label)?'#eef4fc':'white',stroke:'#a2b4c7'}),s('text',{x,y:y+4,'text-anchor':'middle','font-size':12,'font-family':'system-ui',fill:'#172333'},label))}let frame=el('div',undefined,'evolution-frame');frame.append(svg);return frame}
for(const [i,[t,route,en,vi]] of options.entries()){let d=el('div',undefined,'option-row');d.append(el('h3',t),el('p',route,'route-line'),architectureDiagram(i),pair(en,vi));$('options').append(d)}
const examples=[
['Redis Lua · single-key token bucket (illustrative)',`-- KEYS[1]: trusted bucket key
-- ARGV: capacity, tokens/sec, cost
local cap=tonumber(ARGV[1])
local rate=tonumber(ARGV[2])
local cost=tonumber(ARGV[3])
if not cap or not rate or not cost or cap<=0 or rate<=0 or cost<=0 or cost>cap then
  return redis.error_reply("invalid policy")
end
local clock=redis.call("TIME")
local now=tonumber(clock[1])+tonumber(clock[2])/1000000
local data=redis.call("HMGET",KEYS[1],"tokens","last")
local tokens=tonumber(data[1]) or cap
local last=tonumber(data[2]) or now
now=math.max(now,last)
tokens=math.min(cap,tokens+(now-last)*rate)
local allowed=0
if tokens>=cost then tokens=tokens-cost; allowed=1 end
redis.call("HSET",KEYS[1],"tokens",tokens,"last",now)
redis.call("PEXPIRE",KEYS[1],math.max(1000,math.ceil(cap/rate*1000)))
local retry=0
if allowed==0 then retry=math.ceil((cost-tokens)/rate*1000) end
return {allowed,tostring(tokens),retry}`,'Single-key atomic example; test against your Redis version, clock behavior, numeric precision and policy changes before production.','Ví dụ atomic một key; kiểm thử phiên bản Redis, clock, precision và đổi policy trước production.'],
['Gateway pseudocode · decision contract',`decision = limiter.check(verifiedIdentity, route, trustedCost)
if decision.status == DENIED:
    return 429, Retry-After = ceil(decision.retryMs / 1000)
if decision.status == UNAVAILABLE:
    if route.requiresStrictQuota:
        return 503
    if not localBudget.tryConsume(trustedCost):
        return 503
return backend.forward(request)`,'Use a bounded local budget only for routes that accept approximate enforcement; quota denial and unavailable are distinct.','Chỉ dùng budget local giới hạn cho route chấp nhận quota xấp xỉ; phân biệt deny và unavailable.'],
['Atomic tenant + user quota · pseudocode',`atomic within one authoritative transaction:
    user = refill(userBucket)
    tenant = refill(tenantBucket)
    if user.tokens < cost or tenant.tokens < cost:
        return DENY
    user.tokens -= cost
    tenant.tokens -= cost
    persist both
    return ALLOW`,'Both keys need the same atomic boundary. Redis Cluster scripts accessing multiple keys require co-location; across shards a different coordination model is required.','Hai key cần cùng ranh giới atomic. Script nhiều key Redis Cluster cần cùng slot; khác shard phải có mô hình phối hợp khác.']];
for(const [t,src,en,vi] of examples){let p=el('pre');p.append(el('code',src));$('code').append(el('h3',t),p,pair(en,vi))}
const tests=[['Boundary + burst','Replay five arrivals before and five after a boundary; fixed window admits ten while exact rolling log admits five.','Replay năm request trước và năm sau ranh giới; fixed window nhận mười, rolling log chính xác nhận năm.'],['Concurrent invariant','Run simultaneous requests against one full bucket. Assert accepted cost never exceeds initial capacity plus elapsed refill under the stated clock and single-primary model.','Chạy request đồng thời trên bucket đầy. Kiểm tra tổng cost được nhận không vượt capacity ban đầu cộng refill theo giả định clock và single-primary.'],['Fault injection','Inject timeouts after writes, replica promotion, stale policy and region loss. Record false admits, false denies and recovery time.','Inject timeout sau ghi, promote replica, policy cũ và mất vùng. Ghi nhận false admit, false deny và thời gian phục hồi.'],['Load and observability','Measure p50/p95/p99 decision latency, throughput, error rate, saturation, memory per key, hot tenant skew and backend protection. Establish safe capacity empirically.','Đo p50/p95/p99, throughput, lỗi, saturation, RAM mỗi key, tenant nóng và bảo vệ backend. Xác lập công suất an toàn bằng thực nghiệm.']];
for(const [t,en,vi] of tests)row($('validation'),t,en,vi);
async function init(){try{const r=await fetch('../data/advanced/rate-limiter.json?v=8');if(!r.ok)throw Error('HTTP '+r.status);const d=await r.json();for(const s of d.stages){let g=el('div',undefined,'qa-group');g.append(el('h3',s.title),el('p',s.vi,'muted'));for(const [q,qvi,en,vi] of s.qa){let a=el('details');a.append(el('summary',q),el('p',qvi,'muted'),pair(en,vi));g.append(a)}$('qa').append(g)}for(const [name,viName,en,vi,use] of d.algorithms)row($('algorithm-list'),name+' / '+viName,en,vi,use);for(const [name,viName,en,vi] of d.failures)row($('failure-list'),name+' / '+viName,en,vi);for(const [name,url] of d.sources){let li=el('li'),a=el('a',name);a.href=url;a.rel='noopener noreferrer';li.append(a);$('refs').append(li)}}catch(e){$('error').textContent='Could not load advanced lesson: '+e.message}}init();