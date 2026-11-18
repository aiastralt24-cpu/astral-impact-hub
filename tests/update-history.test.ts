import test from 'node:test';
import assert from 'node:assert/strict';
import {filterUpdateHistory} from '../lib/domain/update-history.ts';
const updates=[
 {id:'1',projectName:'Water',vendorName:'Foundation',description:'Pond completed',happenedAt:'2026-11-06',createdAt:'2026-11-06T10:00:00Z',status:'approved'},
 {id:'2',projectName:'Water',vendorName:'Foundation',description:'test',happenedAt:'2026-11-06',createdAt:'2026-11-06T11:00:00Z',status:'rejected'},
 {id:'3',projectName:'Water',vendorName:'Foundation',description:'Survey',happenedAt:'2025-11-02',createdAt:'2025-11-02',status:'approved'},
 {id:'4',projectName:'Water',vendorName:'Foundation',description:'Repair',happenedAt:'2026-10-02',createdAt:'2026-10-02',status:'approved'}
];
const empty={query:'',year:'',month:'',day:'',includeRejected:false};
test('history hides rejected records without deleting them and sorts newest first',()=>{assert.deepEqual(filterUpdateHistory(updates,empty).map(u=>u.id),['1','4','3']);assert.equal(updates.length,4);});
test('year and month filters work together',()=>{assert.deepEqual(filterUpdateHistory(updates,{...empty,year:'2026',month:'11'}).map(u=>u.id),['1']);});
test('exact date includes rejected records only when requested',()=>{assert.deepEqual(filterUpdateHistory(updates,{...empty,day:'2026-11-06',includeRejected:true}).map(u=>u.id),['2','1']);});
test('case-insensitive text search combines with period filters',()=>{assert.equal(filterUpdateHistory(updates,{...empty,query:'POND',year:'2026'}).length,1);assert.equal(filterUpdateHistory(updates,{...empty,query:'POND',year:'2025'}).length,0);});
