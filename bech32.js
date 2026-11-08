(function(root){
const C='qpzry9x8gf2tvdw0s3jn54khce6mua7l';
function polymod(v){const G=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3];let c=1;for(const x of v){const b=c>>25;c=((c&0x1ffffff)<<5)^x;for(let i=0;i<5;i++)if((b>>i)&1)c^=G[i];}return c;}
function hrpExp(h){const r=[];for(const ch of h)r.push(ch.charCodeAt(0)>>5);r.push(0);for(const ch of h)r.push(ch.charCodeAt(0)&31);return r;}
function decode(s){if(typeof s!=='string')return null;s=s.trim();if(s!==s.toLowerCase()&&s!==s.toUpperCase())return null;s=s.toLowerCase();const p=s.lastIndexOf('1');if(p<1||p+7>s.length||s.length>90)return null;const hrp=s.slice(0,p);const d=[];for(const ch of s.slice(p+1)){const i=C.indexOf(ch);if(i<0)return null;d.push(i);}if(polymod(hrpExp(hrp).concat(d))!==1)return null;return {hrp,data:d.slice(0,-6)};}
function toBytes(d){let a=0,b=0;const o=[];for(const v of d){a=(a<<5)|v;b+=5;while(b>=8){b-=8;o.push((a>>b)&255);}}return o;}
function payloadHex(s){const r=decode(s);return r?toBytes(r.data).map(x=>x.toString(16).padStart(2,'0')).join(''):null;}
const api={decode,payloadHex};
if(typeof module!=='undefined')module.exports=api;else root.Bech32=api;
})(this);
