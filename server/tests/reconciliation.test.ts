import { describe, expect, it } from 'vitest';
import { scoreMatch, suggestMatches } from '../src/services/reconciliation.js';

const tx:any={id:'t1',date:'2026-08-29',valueDate:'2026-08-29',description:'Receipt',amount:2350000,currency:'AED',account:'Bank',reference:'GR-88912',status:'unmatched',counterparty:'Gulf',category:'Receipt',statementId:'s1',createdAt:''};
const exact:any={id:'j1',date:'2026-08-29',account:'110100',description:'Receipt',amount:2350000,currency:'AED',reference:'GR-88912'};

describe('reconciliation scoring',()=>{
  it('scores an exact controlled match at 100',()=>expect(scoreMatch(tx,exact).score).toBe(100));
  it('rejects weak candidates from suggestions',()=>expect(suggestMatches(tx,[{...exact,id:'j2',amount:50,reference:'X'}])).toEqual([]));
});
