import bcrypt from 'bcryptjs';
import { StoreState } from './models.js';
const now=()=>new Date().toISOString();
export function createSeedState():StoreState {
  const passwordHash=bcrypt.hashSync('Treasury123!',10);
  return {
    users:[{id:'usr-admin',email:'admin@treasury.demo',name:'Amina Rahman',role:'admin',passwordHash,onboarded:true},{id:'usr-treasury',email:'analyst@treasury.demo',name:'Omar Nasser',role:'treasury',passwordHash,onboarded:true}],
    statements:[
      {id:'stm-001',bank:'Emirates NBD',account:'Operating • 4921',period:'Aug 2026',currency:'AED',openingBalance:10850000,closingBalance:12642750,status:'review',transactionCount:4},
      {id:'stm-002',bank:'HSBC UAE',account:'Collections • 1840',period:'Aug 2026',currency:'USD',openingBalance:1850000,closingBalance:2015500,status:'received',transactionCount:3}
    ],
    transactions:[
      {id:'tx-001',date:'2026-08-29',valueDate:'2026-08-29',description:'Customer settlement - Gulf Retail',amount:2350000,currency:'AED',account:'Operating • 4921',reference:'GR-88912',status:'suggested',counterparty:'Gulf Retail LLC',category:'Receipts',statementId:'stm-001',createdAt:now()},
      {id:'tx-002',date:'2026-08-29',valueDate:'2026-08-30',description:'Payroll funding - UAE entities',amount:-1420000,currency:'AED',account:'Operating • 4921',reference:'PAY-0831',status:'matched',counterparty:'Internal Payroll',category:'Payroll',statementId:'stm-001',matchedJournalId:'jr-002',createdAt:now()},
      {id:'tx-003',date:'2026-08-30',valueDate:'2026-08-30',description:'Unidentified incoming transfer',amount:185000,currency:'AED',account:'Operating • 4921',reference:'FT-884104',status:'unmatched',counterparty:'Unknown',category:'Unapplied cash',statementId:'stm-001',createdAt:now()},
      {id:'tx-004',date:'2026-08-31',valueDate:'2026-08-31',description:'Bank charges and fees',amount:-72250,currency:'AED',account:'Operating • 4921',reference:'FEE-AUG',status:'exception',counterparty:'Emirates NBD',category:'Bank fees',statementId:'stm-001',notes:'Variance against expected fee schedule',createdAt:now()},
      {id:'tx-005',date:'2026-08-28',valueDate:'2026-08-28',description:'International customer receipt',amount:380000,currency:'USD',account:'Collections • 1840',reference:'WIRE-4402',status:'suggested',counterparty:'Atlas Distribution',category:'Receipts',statementId:'stm-002',createdAt:now()},
      {id:'tx-006',date:'2026-08-30',valueDate:'2026-08-30',description:'FX settlement',amount:-214500,currency:'USD',account:'Collections • 1840',reference:'FX-22819',status:'unmatched',counterparty:'Treasury FX Desk',category:'FX',statementId:'stm-002',createdAt:now()},
      {id:'tx-007',date:'2026-08-31',valueDate:'2026-08-31',description:'Interest credit',amount:112000,currency:'USD',account:'Collections • 1840',reference:'INT-AUG',status:'matched',counterparty:'HSBC UAE',category:'Interest',statementId:'stm-002',matchedJournalId:'jr-004',createdAt:now()}
    ],
    journals:[
      {id:'jr-001',date:'2026-08-29',account:'110100',description:'Gulf Retail settlement',amount:2350000,currency:'AED',reference:'GR-88912'},
      {id:'jr-002',date:'2026-08-30',account:'210400',description:'Payroll funding',amount:-1420000,currency:'AED',reference:'PAY-0831'},
      {id:'jr-003',date:'2026-08-28',account:'110200',description:'Atlas Distribution receipt',amount:380000,currency:'USD',reference:'WIRE-4402'},
      {id:'jr-004',date:'2026-08-31',account:'780100',description:'Interest income',amount:112000,currency:'USD',reference:'INT-AUG'}
    ],
    unapplied:[{id:'ua-001',transactionId:'tx-003',payer:'Unknown',amount:185000,currency:'AED',receivedDate:'2026-08-30',ageDays:1,reason:'Missing remittance advice',status:'investigating',owner:'Omar Nasser'}],
    audit:[{id:'aud-001',at:now(),actor:'system',action:'seed',entity:'workspace',detail:'Mock development dataset loaded'}],
    agentTasks:[
      {id:'agt-001',name:'Statement watcher',status:'complete',lastRun:'2 min ago',nextRun:'in 13 min',detail:'2 mock statements indexed',progress:100},
      {id:'agt-002',name:'Match suggestion agent',status:'attention',lastRun:'5 min ago',nextRun:'on demand',detail:'2 high-confidence suggestions ready',progress:72},
      {id:'agt-003',name:'Unapplied cash monitor',status:'running',lastRun:'now',nextRun:'continuous',detail:'1 item awaiting remittance',progress:46}
    ]
  };
}
