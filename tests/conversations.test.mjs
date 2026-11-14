import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConversations,modelHistory,serializeConversations } from '../src/pages/assistant/conversations.js';
test('restoring a pending conversation marks it interrupted and drops malformed history',()=>{
 const result=normalizeConversations({active:'one',chats:[{id:'one',title:'LED',messages:[{role:'user',text:'Help',status:'pending'},{role:'system',text:'ignore'}]},{id:'one',title:'duplicate',messages:[]}]});
 assert.equal(result.active,'one');assert.equal(result.chats.length,1);assert.equal(result.chats[0].messages.length,1);assert.equal(result.chats[0].messages[0].status,'interrupted');
 assert.deepEqual(normalizeConversations(null),{chats:[],active:null});
});
test('only completed user/assistant pairs go to Gemini, including after cancellation/retry',()=>{
 const user=(text,status='done')=>({role:'user',text,status}),answer=text=>({role:'assistant',text,status:'done'});
 const history=modelHistory([user('cancel','cancelled'),user('failed','failed'),user('question'),answer('answer'),user('pending','pending')]);
 assert.deepEqual(history,[{role:'user',text:'question'},{role:'assistant',text:'answer'}]);
 assert.equal(modelHistory(Array.from({length:20},(_,i)=>[user('q'+i),answer('a'+i)]).flat()).length,12);
});
test('legacy chat migration retains content and storage trimming preserves active chat without mutating live requests',()=>{
 assert.equal(normalizeConversations([{id:'old',title:'Old',messages:[{role:'user',text:'old question'}]}]).chats[0].messages[0].status,'done');
 const state={active:'current',chats:[{id:'current',title:'Current',messages:[{role:'user',text:'current'}]},{id:'old',title:'Old',messages:[{role:'assistant',text:'x'.repeat(750000)}]}]};
 const saved=serializeConversations(state);assert.ok(JSON.stringify(saved).length<=700000);assert.equal(saved.chats[0].id,'current');assert.equal(state.chats.length,2);assert.notEqual(state.chats[0],saved.chats[0]);
});
