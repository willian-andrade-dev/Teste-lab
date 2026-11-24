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
class Book {constructor(data={}){this.sheets=Object.fromEntries(Object.entries(data).map(([k,v])=>[k,new Sheet(v)]));}getSheetByName(n){return this.sheets[n]||null;}insertSheet(n){return this.sheets[n]=new Sheet();}setActiveSheet(sh){this.activeSheet=sh;}moveActiveSheet(index){this.activePosition=index;}}
const control=new Book({Usuarios:[headers.Usuarios,['user@corp.example','Oficial','CO','CO30;CO20','ADMINISTRADOR','ATIVO','es']],Paises:[headers.Paises,['CO','Colombia','co','America/Bogota','es','ATIVO'],['BR','Brasil','br','America/Sao_Paulo','pt','ATIVO']],Unidades:[headers.Unidades,['CO30','CO','Bodega CO30','Palmira','ATIVO'],['CO20','CO','Bodega CO20','Cali','ATIVO'],['BR-JAGUARE','BR','Jaguaré','SP','ATIVO']]});
const books={control,co:new Book(),br:new Book()};let opens=[];
const props={DOMINIOS_PERMITIDOS:'corp.example',PLANILHA_CONTROLE_ID:'control',ADMIN_INICIAL_EMAIL:'user@corp.example'};
const userStores={};function userProps(){const data=userStores[email]||(userStores[email]={});return {getProperty:k=>data[k]??null,setProperty(k,v){data[k]=v;return this;},deleteProperty(k){delete data[k];return this;}};}
const sandbox={Session:{getActiveUser:()=>({getEmail:()=>email})},PropertiesService:{getUserProperties:userProps,getScriptProperties:()=>({getProperty:k=>props[k]})},SpreadsheetApp:{openById:id=>{opens.push(id);if(!books[id])throw Error('NO_SHEET');return books[id];},flush(){}},LockService:{getScriptLock:()=>({waitLock(){assert(!lockHeld);lockHeld=true;},releaseLock(){lockHeld=false;}})},Utilities:{getUuid:()=>`trip-${++uuid}`,base64Encode:a=>Buffer.from(a).toString('base64'),computeDigest:(_,s)=>crypto.createHash('sha256').update(s).digest(),DigestAlgorithm:{SHA_256:'sha'},Charset:{UTF_8:'utf8'},formatDate(d,tz,format){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(d).map(p=>[p.type,p.value]));return format==='yyyy-MM-dd'?`${parts.year}-${parts.month}-${parts.day}`:`${parts.hour}:${parts.minute}:${parts.second}`;}}};
require('./apoio/formatacao.cjs')(Sheet,sandbox.SpreadsheetApp);
require('./apoio/drive.cjs')(sandbox);
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(base,'Code.gs'),'utf8')+'\n'+fs.readFileSync(path.join(base,'Chegada.gs'),'utf8')+'\n'+fs.readFileSync(path.join(base,'Operacao.gs'),'utf8')+'\n'+fs.readFileSync(path.join(base,'FotosDrive.gs'),'utf8')+'\n'+fs.readFileSync(path.join(base,'Patio.gs'),'utf8')+'\n'+fs.readFileSync(path.join(base,'Cancelamentos.gs'),'utf8')+'\n'+fs.readFileSync(path.join(base,'Colombia.gs'),'utf8')+'\n'+fs.readFileSync(path.join(base,'ControleCO.gs'),'utf8'),sandbox);
sandbox.obterSessaoBackend();
const tests=[];function test(n,f){f();assert(!lockHeld);sandbox.obterSessaoBackend();tests.push('PASS '+n);}const blocked=(f,code)=>assert.throws(f,new RegExp(code));
function payload(extra={}){return{unidade:'CO30',solicitacao:'request-00000001',finalidade:'CARGA_NACIONAL',documento:'1234567890',motorista:'Conductor',telefone:'+57 3001234567',empresa:'Transporte teste',placa1:'ABC123',placa2:'R12345',seguridadeSocial:'SIM',infracao:'NAO',ordemCarga:'OC-001',observacao:'Teste',...extra};}
const coRows=()=>books.co.getSheetByName('Chegadas_v2').rows;
const user=control.getSheetByName('Usuarios').rows[1];
test('País deve ser preparado antes de usar chegada',()=>blocked(()=>sandbox.obterConfiguracaoChegadaBackend('CO30'),'OPERACAO_NAO_PREPARADA'));
test('Preparação não altera dados legados',()=>{books.co.sheets.Registros=new Sheet([['LEGADO'],['preservar']]);sandbox.prepararOperacao();assert.equal(books.co.sheets.Registros.rows[1][0],'preservar');});
test('Preparação idempotente',()=>{sandbox.prepararOperacao();assert.equal(coRows().length,1);});
books.co.sheets.Transportadoras_v2.rows.push(['Transporte teste','ATIVO']);books.co.sheets.Produtos_v2.rows.push(['P001','Produto teste','ATIVO']);
test('Colômbia recebe oito finalidades e catálogos',()=>{const c=sandbox.obterConfiguracaoChegadaBackend('CO30');assert.equal(Object.keys(c.finalidades).length,8);assert.equal(c.produtos[0].codigo,'P001');});
test('Unidade de outro país bloqueada',()=>blocked(()=>sandbox.obterConfiguracaoChegadaBackend('BR-JAGUARE'),'ACESSO_NEGADO'));
test('Obrigatórios validados no servidor',()=>blocked(()=>sandbox.registrarChegadaBackend(payload({motorista:''})),'CAMPO_OBRIGATORIO'));
test('Transportadora fora do cadastro bloqueada',()=>blocked(()=>sandbox.registrarChegadaBackend(payload({empresa:'Inventada'})),'TRANSPORTADORA_INVALIDA'));
test('Finalidade de outro país bloqueada',()=>blocked(()=>sandbox.registrarChegadaBackend(payload({finalidade:'COLETA'})),'FINALIDADE_INVALIDA'));
test('Gravação usa país, e-mail e horário do servidor',()=>{const r=sandbox.registrarChegadaBackend(payload({pais:'BR',email:'fake',timezone:'Pacific/Auckland'}));assert.equal(r.status,'AGUARDANDO_ENTRADA');const row=coRows()[1];assert.equal(row[3],'CO');assert.equal(row[9],'America/Bogota');assert.equal(row[10],'user@corp.example');assert.match(row[6],/^\d{4}-\d{2}-\d{2}T/);assert.equal(books.br.getSheetByName('Chegadas_v2'),null);});
test('Repetir solicitação não duplica linha',()=>{const r=sandbox.registrarChegadaBackend(payload());assert.equal(r.repetida,true);assert.equal(coRows().length,2);});
test('Mesmo identificador com outros dados é bloqueado',()=>blocked(()=>sandbox.registrarChegadaBackend(payload({motorista:'Outro'})),'SOLICITACAO_CONFLITANTE'));
test('Nova solicitação com motorista ativo é bloqueada',()=>blocked(()=>sandbox.registrarChegadaBackend(payload({solicitacao:'request-00000002'})),'CHEGADA_ATIVA_EXISTENTE'));
test('Placa ativa não pode reaparecer em outra unidade do país',()=>blocked(()=>sandbox.registrarChegadaBackend(payload({unidade:'CO20',documento:'9876543210',solicitacao:'request-00000003'})),'CHEGADA_ATIVA_EXISTENTE'));
test('Lista de outra unidade não vaza registros',()=>assert.equal(sandbox.listarChegadasBackend('CO20').length,0));
test('Histórico por documento e placa encontra observação',()=>{assert.equal(sandbox.buscarHistoricoChegadaBackend('CO30',{documento:'1234567890'})[0].observacao,'Teste');assert.equal(sandbox.buscarHistoricoChegadaBackend('CO30',{placa:'ABC123'}).length,1);assert.equal(sandbox.buscarHistoricoChegadaBackend('CO20',{placa:'ABC123'}).length,0);});
test('Consulta sem filtro é bloqueada',()=>blocked(()=>sandbox.buscarHistoricoChegadaBackend('CO30',{}),'FILTRO_OBRIGATORIO'));
test('Novo login aplica bloqueio e invalida sessão anterior',()=>{user[5]='INATIVO';blocked(()=>sandbox.obterSessaoBackend(),'ACESSO_NEGADO');blocked(()=>sandbox.registrarChegadaBackend(payload()),'SESSAO_EXPIRADA');user[5]='ATIVO';});
test('Segurança não pode preparar estrutura',()=>{user[4]='SEGURANCA';sandbox.obterSessaoBackend();blocked(()=>sandbox.prepararOperacao(),'ACESSO_NEGADO');user[4]='ADMINISTRADOR';sandbox.obterSessaoBackend();});
test('Contêiner correto passa; dígito errado é rejeitado',()=>{assert.equal(sandbox.containerChegada_('CSQU3054383'),'CSQU3054383');blocked(()=>sandbox.containerChegada_('CSQU3054384'),'CONTAINER_INVALIDO');});
const exp=payload({finalidade:'EXPORTACAO',container:'CSQU3054383',containerConfirmado:true,lacreEntrada:'L-001',comodato:'COM-1',produtos:['P001'],destino:'Cartagena'});
test('Exportação exige confirmação física',()=>blocked(()=>sandbox.registrarChegadaBackend({...exp,containerConfirmado:false}),'CONTAINER_NAO_CONFIRMADO'));
test('Produto inexistente bloqueado',()=>blocked(()=>sandbox.registrarChegadaBackend({...exp,produtos:['INVALIDO']}),'PRODUTO_INVALIDO'));
test('Lista de faturas preserva todos os valores',()=>{coRows()[1][5]='CONCLUIDO';const r=sandbox.registrarChegadaBackend(payload({finalidade:'RECICLAGEM',faturas:['NF-1','NF-2'],solicitacao:'request-00000004'}));assert(r.id);assert.deepEqual(JSON.parse(coRows()[2][23]),['NF-1','NF-2']);});
test('Lista com valores duplicados é rejeitada',()=>blocked(()=>sandbox.registrarChegadaBackend(payload({finalidade:'RECICLAGEM',faturas:['NF-1','NF-1']})),'ITENS_DUPLICADOS'));
test('Infração gera pendência de avaliação',()=>{coRows()[2][5]='CONCLUIDO';const r=sandbox.registrarChegadaBackend(payload({infracao:'SIM',solicitacao:'request-00000005'}));assert.equal(r.status,'PENDENTE_AVALIACAO');});
test('Seguridade não vigente gera pendência',()=>{coRows()[3][5]='CONCLUIDO';const r=sandbox.registrarChegadaBackend(payload({seguridadeSocial:'NAO',solicitacao:'request-00000006'}));assert.equal(r.status,'PENDENTE_AVALIACAO');});
test('Outra entrega permite empresa livre sem catálogo',()=>{coRows()[4][5]='CONCLUIDO';const r=sandbox.registrarChegadaBackend(payload({finalidade:'OUTRA',empresa:'Empresa livre',solicitacao:'request-00000007'}));assert.equal(r.empresa,'Empresa livre');});
test('Todas as oito finalidades aceitam seus campos específicos',()=>{
 const scenarios={CARGA_NACIONAL:{ordemCarga:'OC-X'},RECICLAGEM:{faturas:['NF1','NF2']},EXPORTACAO:{ordemCarga:'OC-X',container:'CSQU3054383',containerConfirmado:true,lacreEntrada:'L1',comodato:'C1',produtos:['P001'],destino:'Cartagena'},ENTRE_BODEGAS:{remitos:['R1','R2'],origem:'CO20'},DEVOLUCOES:{origem:'CO20',faturas:['NF1'],lacres:['L1','L2']},MATERIA_PRIMA:{faturas:['NF1'],lacres:['L1'],areaDestino:'Produccion',produtos:['P001']},IMPORTACAO:{faturas:['NF1'],lacres:['L1'],statusAduaneiro:'NACIONALIZADO',produtos:['P001']},OUTRA:{empresa:'Persona particular'}};
 let i=10;
 for(const [finalidade,fields] of Object.entries(scenarios)){
  coRows().slice(1).forEach(row=>row[5]='CONCLUIDO');
  const r=sandbox.registrarChegadaBackend(payload({...fields,finalidade,solicitacao:'request-scenario-'+(i++)}));
  assert.equal(r.finalidade,finalidade);
 }
});
test('Payload excessivo não grava dados parciais',()=>{const before=coRows().length;blocked(()=>sandbox.registrarChegadaBackend(payload({observacao:'x'.repeat(2001)})),'CAMPO_INVALIDO:observacao');assert.equal(coRows().length,before);});
test('Não compartilha planilha operacional entre países',()=>{control.sheets.Paises.rows[2][2]='co';blocked(()=>sandbox.obterSessaoBackend(),'PLANILHA_COMPARTILHADA');control.sheets.Paises.rows[2][2]='br';});
test('Não grava na própria planilha de controle',()=>{control.sheets.Paises.rows[1][2]='control';blocked(()=>sandbox.obterSessaoBackend(),'PLANILHA_OPERACIONAL_INVALIDA');control.sheets.Paises.rows[1][2]='co';});
test('Brasil usa CPF e finalidades brasileiras',()=>{user[2]='BR';user[3]='BR-JAGUARE';sandbox.prepararOperacao();books.br.sheets.Transportadoras_v2.rows.push(['Transporte teste','ATIVO']);assert.equal(Object.keys(sandbox.obterConfiguracaoChegadaBackend('BR-JAGUARE').finalidades).length,5);blocked(()=>sandbox.registrarChegadaBackend(payload({unidade:'BR-JAGUARE',finalidade:'COLETA',faturas:['NF1']})),'DOCUMENTO_INVALIDO');const r=sandbox.registrarChegadaBackend(payload({unidade:'BR-JAGUARE',finalidade:'COLETA',documento:'529.982.247-25',placa1:'ABC1D23',placa2:'',faturas:['NF1']}));assert(r.id);assert.equal(books.br.sheets.Chegadas_v2.rows[1][3],'BR');user[2]='CO';user[3]='CO30;CO20';});
test('Neutraliza fórmulas sem executar conteúdo do usuário',()=>{assert.equal(sandbox.celulaTexto_('=IMPORTXML("x")'),'\'=IMPORTXML("x")');assert.equal(sandbox.celulaTexto_('+57 3001234567'),"'+57 3001234567");});
test('Cabeçalhos divergentes não são sobrescritos',()=>{books.co.sheets.Chegadas_v2.rows[0][0]='ERRADO';blocked(()=>sandbox.prepararOperacao(),'CABECALHOS_INVALIDOS');assert.equal(coRows()[0][0],'ERRADO');});
console.log(tests.join('\n'));console.log(`${tests.length} testes de chegada aprovados.`);
fs.writeFileSync(path.join(base,'VALIDACAO-CHEGADA.txt'),tests.join('\n')+`\n\n${tests.length} testes com serviços Google simulados aprovados.\nNão houve acesso a planilhas reais.\n`);
