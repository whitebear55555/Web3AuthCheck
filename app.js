(function(){let L='ru';let results=null;
const $=id=>document.getElementById(id);
const t=(k,v={})=>I18N[L][k].replace(/\{(\w+)\}/g,(_,x)=>v[x]??'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){document.documentElement.lang=L;document.querySelectorAll('[data-i]').forEach(e=>e.innerHTML=I18N[L][e.dataset.i]);$('lang').textContent=L==='ru'?'EN':'RU';
 const v=Checker.validateReferenceList();$('list').innerHTML='<table>'+Checker.CHAINS.map((c,i)=>`<tr><td>${c.name}</td><td class="mono">${c.recovery}</td><td>${v[i].valid?'✓ checksum':'✗ INVALID'}</td></tr>`).join('')+`<tr><td>EVM (8)</td><td class="mono">${Checker.EVM_RECOVERY}</td><td>—</td></tr></table>`;}
function fmtTime(s){if(!s)return '';const d=new Date(s);return isNaN(d)?String(s):d.toLocaleString(L==='ru'?'ru':'en',{dateStyle:'medium',timeStyle:'short'});}
function ownFirst(xs){return xs.slice().sort((a,b)=>Number(!!a.related)-Number(!!b.related));}
function names(xs){return xs.map(x=>esc(x.chain.name)).join(', ');}
function netLine(xs){return `<p class="net">${xs.length===1?t('net',{n:names(xs)}):t('nets',{n:names(xs)})}</p>`;}
function txButtons(ms){return ms.map(m=>{const when=m.time?`<span class="when">${esc(fmtTime(m.time))}</span>`:'';
 return `<p class="txrow"><a class="txbtn" href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">${t('view_tx')}</a>${when}</p>`;}).join('');}
function techTx(m){const kinds=[...new Set(m.occurrences.flatMap(o=>o.kinds))].map(k=>t('k_'+k)).join(', ');
 const types=(m.types||[]).map(x=>String(x).split('.').pop()).join(', ');
 const st=m.txSucceeded?t('tx_ok'):t('tx_fail')+(m.code?` · ${t('tx_code',{c:esc(m.code)})}`:'');
 const when=m.time?esc(fmtTime(m.time)):'';
 return `${st}${when?' · '+when:''}${types?' · '+esc(types):''}<br><span class="mono">${esc(m.hash)}</span><br>${t('where')}: ${esc(kinds)}`;}
function chainTech(x){const r=x.r;const bits=[`<b>${esc(x.chain.name)}</b>`,t('addr_checked')+': <span class="mono">'+esc(r.address)+'</span>',t('scanned',{n:r.scanned,t:r.total==null?'?':String(r.total)})];
 if(r.retention&&r.retention.earliestTime)bits.push(t('retention',{t:esc(fmtTime(r.retention.earliestTime))}));
 if(r.errors&&r.errors.length)bits.push(esc(r.errors.join('; ')));
 bits.push(`<a href="${esc(x.chain.explorer)}/address/${esc(r.address)}" target="_blank" rel="noopener noreferrer">${t('explorer')}</a>`);
 const txs=r.matches.map(m=>`<li>${techTx(m)}</li>`).join('');
 return `<div class="tech">${bits.join('<br>')}${txs?'<ul>'+txs+'</ul>':''}</div>`;}
function details(xs){return `<details><summary>${t('details')}</summary>${xs.map(chainTech).join('')}</details>`;}
function groupCard(cls,title,body,xs){return `<div class="res ${cls}"><h3>${title}</h3>${netLine(xs)}<p>${body}</p>${details(xs)}</div>`;}
function matchCard(x){const r=x.r;const ok=r.matches.filter(m=>m.txSucceeded),fail=r.matches.filter(m=>!m.txSucceeded);
 let html=`<div class="res ${ok.length?'match':'inc'}">`;
 if(ok.length)html+=`<h3>${t('match_title')}</h3>${netLine([x])}<p>${t('match_body')}</p><p>${t('match_caveat')}</p>${txButtons(ok)}`;
 if(fail.length)html+=`<h3 class="${ok.length?'again':''}">${t('fail_title')}</h3>${ok.length?'':netLine([x])}<p>${t('fail_body')}</p>${txButtons(fail)}`;
 if(x.related)html+=`<p class="small">${t('rel_note')}</p>`;
 if(r.status==='incomplete')html+=`<p>${t('inc_title')} ${t('inc_body')}</p>`;
 if(r.status==='error')html+=`<p>${t('err_title')} ${t('err_body')}</p>`;
 return html+details([x])+'</div>';}
function paint(){const out=$('out');if(!results){out.innerHTML='';return;}
 const done=results.filter(x=>x.r),pending=results.filter(x=>!x.r);
 const ok=[],failOnly=[],ownNone=[],relNone=[],ownInc=[],relInc=[],ownErr=[],relErr=[];
 for(const x of done){const r=x.r;
  if(r.matches.length){(r.matches.some(m=>m.txSucceeded)?ok:failOnly).push(x);continue;}
  const sink=r.status==='error'?(x.related?relErr:ownErr):r.status==='incomplete'?(x.related?relInc:ownInc):(x.related?relNone:ownNone);
  sink.push(x);}
 const parts=[];
 ownFirst(ok).forEach(x=>parts.push(matchCard(x)));
 ownFirst(failOnly).forEach(x=>parts.push(matchCard(x)));
 if(ownErr.length)parts.push(groupCard('err',t('err_title'),t('err_body'),ownErr));
 if(ownInc.length)parts.push(groupCard('inc',t('inc_title'),t('inc_body'),ownInc));
 if(ownNone.length)parts.push(groupCard('none',t('none_title'),t('none_body'),ownNone));
 if(relErr.length)parts.push(groupCard('err',t('err_title'),t('err_body_rel'),ownFirst(relErr)));
 if(relInc.length)parts.push(groupCard('inc',t('inc_title'),t('inc_body_rel'),ownFirst(relInc)));
 if(relNone.length)parts.push(groupCard('none',t('rel_clear_title'),t('rel_note'),ownFirst(relNone)));
 if(pending.length)parts.push(`<div class="res">${t('checking_nets',{n:names(pending)})}</div>`);
 out.innerHTML=parts.join('');}
$('lang').onclick=()=>{L=L==='ru'?'en':'ru';render();paint();$('pout').innerHTML='';};
$('go').onclick=async()=>{const c=Checker.classifyInput($('addr').value);const out=$('out');
 if(c.kind==='invalid'){results=null;out.innerHTML=`<div class="res err"><h3>${t('invalid')}</h3></div>`;return;}
 if(c.kind==='unsupported'){results=null;out.innerHTML=`<div class="res err"><h3>${t('unsupported',{h:esc(c.hrp)})}</h3></div>`;return;}
 if(c.kind==='evm'){results=null;out.innerHTML=`<div class="res inc"><p>${t('evm')}<span class="mono">${Checker.EVM_RECOVERY}</span>. <a href="https://blockscan.com/address/${esc(c.address)}" target="_blank" rel="noopener noreferrer">blockscan.com</a></p></div>`;return;}
 const jobs=[{chain:c.chain,address:c.address}].concat($('related').checked?Checker.relatedAddresses(c.address):[]);
 results=jobs.map((j,i)=>({chain:j.chain,address:j.address,related:i>0,r:null}));
 $('go').disabled=true;paint();
 await Promise.all(results.map(async x=>{x.r=await Checker.checkChain(x.chain,x.address,u=>fetch(u));paint();}));
 $('go').disabled=false;};
$('pgo').onclick=()=>{const f=Checker.scanPasted($('paste').value);$('pout').innerHTML=f.length?`<div class="res match"><h3>${t('pfound')}</h3><ul>${f.map(x=>`<li>${esc(x.name)}: <span class="mono">${esc(x.a)}</span></li>`).join('')}</ul><p>${t('next')}</p></div>`:`<div class="res none"><p>${t('nopaste')}</p></div>`;};
render();})();
