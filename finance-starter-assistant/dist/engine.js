(function(root){
  'use strict';
  const accounts={ar:{name:'应收账款',code:'1122',type:'资产',normal:'借',meaning:'客户还欠本公司的销售款'},ap:{name:'应付账款',code:'2202',type:'负债',normal:'贷',meaning:'本公司还欠供应商的采购款'},prepay:{name:'预付账款',code:'1123',type:'资产',normal:'借',meaning:'本公司先付给供应商、尚待结算的款项'},advance:{name:'合同负债',code:'2205',type:'负债',normal:'贷',meaning:'本公司已收客户款、尚负有履约义务'},otherAr:{name:'其他应收款',code:'1221',type:'资产',normal:'借',meaning:'本公司应收的非销售往来款'},otherAp:{name:'其他应付款',code:'2241',type:'负债',normal:'贷',meaning:'本公司应付的非采购往来款'}};
  const scenarios=[
    {id:'ap-pay',group:'采购与应付',title:'支付货款，核销应付',desc:'公司之前欠供应商货款，现在从银行付款。',key:'ap',debit:'应付账款',credit:'银行存款',delta:-1,why:'站在本公司看，是公司欠供应商钱。应付属于负债，减少记借方；银行存款减少记贷方。',cash:'资金流出',hint:'应付单 ↔ 付款单；核销金额占用原应付单未核销额。'},
    {id:'ar-receive',group:'销售与应收',title:'收到货款，核销应收',desc:'客户之前欠本公司销售款，现在汇款到公司银行账户。',key:'ar',debit:'银行存款',credit:'应收账款',delta:-1,why:'站在本公司看，是客户欠公司钱。应收属于资产，减少记贷方；银行存款增加记借方。',cash:'资金流入',hint:'应收单 ↔ 收款单；按同一客户、组织、币种匹配。'},
    {id:'ap-create',group:'采购与应付',title:'采购赊账，形成应付',desc:'货物已验收入库并满足确认条件，公司尚未支付货款。',key:'ap',debit:'库存商品',credit:'应付账款',delta:1,why:'库存商品增加记借方，同时公司对供应商的债务增加，负债增加记贷方。',cash:'不发生收付款',hint:'采购入库/应付确认 → 应付单；实际对方科目取决于物资和费用性质。'},
    {id:'ar-create',group:'销售与应收',title:'销售赊账，形成应收',desc:'公司已满足收入确认条件，客户尚未付款。',key:'ar',debit:'应收账款',credit:'主营业务收入',delta:1,why:'销售形成向客户收款的权利，应收资产增加记借方；收入增加记贷方。',cash:'不发生收付款',hint:'销售/收入确认 → 应收单；发票本身不必然等于收入确认条件满足。'},
    {id:'prepay-create',group:'预收与预付',title:'先付供应商预付款',desc:'公司先付款，供应商尚未交付，不是偿还已有应付。',key:'prepay',debit:'预付账款',credit:'银行存款',delta:1,why:'尚未取得货物，先付款形成预付资产，增加记借方；银行存款减少记贷方。',cash:'资金流出',hint:'预付款单 → 预付余额；不要仅凭“付款”就判断为应付核销。'},
    {id:'prepay-offset',group:'预收与预付',title:'用预付款抵扣应付',desc:'采购已确认应付，用之前的预付款冲抵，同一供应商。',key:'ap',debit:'应付账款',credit:'预付账款',delta:-1,second:'prepay',why:'应付负债减少记借方，预付资产减少记贷方。抵扣环节没有新的银行收付款。',cash:'无新增资金流',hint:'应付单 ↔ 预付款单；本例要求两边可核销余额均足够。'},
    {id:'advance-create',group:'预收与预付',title:'先收客户合同款',desc:'客户先付款，公司尚未履行收入准则范围内的交付义务。',key:'advance',debit:'银行存款',credit:'合同负债',delta:1,why:'收款增加银行存款，记借方；尚需向客户履约，合同负债增加记贷方。',cash:'资金流入',hint:'预收款不直接确认为收入；收入准则范围内通常使用合同负债，税额需单独考虑。'},
    {id:'advance-offset',group:'预收与预付',title:'用客户预收款抵应收',desc:'已履约并确认应收，用此前合同负债对应的客户款抵扣。',key:'ar',debit:'合同负债',credit:'应收账款',delta:-1,second:'advance',why:'本例采用先确认应收再结算的教学路径：合同负债减少记借方，应收减少记贷方。',cash:'无新增资金流',hint:'应收单 ↔ 客户预收款；也可能直接借合同负债、贷收入，须以实际确认路径为准。'},
    {id:'otherAr-create',group:'其他往来',title:'员工借款，形成其他应收',desc:'公司从银行转给员工一笔备用借款，等待归还或报销。',key:'otherAr',debit:'其他应收款',credit:'银行存款',delta:1,why:'公司取得向员工追偿的权利，其他应收款增加记借方；银行存款减少记贷方。',cash:'资金流出',hint:'员工借款单 → 其他应收；借款发放不是费用确认。'},
    {id:'otherAr-receive',group:'其他往来',title:'员工归还借款',desc:'员工把全部或部分借款汇回公司账户。',key:'otherAr',debit:'银行存款',credit:'其他应收款',delta:-1,why:'银行存款增加记借方，员工欠公司的其他应收款减少记贷方。',cash:'资金流入',hint:'借款单 ↔ 还款单；报销冲借款则需要按费用、税额和实付差额另行处理。'},
    {id:'otherAp-create',group:'其他往来',title:'收到可退还保证金',desc:'公司收取应退还给对方的保证金，不属于销售货款。',key:'otherAp',debit:'银行存款',credit:'其他应付款',delta:1,why:'公司有退还保证金的义务，其他应付款增加记贷方；收到银行款记借方。',cash:'资金流入',hint:'保证金收款 → 其他应付；先根据款项性质判断，不仅看对方是客户还是供应商。'},
    {id:'otherAp-pay',group:'其他往来',title:'退还对方保证金',desc:'公司将此前收到的可退还保证金汇回对方。',key:'otherAp',debit:'其他应付款',credit:'银行存款',delta:-1,why:'退还义务减少，其他应付款记借方；银行存款减少记贷方。',cash:'资金流出',hint:'保证金收款记录 ↔ 退款单；销售退货退款不能直接套用此场景。'},
    {id:'ap-reverse',group:'反核销',title:'撤销应付匹配，恢复未核销额',desc:'只撤销已付款与应付单的匹配关系，付款凭证仍有效。',key:'ap',delta:1,matchingOnly:true,why:'反核销首先恢复的是单据可匹配金额。若付款凭证仍在，总账不会因为取消匹配而自动恢复应付负债。',cash:'无新增资金流',hint:'校验原核销记录、反核销权限和期间；只有撤销或冲销凭证时才讨论反向分录。'},
    {id:'ar-reverse',group:'反核销',title:'撤销应收匹配，恢复未核销额',desc:'只撤销已收款与应收单的匹配关系，收款凭证仍有效。',key:'ar',delta:1,matchingOnly:true,why:'撤销匹配可以恢复应收单未核销额，同时恢复收款单可匹配额；不代表客户实际重新欠钱，也不自动产生凭证。',cash:'无新增资金流',hint:'匹配状态与总账余额分开核对；若原收款被退回，再按实际退款业务处理。'}
  ];
  function cents(value){const s=String(value).trim();if(!/^\d+(\.\d{1,2})?$/.test(s))throw Error('请输入非负金额，最多两位小数。');const [a,b='']=s.split('.');const n=Number(a)*100+Number(b.padEnd(2,'0'));if(!Number.isSafeInteger(n)||n>999999999999)throw Error('金额不能超过 9,999,999,999.99 元。');return n;}
  function evaluate(id,balance,amount,secondBalance,mode='journal'){
    const s=scenarios.find(x=>x.id===id);if(!s)throw Error('请选择有效业务场景。');
    const before=cents(balance),n=cents(amount);if(n<=0)throw Error('本次金额必须大于 0。');
    if(s.delta<0&&n>before)throw Error('本次核销金额超过未核销余额，请拆分多付款/多收款，不能直接核销为负数。');
    if(s.matchingOnly&&n>cents(secondBalance))throw Error('反核销金额不能超过原核销记录可撤销金额。');
    if(s.second&&n>cents(secondBalance))throw Error('本次抵扣金额超过预付款/客户预收款可用余额。');
    const after=before+s.delta*n;if(!Number.isSafeInteger(after)||after>999999999999)throw Error('计算后余额超过支持范围。');
    const journal=s.matchingOnly||mode==='match'?[]:[{account:s.debit,side:'借',amount:n},{account:s.credit,side:'贷',amount:n}];
    return {scenario:s,account:accounts[s.key],before,amount:n,after,secondAfter:s.second?cents(secondBalance)-n:null,journal,matchingOnly:s.matchingOnly||mode==='match'};
  }
  const api={accounts,scenarios,cents,evaluate};if(typeof module!=='undefined')module.exports=api;root.FinanceEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
