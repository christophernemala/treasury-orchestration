export type Role = 'admin' | 'treasury';
export type TransactionStatus = 'unmatched' | 'suggested' | 'matched' | 'exception';
export interface User { id:string; email:string; name:string; role:Role; passwordHash:string; onboarded:boolean }
export interface Transaction { id:string; date:string; valueDate:string; description:string; amount:number; currency:string; account:string; reference:string; status:TransactionStatus; counterparty:string; category:string; statementId:string; matchedJournalId?:string; notes?:string; createdAt:string }
export interface Statement { id:string; bank:string; account:string; period:string; currency:string; openingBalance:number; closingBalance:number; status:'received'|'review'|'reconciled'; transactionCount:number }
export interface UnappliedCash { id:string; transactionId:string; payer:string; amount:number; currency:string; receivedDate:string; ageDays:number; reason:string; status:'open'|'investigating'|'applied'; owner:string }
export interface Journal { id:string; date:string; account:string; description:string; amount:number; currency:string; reference:string }
export interface AuditEvent { id:string; at:string; actor:string; action:string; entity:string; detail:string }
export interface AgentTask { id:string; name:string; status:'idle'|'running'|'attention'|'complete'; lastRun:string; nextRun:string; detail:string; progress:number }
export interface StoreState { users:User[]; transactions:Transaction[]; statements:Statement[]; unapplied:UnappliedCash[]; journals:Journal[]; audit:AuditEvent[]; agentTasks:AgentTask[] }
