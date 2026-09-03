import { randomUUID } from 'node:crypto';
import { createSeedState } from '../seed.js';
import { StoreState, Transaction, UnappliedCash } from '../models.js';

export class MemoryStore {
  state:StoreState=createSeedState();
  reset(){this.state=createSeedState();return this.state}
  audit(actor:string,action:string,entity:string,detail:string){this.state.audit.unshift({id:randomUUID(),at:new Date().toISOString(),actor,action,entity,detail})}
  addTransaction(input:Omit<Transaction,'id'|'createdAt'>){const tx={...input,id:randomUUID(),createdAt:new Date().toISOString()};this.state.transactions.unshift(tx);return tx}
  updateTransaction(id:string,patch:Partial<Transaction>){const tx=this.state.transactions.find(t=>t.id===id);if(!tx)return null;Object.assign(tx,patch,{id:tx.id});return tx}
  deleteTransaction(id:string){const i=this.state.transactions.findIndex(t=>t.id===id);if(i<0)return false;this.state.transactions.splice(i,1);return true}
  addUnapplied(input:Omit<UnappliedCash,'id'>){const item={...input,id:randomUUID()};this.state.unapplied.unshift(item);return item}
}
export const store=new MemoryStore();
