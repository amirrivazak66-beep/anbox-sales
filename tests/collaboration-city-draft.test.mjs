import test from 'node:test';
import assert from 'node:assert/strict';
import {citySamplesByProvince,citiesForProvince} from '../scripts/collaboration-city-draft.mjs';

test('province/city prototype covers 31 provinces',()=>{
 assert.equal(Object.keys(citySamplesByProvince).length,31);
 for(const [province,cities] of Object.entries(citySamplesByProvince)){
  assert.ok(province);
  assert.ok(cities.length>0);
  assert.equal(new Set(cities).size,cities.length);
 }
});
test('changing province resolves its own cities',()=>{
 assert.ok(citiesForProvince('تهران').includes('تهران'));
 assert.ok(citiesForProvince('فارس').includes('شیراز'));
 assert.ok(!citiesForProvince('فارس').includes('تهران'));
 assert.deepEqual(citiesForProvince('unknown'),[]);
});
