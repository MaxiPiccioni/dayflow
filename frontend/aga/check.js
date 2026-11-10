const fs=require('fs');
eval(fs.readFileSync('p2_engine.js','utf8')+fs.readFileSync('p3_data.js','utf8')+`
function chk(it,objs){const m={};objs.forEach(o=>{if(!o.err)m[o.name]=o.v});const out=[];
for(const [n,exp] of Object.entries(it.expect||{})){const got=m[n];let ok=false;
 if(got!==undefined){ if(typeof exp==='number')ok=typeof got==='number'&&Math.abs(got-exp)<1e-7; else if(Array.isArray(exp))ok=got.c&&got.c.length===exp.length&&exp.every((x,i)=>Math.abs(got.c[i]-x)<1e-7); else ok=got.t==='s'&&got.v===exp;}
 out.push([n,ok,got===undefined?'undef':JSON.stringify(fmtVal(got,it.dec).main)]);}return out}
let bad=0,tot=0;
for(const e of EX){e.items.forEach((it,i)=>{const objs=evalScene(it.cmds);objs.filter(o=>o.err).forEach(o=>{console.log('ERR',e.id,i,o.raw,o.err);bad++});
 chk(it,objs).forEach(([n,ok,s])=>{tot++;if(!ok){bad++;console.log('FAIL',e.id,i,n,s)}})})}
console.log('checks',tot,'problems',bad);
const t=(s,d)=>console.log(s,'->',evalScene([s]).map(o=>o.err||JSON.stringify(fmtVal(o.v,d))).join());
t('(1,2,3)');t('|(3,4)|');t('4|(1,1)|');t('3.5*2');
`);
