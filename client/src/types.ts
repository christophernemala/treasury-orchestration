export type TxStatus='matched'|'suggested'|'unmatched'|'exception';
export interface Transaction {id:string;date:string;valueDate:string;description:string;amount:number;currency:string;account:string;reference:string;status:TxStatus;counterparty:string;category:string;notes?:string;matchedJournalId?:string}
export type ConnectionStatus='connecting'|'connected'|'reconnecting'|'offline';
export interface TreasurySnapshot {reconciliation:{total:number;matched:number;suggested:number;unmatched:number;exception:number;matchRate:number};balances:{account:string;currency:string;balance:number}[];generatedAt:string;dataMode:string}
export interface DashboardData extends TreasurySnapshot {unapplied:{count:number;total:number};statements:any[];agentTasks:any[];audit:any[]}
