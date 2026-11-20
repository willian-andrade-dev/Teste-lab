const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto'),path=require('path');
const base=path.resolve(__dirname,'..');let email='user@corp.example',lockHeld=false,uuid=0;
const headers={Usuarios:['Email','Nome','Pais','Unidades','Perfil','Status','Idioma'],Paises:['Pais','Nome','PlanilhaID','Fuso','Idioma','Status'],Unidades:['Codigo','Pais','Nome','Endereco','Status']};
class Sheet {
 constructor(rows=[]){this.rows=rows.map(r=>[...r]);}
 getLastRow(){return this.rows.length;}getLastColumn(){return Math.max(0,...this.rows.map(r=>r.length));}
 getDataRange(){return this.getRange(1,1,Math.max(1,this.rows.length),Math.max(1,this.getLastColumn()));}
 getRange(row,col,n=1,m=1){const sh=this;return{getDisplayValues(){return Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>String(sh.rows[row-1+i]?.[col-1+j]??'').replace(/^'/,'')));},getDisplayValue(){return String(sh.rows[row-1]?.[col-1]??'');},setValues(values){values.forEach((v,i)=>{if(!sh.rows[row-1+i])sh.rows[row-1+i]=[];v.forEach((x,j)=>sh.rows[row-1+i][col-1+j]=x);});return this;},clearContent(){for(let i=0;i<n;i++)for(let j=0;j<m;j++)if(sh.rows[row-1+i])sh.rows[row-1+i][col-1+j]='';while(sh.rows.length&&sh.rows.at(-1).every(x=>x===''))sh.rows.pop();return this;},setNumberFormat(){return this;},setFontWeight(){return this;}};}
 setFrozenRows(){} showSheet(){} hideSheet(){}
}
class Book {constructor(data={}){this.sheets=Object.fromEntries(Object.entries(data).map(([k,v])=>[k,new Sheet(v)]));}getSheetByName(n){return this.sheets[n]||null;}insertSheet(n){return this.sheets[n]=new Sheet();}}
const control=new Book({Usuarios:[headers.Usuarios,['user@corp.example','Oficial','CO','CO30;CO20','ADMINISTRADOR','ATIVO','es']],Paises:[headers.Paises,['CO','Colombia','co','America/Bogota','es','ATIVO'],['BR','Brasil','br','America/Sao_Paulo','pt','ATIVO']],Unidades:[headers.Unidades,['CO30','CO','Bodega CO30','Palmira','ATIVO'],['CO20','CO','Bodega CO20','Cali','ATIVO'],['BR-JAGUARE','BR','Jaguaré','SP','ATIVO']]});
const books={control,co:new Book(),br:new Book()};let opens=[];
const props={DOMINIOS_PERMITIDOS:'corp.example',PLANILHA_CONTROLE_ID:'control',ADMIN_INICIAL_EMAIL:'user@corp.example'};
const userStores={};function userProps(){const data=userStores[email]||(userStores[email]={});return {getProperty:k=>data[k]??null,setProperty(k,v){data[k]=v;return this;},deleteProperty(k){delete data[k];return this;}};}
const sandbox={Session:{getActiveUser:()=>({getEmail:()=>email})},PropertiesService:{getUserProperties:userProps,getScriptProperties:()=>({getProperty:k=>props[k]})},SpreadsheetApp:{openById:id=>{opens.push(id);if(!books[id])throw Error('NO_SHEET');return books[id];},flush(){}},LockService:{getScriptLock:()=>({waitLock(){assert(!lockHeld);lockHeld=true;},releaseLock(){lockHeld=false;}})},Utilities:{getUuid:()=>`trip-${++uuid}`,base64Encode:a=>Buffer.from(a).toString('base64'),computeDigest:(_,s)=>crypto.createHash('sha256').update(s).digest(),DigestAlgorithm:{SHA_256:'sha'},Charset:{UTF_8:'utf8'},formatDate(d,tz,format){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(d).map(p=>[p.type,p.value]));return format==='yyyy-MM-dd'?`${parts.year}-${parts.month}-${parts.day}`:`${parts.hour}:${parts.minute}:${parts.second}`;}}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(base,'Code.gs'),'utf8')+'\n'+fs.readFileSync(path.join(base,'Chegada.gs'),'utf8')+'\n'+fs.readFileSync(path.join(base,'Operacao.gs'),'utf8'),sandbox);
const tests=[];const blocked=(f,code)=>assert.throws(f,new RegExp(code));
function payload(extra={}){return{unidade:'CO30',solicitacao:'request-00000001',finalidade:'CARGA_NACIONAL',documento:'1234567890',motorista:'Conductor',telefone:'+57 3001234567',empresa:'Transporte teste',placa1:'ABC123',placa2:'R12345',seguridadeSocial:'SIM',infracao:'NAO',ordemCarga:'OC-001',observacao:'Teste',...extra};}
const coRows=()=>books.co.getSheetByName('Chegadas_v2').rows;
const user=control.getSheetByName('Usuarios').rows[1];
let clock='2026-11-20T12:00:00Z';const RealDate=Date;sandbox.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[clock]));}static now(){return new RealDate(clock).getTime();}};
const baseline=[...user];
function reset(){email='user@corp.example';clock='2026-11-20T12:00:00Z';user.splice(0,user.length,...baseline);for(const k of Object.keys(userStores))delete userStores[k];books.co=new Book();books.br=new Book();opens.length=0;}
const live=()=>sandbox.obterSessaoBackend();
function test(n,f){reset();f();assert(!lockHeld);tests.push('PASS '+n);}
const controlOpens=()=>opens.filter(x=>x==='control').length;
test('Operação sem login falha sem consultar cadastro',()=>{blocked(()=>sandbox.contextoUnidade_('CO30'),'SESSAO_EXPIRADA');assert.equal(controlOpens(),0);});
test('Login faz validação completa e devolve vencimento de quatro horas',()=>{const r=live();assert.equal(r.expiraEm,Date.parse(clock)+4*60*60*1000);assert.equal(controlOpens(),3);});
test('Cinquenta verificações de unidade não abrem planilha de controle',()=>{live();opens.length=0;for(let i=0;i<50;i++)sandbox.contextoUnidade_('CO30');assert.equal(controlOpens(),0);});
test('Navegação, listas e histórico não revalidam cadastro',()=>{sandbox.prepararOperacao();opens.length=0;sandbox.obterConfiguracaoChegadaBackend('CO30');sandbox.listarChegadasBackend('CO30');sandbox.obterPainelOperacaoBackend('CO30');sandbox.buscarHistoricoChegadaBackend('CO30',{documento:'1234567890'});assert.equal(controlOpens(),0);});
test('Bloqueio de usuário aguarda próximo login',()=>{live();user[5]='INATIVO';opens.length=0;assert(sandbox.contextoUnidade_('CO30'));assert.equal(controlOpens(),0);blocked(()=>live(),'ACESSO_NEGADO');blocked(()=>sandbox.contextoUnidade_('CO30'),'SESSAO_EXPIRADA');});
test('Sessão ainda vale um milissegundo antes de quatro horas',()=>{live();clock='2026-11-20T15:59:59.999Z';assert(sandbox.contextoUnidade_('CO30'));});
test('Sessão vence exatamente em quatro horas sem revalidar cadastro',()=>{live();opens.length=0;clock='2026-11-20T16:00:00Z';blocked(()=>sandbox.contextoUnidade_('CO30'),'SESSAO_EXPIRADA');assert.equal(controlOpens(),0);});
test('Atividade não prolonga sessão automaticamente',()=>{const r=live();clock='2026-11-20T15:00:00Z';assert.equal(sandbox.contexto_().expiraEm,r.expiraEm);clock='2026-11-20T16:00:00Z';blocked(()=>sandbox.contexto_(),'SESSAO_EXPIRADA');});
test('Novo login renova prazo após validar o cadastro',()=>{live();clock='2026-11-20T15:00:00Z';const r=live();assert.equal(r.expiraEm,Date.parse(clock)+4*60*60*1000);});
test('Perfil e país não podem ser trocados por payload no navegador',()=>{live();const c=sandbox.contextoUnidade_('CO30',{perfil:'ADMINISTRADOR',pais:'BR'});assert.equal(c.contexto.pais.Pais,'CO');blocked(()=>sandbox.contextoUnidade_('BR-JAGUARE'),'ACESSO_NEGADO');});
test('Mudança de perfil no cadastro só vale no próximo login',()=>{live();user[4]='SEGURANCA';assert.equal(sandbox.contexto_().usuario.Perfil,'ADMINISTRADOR');live();assert.equal(sandbox.contexto_().usuario.Perfil,'SEGURANCA');});
test('Sessão de uma conta não é aceita por outra',()=>{live();email='other@corp.example';blocked(()=>sandbox.contexto_(),'SESSAO_EXPIRADA');});
test('Sessão corrompida é descartada sem abrir planilhas',()=>{live();userProps().setProperty('LOGISTICA_SESSAO_V04','{bad json');opens.length=0;blocked(()=>sandbox.contexto_(),'SESSAO_EXPIRADA');assert.equal(controlOpens(),0);});
test('Ciclo completo BR grava sem consultar o controle após login',()=>{
 user[2]='BR';user[3]='BR-JAGUARE';sandbox.prepararOperacao();books.br.sheets.Transportadoras_v2.rows.push(['Transporte teste','ATIVO']);opens.length=0;
 const r=sandbox.registrarChegadaBackend(payload({unidade:'BR-JAGUARE',finalidade:'COLETA',documento:'52998224725',placa1:'ABC1D23',placa2:'',faturas:[]}));
 const checklist=Object.fromEntries(['mecanica','fluidos','pneus','estrutura','luzes','espelhos','interior','cobertura','outros'].map(k=>[k,{estado:'CONFORME',causa:''}]));
 sandbox.registrarMovimentoBackend({unidade:'BR-JAGUARE',id:r.id,acao:'ENTRADA',solicitacao:'session-entry-0001',revisao:0,checklist,calco:'PROPRIO',divergencia:''});
 const out=Object.fromEntries(['veiculo','carga','lacres'].map(k=>[k,{estado:'CONFORME',causa:''}]));
 sandbox.registrarMovimentoBackend({unidade:'BR-JAGUARE',id:r.id,acao:'SAIDA',carregado:'NAO',solicitacao:'session-exit-00001',revisao:1,checklist:out,destino:'Cliente',faturas:[],lacres:[]});
 assert.equal(sandbox.obterPainelOperacaoBackend('BR-JAGUARE').concluidos[0].status,'CONCLUIDO');assert.equal(controlOpens(),0);
});
console.log(tests.join('\n'));console.log(`${tests.length} testes de sessão aprovados.`);
fs.writeFileSync(path.join(base,'VALIDACAO-SESSAO.txt'),tests.join('\n')+`\n\n${tests.length} testes com serviços simulados aprovados.\nCinquenta conferências de unidade e um ciclo completo de chegada/entrada/saída sem abrir a planilha de controle após o login.\nSem medição de latência na implantação real.\n`);
