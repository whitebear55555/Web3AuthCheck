(function(root){
const B = (typeof module!=='undefined') ? require('./bech32.js') : root.Bech32;
// Reference list as published in the user's message; network list and EVM address corroborated by crypto.news (see README).
const CHAINS = [
 {id:'cosmoshub',name:'Cosmos Hub',hrp:'cosmos',rest:'https://cosmos-rest.publicnode.com',coin118:true,recovery:'cosmos1atuap9kfnt6y8ykvn3437e7j3z8qffh3qtnmwu',explorer:'https://www.mintscan.io/cosmos'},
 {id:'osmosis',name:'Osmosis',hrp:'osmo',rest:'https://osmosis-rest.publicnode.com',coin118:true,recovery:'osmo1atuap9kfnt6y8ykvn3437e7j3z8qffh3gsqtcw',explorer:'https://www.mintscan.io/osmosis'},
 {id:'celestia',name:'Celestia',hrp:'celestia',rest:'https://public-celestia-lcd.numia.xyz',coin118:true,recovery:'celestia1atuap9kfnt6y8ykvn3437e7j3z8qffh33pzt53',explorer:'https://www.mintscan.io/celestia'},
 {id:'akash',name:'Akash',hrp:'akash',rest:'https://akash-rest.publicnode.com',coin118:true,recovery:'akash1atuap9kfnt6y8ykvn3437e7j3z8qffh3ds7uhx',explorer:'https://www.mintscan.io/akash'},
 {id:'noble',name:'Noble',hrp:'noble',rest:'https://noble-api.polkachu.com',coin118:true,recovery:'noble1atuap9kfnt6y8ykvn3437e7j3z8qffh3ggxnkj',explorer:'https://www.mintscan.io/noble'},
 {id:'injective',name:'Injective',hrp:'inj',rest:'https://injective-rest.publicnode.com',coin118:false,recovery:'inj1lqmdmuczn5rxn5jkc34wwrqdeh70etpf5wvt7g',explorer:'https://www.mintscan.io/injective'},
 {id:'dydx',name:'dYdX',hrp:'dydx',rest:'https://dydx-rest.publicnode.com',coin118:true,recovery:'dydx1atuap9kfnt6y8ykvn3437e7j3z8qffh3fjalwt',explorer:'https://www.mintscan.io/dydx'},
 {id:'babylon',name:'Babylon',hrp:'bbn',rest:'https://babylon-rest.publicnode.com',coin118:true,recovery:'bbn1atuap9kfnt6y8ykvn3437e7j3z8qffh3h4z239',explorer:'https://www.mintscan.io/babylon'},
 {id:'axelar',name:'Axelar',hrp:'axelar',rest:'https://axelar-rest.publicnode.com',coin118:true,recovery:'axelar1atuap9kfnt6y8ykvn3437e7j3z8qffh3y99n9a',explorer:'https://www.mintscan.io/axelar'},
 {id:'saga',name:'Saga',hrp:'saga',rest:'https://saga-rest.publicnode.com',coin118:true,recovery:'saga1atuap9kfnt6y8ykvn3437e7j3z8qffh37c2ff6',explorer:'https://www.mintscan.io/saga'},
 {id:'agoric',name:'Agoric',hrp:'agoric',rest:'https://main.api.agoric.net',coin118:false,recovery:'agoric1atuap9kfnt6y8ykvn3437e7j3z8qffh3jk3y72',explorer:'https://www.mintscan.io/agoric'}
];
const EVM_RECOVERY='0x413e4F4De7E5FF010913488F781E679e76f706dA';
const PAGE=50, MAX_PAGES=20;
const INCIDENT_START='2026-11-06T00:00:00Z'; // per crypto.news / Bitquery: incident 6-7 Nov 2026
// Node retention: pruned nodes silently return nothing for older txs. Determine earliest available block time.
async function retention(chain,fetchFn){
 try{const r=await fetchFn(chain.rest+'/cosmos/base/tendermint/v1beta1/blocks/1');const j=await r.json();
  if(r.ok&&!j.code){return {earliestTime:(j.block||j.sdk_block).header.time,coversIncident:true};}
  const m=/lowest height is (\d+)/.exec(j.message||'');if(!m)return {coversIncident:false,error:'unknown retention'};
  const getT=async h=>{try{const x=await fetchFn(chain.rest+'/cosmos/base/tendermint/v1beta1/blocks/'+h);const y=await x.json();return (x.ok&&!y.code)?(y.block||y.sdk_block).header.time:null;}catch(e){return null;}};
  let lo=Number(m[1]),t=await getT(lo+500);let h=lo+500;
  if(!t){ // reported lowest height is not actually served: binary search up to latest
   const lr=await fetchFn(chain.rest+'/cosmos/base/tendermint/v1beta1/blocks/latest');const lj=await lr.json();let hi=Number((lj.block||lj.sdk_block).header.height);
   if(!(await getT(hi)))return {coversIncident:false,error:'retention unknown'};
   for(let i=0;i<40&&hi-lo>1;i++){const mid=Math.floor((lo+hi)/2);if(await getT(mid))hi=mid;else lo=mid;}
   h=hi;t=await getT(hi);}
  if(!t)return {coversIncident:false,error:'retention unknown'};
  return {earliestHeight:String(h),earliestTime:t,coversIncident:new Date(t)<=new Date(INCIDENT_START)};
 }catch(e){return {coversIncident:false,error:String(e.message||e)};}}

function bytesToWords(bytes){let a=0,b=0;const o=[];for(const x of bytes){a=(a<<8)|x;b+=8;while(b>=5){b-=5;o.push((a>>b)&31);}}if(b>0)o.push((a<<(5-b))&31);return o;}
const CS='qpzry9x8gf2tvdw0s3jn54khce6mua7l';
function encode(hrp,hex){const bytes=hex.match(/../g).map(h=>parseInt(h,16));const d=bytesToWords(bytes);
 const G=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3];const pm=v=>{let c=1;for(const x of v){const t=c>>25;c=((c&0x1ffffff)<<5)^x;for(let i=0;i<5;i++)if((t>>i)&1)c^=G[i];}return c;};
 const he=[];for(const ch of hrp)he.push(ch.charCodeAt(0)>>5);he.push(0);for(const ch of hrp)he.push(ch.charCodeAt(0)&31);
 const p=pm(he.concat(d,[0,0,0,0,0,0]))^1;const ck=[];for(let i=0;i<6;i++)ck.push((p>>(5*(5-i)))&31);return hrp+'1'+d.concat(ck).map(x=>CS[x]).join('');}

function validateReferenceList(){return CHAINS.map(c=>{const d=B.decode(c.recovery);return {id:c.id,address:c.recovery,valid:!!d&&d.hrp===c.hrp};});}

function classifyInput(s){s=(s||'').trim();
 if(/^0x[0-9a-fA-F]{40}$/.test(s))return {kind:'evm',address:s};
 const d=B.decode(s); if(!d)return {kind:'invalid',reason: s.includes('1')?'checksum':'format'};
 if(B.payloadHex(s).length!==40)return {kind:'invalid',reason:'length'};
 const chain=CHAINS.find(c=>c.hrp===d.hrp); if(!chain)return {kind:'unsupported',hrp:d.hrp,address:s.toLowerCase()};
 return {kind:'cosmos',chain,address:s.toLowerCase()};}

// Same 20 address bytes re-encoded with other prefixes. Does NOT prove the same wallet/derivation is used on that chain.
function relatedAddresses(addr){const d=B.decode(addr);const src=CHAINS.find(c=>c.hrp===d.hrp);if(!src)return [];
 const hex=B.payloadHex(addr);return CHAINS.filter(c=>c.hrp!==d.hrp&&c.hrp!=='inj'&&src.hrp!=='inj').map(c=>({chain:c,address:encode(c.hrp,hex)}));}

// Inspect a tx (JSON) for recovery addresses. Looks at every string field (messages, events, logs) -> catches MsgSend, MultiSend,
// IBC MsgTransfer receiver, tokenize-share record transfer, authz-wrapped msgs, events of any type.
// Returns where each reference address OCCURS (JSON paths). An occurrence is NOT proof of a transfer:
// it may be a memo, an unrelated event, a failed tx, etc. Direction/amount are NOT validated.
function findPaths(o,needle,path,out){if(typeof o==='string'){if(o.toLowerCase().includes(needle))out.push(path);}
 else if(Array.isArray(o))o.forEach((v,i)=>findPaths(v,needle,path+'['+i+']',out));
 else if(o&&typeof o==='object')for(const k of Object.keys(o))findPaths(o[k],needle,path?path+'.'+k:k,out);return out;}
function locKind(p){return /memo/.test(p)?'memo':/(^|\.)tx\.body\.messages|^body\.messages/.test(p)?'message':/events|logs/.test(p)?'event':'other';}
function scanTx(tx,recoveries){return recoveries.map(r=>{const paths=findPaths(tx,r.toLowerCase(),'',[]);return paths.length?{address:r,paths,kinds:[...new Set(paths.map(locKind))]}:null;}).filter(Boolean);}
function msgTypes(tx){try{return (tx.body||tx.tx.body).messages.map(m=>m['@type']);}catch(e){return [];}}

async function checkChain(chain,address,fetchFn,opts={}){
 const maxPages=opts.maxPages||MAX_PAGES;
 const recs=[chain.recovery];if(chain.id==='injective')recs.push(EVM_RECOVERY);
 const out={chain:chain.id,address,status:'complete',scanned:0,total:null,matches:[],errors:[]};
 out.retention=await retention(chain,fetchFn);
 const fin=o=>{if(o.status==='complete'&&!o.retention.coversIncident)o.status='incomplete';return o;};
 for(let page=1;page<=maxPages;page++){
  const url=chain.rest+'/cosmos/tx/v1beta1/txs?query='+encodeURIComponent("message.sender='"+address+"'")+'&pagination.limit='+PAGE+'&page='+page+'&limit='+PAGE+'&pagination.offset='+((page-1)*PAGE)+'&pagination.count_total=true&order_by=ORDER_BY_DESC';
  let j;
  try{const r=await fetchFn(url);j=await r.json();if(!r.ok||j.code){throw new Error((j&&j.message)||('HTTP '+r.status));}}
  catch(e){out.status='error';out.errors.push(String(e.message||e));return fin(out);}
  const resp=j.tx_responses||[];
  if(out.total===null&&j.total!=null)out.total=Number(j.total);
  resp.forEach(tr=>{out.scanned++;const hit=scanTx(tr,recs);if(hit.length){const code=Number(tr.code||0);out.matches.push({kind:'occurrence',txSucceeded:code===0,hash:tr.txhash,height:tr.height,time:tr.timestamp,code,types:msgTypes(tr.tx||tr),occurrences:hit,url:chain.explorer+'/tx/'+tr.txhash});}});
  if(resp.length<PAGE){ if(out.total!==null&&out.scanned<out.total)out.status='incomplete'; return fin(out);}
  if(out.total!==null&&out.scanned>=out.total)return fin(out);
 }
 out.status='incomplete';return out;}

function scanPasted(text){const t=(text||'').toLowerCase();const all=CHAINS.map(c=>({name:c.name,a:c.recovery})).concat([{name:'EVM',a:EVM_RECOVERY}]);
 return all.filter(x=>t.includes(x.a.toLowerCase())||(x.name==='EVM'&&t.includes(x.a.slice(2).toLowerCase())));}

const api={retention,INCIDENT_START,CHAINS,EVM_RECOVERY,encode,validateReferenceList,classifyInput,relatedAddresses,scanTx,checkChain,scanPasted};
if(typeof module!=='undefined')module.exports=api;else root.Checker=api;
})(this);
