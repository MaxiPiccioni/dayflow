const fs=require('fs');
eval(fs.readFileSync('p2_engine.js','utf8')+fs.readFileSync('p2b_matrix.js','utf8')+fs.readFileSync('p3_data.js','utf8')+fs.readFileSync('p5_unit2.js','utf8')+`
let bad=0,tot=0;
for(const e of EX){e.items.forEach((it,i)=>{const objs=evalScene(it.cmds);
 const m={},errs={};objs.forEach(o=>{if(o.err)errs[o.name]=o.err;else m[o.name]=o.v});
 const exp=it.expect||{};
 objs.filter(o=>o.err && exp[o.name]!=='ERR').forEach(o=>{console.log('ERR',e.id,i,o.raw,'=>',o.err);bad++});
 for(const [n,x] of Object.entries(exp)){tot++;const ok=cmpExpect(m[n],x,errs[n]);if(!ok){bad++;console.log('FAIL',e.id,i,it.l||'',n,'got',m[n]?JSON.stringify(fmtVal(m[n]).main):'undef'+(errs[n]?' ['+errs[n]+']':''),'exp',expShown(x))}}})}
console.log('checks',tot,'problems',bad,'items',EX.length);
`);
