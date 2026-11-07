(function(root){
  'use strict';
  const Engine=typeof module!=='undefined'&&module.exports?require('./engine.js'):root.FinanceEngine;
  function normaliseInput(raw){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('案例缺少业务数据。');
    if(typeof raw.scenario!=='string'||!Engine.scenarios.some(s=>s.id===raw.scenario))throw Error('备份含有不支持的业务场景。');
    const scenario=Engine.scenarios.find(s=>s.id===raw.scenario);
    if(raw.mode!==undefined&&!['journal','match'].includes(raw.mode))throw Error('备份中的凭证处理方式无效。');
    const amount=v=>{if(typeof v!=='string'&&typeof v!=='number')throw Error('备份金额格式无效。');Engine.cents(v);return String(v);};
    const input={scenario:raw.scenario,balance:amount(raw.balance),amount:amount(raw.amount),secondBalance:scenario.second||scenario.matchingOnly?amount(raw.secondBalance):'0',mode:scenario.delta>0?'journal':raw.mode||'journal',counterparty:typeof raw.counterparty==='string'?raw.counterparty.trim().slice(0,80):''};
    Engine.evaluate(input.scenario,input.balance,input.amount,input.secondBalance,input.mode);
    return input;
  }
  function caseKey(input){const p=normaliseInput(input);return JSON.stringify([p.scenario,Engine.cents(p.balance),Engine.cents(p.amount),Engine.cents(p.secondBalance),p.mode,p.counterparty]);}
  function parseBackup(text){
    if(typeof text!=='string'||text.length>2000000)throw Error('备份文件过大，最大支持 2 MB。');
    let data;try{data=JSON.parse(text.replace(/^\uFEFF/,''));}catch{throw Error('不是有效的 JSON 备份文件。');}
    if(!data||data.version!==1||!Array.isArray(data.cases)||data.cases.length>500)throw Error('请选择知账导出的案例备份，最多 500 条。');
    return data.cases.map((c,i)=>{try{const input=normaliseInput(c?.input);const date=typeof c.createdAt==='string'&&Number.isFinite(Date.parse(c.createdAt))?new Date(c.createdAt).toISOString():new Date().toISOString();return {input,createdAt:date};}catch(e){throw Error(`第 ${i+1} 条案例无法导入：${e.message}`);}});
  }
  function mergeCases(existing,incoming,idFactory){
    const seen=new Set(existing.map(c=>caseKey(c.input))),added=[];
    for(const c of incoming){const key=caseKey(c.input);if(!seen.has(key)){seen.add(key);added.push({...c,id:idFactory()});}}
    if(existing.length+added.length>500)throw Error('合并后超过 500 条，请先导出备份或整理案例。');
    return {cases:[...added,...existing],added:added.length,duplicates:incoming.length-added.length};
  }
  function readQuiz(text,max){try{const p=JSON.parse(text);if(p?.version===1&&Number.isInteger(p.nextIndex)&&p.nextIndex>=0&&p.nextIndex<=max&&Number.isInteger(p.correct)&&p.correct>=0&&p.correct<=p.nextIndex)return p;}catch{}return {version:1,nextIndex:0,correct:0};}
  const api={normaliseInput,caseKey,parseBackup,mergeCases,readQuiz};if(typeof module!=='undefined')module.exports=api;root.MobileKit=api;
})(typeof globalThis!=='undefined'?globalThis:this);
