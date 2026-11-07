const {test}=require('node:test');
const assert=require('node:assert/strict');
const {scenarios,cents,evaluate}=require('./src/engine.js');
for(const s of scenarios){
 test(`${s.id}: 方向、借贷平衡与余额`,()=>{const r=evaluate(s.id,'10000','6000','8000');assert.equal(r.after,s.delta<0?400000:1600000);if(s.matchingOnly){assert.deepEqual(r.journal,[]);}else{assert.equal(r.journal[0].side,'借');assert.equal(r.journal[0].account,s.debit);assert.equal(r.journal[1].side,'贷');assert.equal(r.journal[1].account,s.credit);assert.equal(r.journal.reduce((n,j)=>n+(j.side==='借'?j.amount:-j.amount),0),0);}if(s.second)assert.equal(r.secondAfter,200000);});
 if(s.delta<0)test(`${s.id}: 拒绝超额核销`,()=>assert.throws(()=>evaluate(s.id,'100','100.01','1000'),/超过/));
 if(s.second)test(`${s.id}: 抵扣不能超过第二张单据余额`,()=>assert.throws(()=>evaluate(s.id,'10000','100','99.99'),/超过/));
 if(s.matchingOnly)test(`${s.id}: 不能撤销超过原记录的金额`,()=>assert.throws(()=>evaluate(s.id,'10000','100','99.99'),/超过/));
}
test('应付付款核销记借方，余额减少',()=>{const r=evaluate('ap-pay','10000','6000');assert.equal(r.account.name,'应付账款');assert.equal(r.journal[0].account,'应付账款');assert.equal(r.after,400000);});
test('应收收款核销记贷方',()=>{const r=evaluate('ar-receive','10000','6000');assert.equal(r.account.name,'应收账款');assert.equal(r.journal[1].account,'应收账款');});
test('分为单位，无浮点误差',()=>assert.equal(evaluate('ar-receive','0.30','0.10').after,20));
test('全额核销为零',()=>assert.equal(evaluate('ap-pay','100','100').after,0));
test('凭证已记账，仅匹配时不新增凭证',()=>assert.deepEqual(evaluate('ap-pay','100','60',null,'match').journal,[]));
test('非法金额均被拒绝',()=>{for(const x of ['-1','1.001','abc','','1e3','Infinity','NaN','1,000','99999999999'])assert.throws(()=>cents(x));});
test('本次金额不能为零',()=>assert.throws(()=>evaluate('ap-pay','100','0'),/大于/));
test('累计余额上限',()=>assert.throws(()=>evaluate('ap-create','9999999999.99','0.01'),/超过/));
test('拒绝未知场景',()=>assert.throws(()=>evaluate('invalid','100','10'),/有效/));
test('1000 组分金额核销守恒',()=>{for(let n=1;n<=1000;n++){const r=evaluate('ar-receive',((n*3)/100).toFixed(2),(n/100).toFixed(2));assert.equal(r.after,n*2);}});
