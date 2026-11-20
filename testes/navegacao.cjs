const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const base=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(base,'Index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\nload\(\);\s*$/,'');
function fixture(){
 const registry=new Map(),nodes=[],requests=[],timers=new Map();let time=100000,timerId=0;
 class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style={};this.attributes={};this.hidden=false;this.disabled=false;this.value='';this.open=false;this.classList={add(){},remove(){}};nodes.push(this);}
  set id(v){this._id=v;registry.set(v,this);}get id(){return this._id;}
  append(...xs){this.children.push(...xs);xs.forEach(x=>{if(x&&typeof x==='object')x.parent=this;});}
  replaceChildren(...xs){this.children=[];this.append(...xs);}
  setAttribute(k,v){this.attributes[k]=String(v);if(k==='open')this.open=true;}
  removeAttribute(k){delete this.attributes[k];if(k==='open')this.open=false;}
  getAttribute(k){return this.attributes[k]??null;}
  addEventListener(){}showModal(){this.open=true;}close(){this.open=false;}scrollIntoView(){}reset(){}
  querySelector(sel){return this.findAll().find(x=>sel==='[data-t]'&&x.dataset?.t)||null;}
  querySelectorAll(){return [];}checkValidity(){return true;}reportValidity(){}
  findAll(){return this.children.flatMap(x=>x&&typeof x==='object'?[x,...(x.findAll?.()||[])]:[]);}
 }
 for(const match of html.matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"[^>]*>/g)){const e=new Element(match[1]);e.id=match[2];}
 const document={getElementById:id=>registry.get(id)||null,createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text}),documentElement:{lang:'pt-BR'},querySelectorAll(sel){if(sel==='button')return nodes.filter(n=>n.tagName==='BUTTON');if(sel==='[data-t]')return nodes.filter(n=>n.dataset.t);if(sel==='.unit-button')return nodes.filter(n=>n.className==='unit-button');if(sel==='.signature')return nodes.filter(n=>n.className==='signature');return [];}};
 const sandbox={document,window:{scrollTo(){},addEventListener(){}},crypto:{randomUUID:()=>`fixture-request-${requests.length}`},Date:class extends Date{static now(){return time;}},setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),console};
 sandbox.google={script:{get run(){let ok,fail;const runner=new Proxy({withSuccessHandler(fn){ok=fn;return runner;},withFailureHandler(fn){fail=fn;return runner;}},{get(target,key){return target[key]||((...args)=>requests.push({method:key,args,ok,fail}));}});return runner;}}};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const run=code=>vm.runInContext(code,sandbox),get=id=>document.getElementById(id);
 run("session={email:'oficial@corp.example',idioma:'pt',expiraEm:999999999,unidades:[{codigo:'BR-JAGUARE',nome:'Jaguaré'},{codigo:'BR-IMIGRANTES',nome:'Imigrantes'}]}; unit='BR-JAGUARE';config={pais:'BR',oficial:'Oficial',tag:false};busy=false;");
 const trip={id:'trip-1',unidade:'BR-JAGUARE',status:'AGUARDANDO_ENTRADA',motorista:'Teste',placa1:'ABC1D23',empresa:'Empresa',data:'2026-11-20',hora:'10:00',oficial:'Oficial',revisao:0,retencaoMin:'',permanenciaMin:''};
 sandbox.sample=trip;
 const panel={recentes:[trip],entrada:[trip],saida:[],concluidos:[],podeAutorizar:false};
 sandbox.samplePanel=panel;
 return {sandbox,run,get,requests,timers,trip,panel,tick:ms=>time+=ms};
}
const tests=[];function test(n,fn){fn(fixture());tests.push('PASS '+n);}
test('Trinta trocas de aba com dados recentes não fazem RPC',f=>{f.run('applyPanel(samplePanel)');for(let i=0;i<30;i++)f.get('nav-'+['chegada','entrada','saida'][i%3]).onclick();assert.equal(f.requests.length,0);assert.equal(f.get('screen-saida').hidden,false);assert.equal(f.get('nav-chegada').disabled,false);});
test('Atualização atrasada não bloqueia navegação ou campos',f=>{f.run('applyPanel(samplePanel)');f.tick(16000);f.get('nav-entrada').onclick();assert.equal(f.requests.length,1);assert.equal(f.requests[0].method,'obterPainelOperacaoBackend');assert.equal(f.get('save').disabled,false);f.get('nav-saida').onclick();assert.equal(f.get('screen-saida').hidden,false);assert.equal(f.requests.length,1);});
test('Checklist pode abrir enquanto o servidor atualiza em segundo plano',f=>{f.run('applyPanel(samplePanel);refreshPanel(true);openMovement(sample,"ENTRADA")');assert.equal(f.get('movementDialog').open,true);assert.equal(f.get('nav-entrada').disabled,false);assert.equal(f.requests.length,1);});
test('Cliques repetidos em atualizar compartilham a chamada em andamento',f=>{f.run('applyPanel(samplePanel);refreshPanel(true);refreshPanel(true);refreshPanel(true)');assert.equal(f.requests.length,1);});
test('Retorno de leitura antiga não desfaz uma entrada confirmada',f=>{f.run('applyPanel(samplePanel);refreshPanel(true)');const old=f.requests[0];f.run('viewRevision++;applyTrip({...sample,status:"DENTRO_UNIDADE",revisao:1})');old.ok(f.panel);assert.equal(f.run('painel.saida[0].status'),'DENTRO_UNIDADE');assert.equal(f.run('painel.entrada.length'),0);});
test('Retorno de leitura de outra unidade é ignorado',f=>{f.run('applyPanel(samplePanel);refreshPanel(true)');const old=f.requests[0];f.run('resetPanelState(false);unit="BR-IMIGRANTES";painel={entrada:[],saida:[],concluidos:[],podeAutorizar:false};');old.ok(f.panel);assert.equal(f.run('painel.entrada.length'),0);});
test('Leitura antiga não habilita controles durante gravação',f=>{f.run('applyPanel(samplePanel);refreshPanel(true)');const old=f.requests[0];f.run('rpc("registrarMovimentoBackend",[],()=>{})');assert.equal(f.get('save').disabled,true);old.ok(f.panel);assert.equal(f.get('save').disabled,true);assert.equal(f.run('busy'),true);});
test('Gravações continuam aguardando confirmação e impedindo duplo envio',f=>{f.run('rpc("registrarChegadaBackend",[],()=>{});rpc("registrarChegadaBackend",[],()=>{})');assert.equal(f.requests.length,1);assert.equal(f.get('save').disabled,true);});
test('Resposta de erro ao atualizar preserva dados anteriores e botões',f=>{f.run('applyPanel(samplePanel);refreshPanel(true)');f.requests[0].fail(new Error('Falha temporária'));assert.equal(f.run('painel.entrada[0].id'),'trip-1');assert.equal(f.run('panelSyncCode'),'syncError');assert.equal(f.get('save').disabled,false);});
test('Confirmação da saída move registro para concluídos sem nova leitura',f=>{f.run('applyPanel({...samplePanel,entrada:[],saida:[{...sample,status:"DENTRO_UNIDADE"}]});applyTrip({...sample,status:"CONCLUIDO",revisao:2})');assert.equal(f.run('painel.saida.length'),0);assert.equal(f.run('painel.concluidos[0].id'),'trip-1');assert.equal(f.requests.length,0);});
test('Inicialização da unidade usa uma chamada para configuração e listas',f=>{f.run('unit="";selectUnit("BR-JAGUARE")');assert.equal(f.requests.length,1);assert.equal(f.requests[0].method,'obterInicializacaoUnidadeBackend');});
test('Mensagens não reconstroem listas nem seus botões',f=>{f.run('applyPanel(samplePanel)');const card=f.get('queueEntry').children[0];f.run('message("saving")');assert.equal(f.get('queueEntry').children[0],card);});
test('Sessão expirada impede atualização sem consultar o servidor',f=>{f.run('session.expiraEm=1;refreshPanel(true)');assert.equal(f.requests.length,0);assert.equal(f.run('session'),null);});
test('Registro pendente bloqueia próxima etapa sem bloquear outros registros',f=>{f.run("session.pais='BR';writeQueue={jobs:[{owner:session.email,pais:'BR',key:'a',preview:sample,dados:{id:'trip-1',unidade:unit}}]};applyPanel(samplePanel);openMovement(sample,'ENTRADA')");assert.equal(f.get('movementDialog').open,false);assert.equal(f.get('queueEntry').children[0].findAll().filter(x=>x.tagName==='BUTTON').length,0);f.run("openMovement({...sample,id:'trip-2'},'ENTRADA')");assert.equal(f.get('movementDialog').open,true);});
test('Trocar conta esconde solicitações do usuário anterior',f=>{f.run("session.pais='BR';writeQueue={jobs:[{owner:'outra@corp.example',pais:'BR',dados:{unidade:unit},preview:{}}]};renderPending()");assert.equal(f.get('pendingJobs').children.length,0);});
console.log(tests.join('\n'));console.log(`${tests.length} testes de navegação assíncrona aprovados.`);
fs.writeFileSync(path.join(base,'VALIDACAO-NAVEGACAO.txt'),tests.join('\n')+`\n\n${tests.length} testes de lógica do frontend em VM/DOM simulado.\nTrinta trocas de aba após carga inicial sem RPC.\nNão é uma medição de latência nem um teste visual no navegador real.\n`);
