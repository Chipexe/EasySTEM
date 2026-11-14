// Local UI test only. Never used by npm run dev; no real key or external API calls.
import {createAppServer} from '../../scripts/serve.mjs';
let attempts=0;
const server=createAppServer({apiKey:'local-ui-test-only',origin:'http://127.0.0.1:5182',fetchImpl:async(_url,options)=>{
 const input=JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);
 const inScope=!/bóng đá|ca sĩ/.test(input.question);
 if(/kiểm tra thử lại/i.test(input.question)&&attempts++===0)return new Response('{}',{status:503});
 if(/kiểm tra dừng/i.test(input.question))await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,15000);options.signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));},{once:true});});
 return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({inScope,answer:'[KIỂM THỬ GIAO DIỆN — không phải Gemini thật]\nKiểm tra **LED tại J1** có điện trở.\n```cpp\ndigitalWrite(10, HIGH);\n```\nMình chưa đo mạch thật. <img src=x onerror=alert(1)>'})}]}}]}));
}});
server.listen(5182,'127.0.0.1',()=>console.log('UI fixture (mock Gemini): http://127.0.0.1:5182/#/editor'));
