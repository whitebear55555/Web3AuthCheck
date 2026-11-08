(function(){let L='ru';const $=id=>document.getElementById(id);const t=(k,v={})=>I18N[L][k].replace(/\{(\w+)\}/g,(_,x)=>v[x]);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){document.documentElement.lang=L;document.querySelectorAll('[data-i]').forEach(e=>e.innerHTML=I18N[L][e.dataset.i]);$('lang').textContent=L==='ru'?'EN':'RU';
 const v=Checker.validateReferenceList();$('list').innerHTML='<table>'+Checker.CHAINS.map((c,i)=>`<tr><td>${c.name}</td><td class="mono">${c.recovery}</td><td>${v[i].valid?'✓ checksum':'✗ INVALID'}</td></tr>`).join('')+`<tr><td>EVM (8)</td><td class="mono">${Checker.EVM_RECOVERY}</td><td>—</td></tr></table>`;}
$('lang').onclick=()=>{L=L==='ru'?'en':'ru';render();$('out').innerHTML='';$('pout').innerHTML='';};
const j_rel=(c,r)=>r.related?'<div class="small">'+t('rel_note')+'</div>':'';
function block(r,chain){const ret=r.retention&&r.retention.earliestTime?t('retention',{t:new Date(r.retention.earliestTime).toLocaleString()}):'';
 const link=`<a href="${chain.explorer}/address/${esc(r.address)}" target="_blank" rel="noopener noreferrer">${t('explorer')}</a>`;
 let cls,head;
 const okM=r.matches.filter(m=>m.txSucceeded),failM=r.matches.filter(m=>!m.txSucceeded);
 if(r.matches.length){cls='match';head=t('match',{n:okM.length,f:failM.length});}else if(r.status==='error'){cls='err';head=t('err')+': '+esc(r.errors.join('; '));}
 else if(r.status==='incomplete'){cls='inc';head=t('inc')+' ('+t('scanned',{n:r.scanned,t:r.total??'?'})+')';}else{cls='none';head=t('none',{n:r.scanned});}
 if(r.matches.length&&r.status!=='complete')head+=' — '+t('inc');
 const ms=r.matches.map(m=>`<li>${m.txSucceeded?t('tx_ok'):'<b>'+t('tx_fail',{c:esc(m.code)})+'</b>'} · <a class="mono" href="${m.url}" target="_blank" rel="noopener noreferrer">${esc(m.hash)}</a> · ${esc(m.time||'')} · ${esc(m.types.map(x=>x.split('.').pop()).join(', '))} · ${t('where')}: ${esc([...new Set(m.occurrences.flatMap(o=>o.kinds))].map(k=>t('k_'+k)).join(', '))}</li>`).join('');
 return `<div class="res ${cls}"><b>${chain.name}</b> <span class="mono">${esc(r.address)}</span><br>${head}${ms?'<ul>'+ms+'</ul><p class="small">'+t('occ_note')+'</p>'+t('next'):''}${j_rel(chain,r)}<div class="small">${ret} · ${link}</div></div>`;}
$('go').onclick=async()=>{const c=Checker.classifyInput($('addr').value);const out=$('out');
 if(c.kind==='invalid'){out.innerHTML=`<div class="res err">${t('invalid')}</div>`;return;}
 if(c.kind==='unsupported'){out.innerHTML=`<div class="res err">${t('unsupported',{h:esc(c.hrp)})}</div>`;return;}
 if(c.kind==='evm'){out.innerHTML=`<div class="res inc">${t('evm')}<span class="mono">${Checker.EVM_RECOVERY}</span>. <a href="https://blockscan.com/address/${esc(c.address)}" target="_blank" rel="noopener noreferrer">blockscan.com</a></div>`;return;}
 const jobs=[{chain:c.chain,address:c.address}].concat($('related').checked?Checker.relatedAddresses(c.address):[]);
 $('go').disabled=true;out.innerHTML=jobs.map((j,i)=>`<div id="r${i}" class="res">${j.chain.name}: ${t('checking')}</div>`).join('');
 await Promise.all(jobs.map(async(j,i)=>{const r=await Checker.checkChain(j.chain,j.address,(u)=>fetch(u));r.related=i>0;$('r'+i).outerHTML=block(r,j.chain);}));$('go').disabled=false;};
$('pgo').onclick=()=>{const f=Checker.scanPasted($('paste').value);$('pout').innerHTML=f.length?`<div class="res match">${t('pfound')}<ul>${f.map(x=>`<li>${x.name}: <span class="mono">${x.a}</span></li>`).join('')}</ul>${t('next')}</div>`:`<div class="res none">${t('nopaste')}</div>`;};
render();})();
