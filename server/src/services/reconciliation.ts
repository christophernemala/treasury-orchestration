import { Journal, Transaction } from '../models.js';
export interface MatchSuggestion { journalId:string; score:number; reasons:string[] }
export function scoreMatch(tx:Transaction,journal:Journal):MatchSuggestion {
  let score=0;const reasons:string[]=[];
  if(tx.currency===journal.currency){score+=10;reasons.push('same currency')}
  if(Math.abs(tx.amount-journal.amount)<0.01){score+=55;reasons.push('exact amount')}
  const day=Math.abs(new Date(tx.valueDate).getTime()-new Date(journal.date).getTime())/86400000;
  if(day===0){score+=15;reasons.push('same date')}else if(day<=2){score+=8;reasons.push('date within 2 days')}
  if(tx.reference&&journal.reference&&tx.reference.toLowerCase()===journal.reference.toLowerCase()){score+=20;reasons.push('exact reference')}
  return {journalId:journal.id,score:Math.min(score,100),reasons};
}
export function suggestMatches(tx:Transaction,journals:Journal[]){return journals.map(j=>scoreMatch(tx,j)).filter(s=>s.score>=60).sort((a,b)=>b.score-a.score)}
export function reconciliationSummary(transactions:Transaction[]){const total=transactions.length,matched=transactions.filter(t=>t.status==='matched').length,suggested=transactions.filter(t=>t.status==='suggested').length,unmatched=transactions.filter(t=>t.status==='unmatched').length,exception=transactions.filter(t=>t.status==='exception').length,matchRate=total?Math.round(matched/total*100):0;return {total,matched,suggested,unmatched,exception,matchRate}}
