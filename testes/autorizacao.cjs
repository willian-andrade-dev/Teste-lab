const fs=require('fs'),vm=require('vm'),assert=require('assert');
const base=require('path').resolve(__dirname,'..')+'/';
let email='user@corp.example', props={DOMINIOS_PERMITIDOS:'corp.example',PLANILHA_CONTROLE_ID:'control'},opens=[];
const data={Usuarios:[['Email','Nome','Pais','Unidades','Perfil','Status','Idioma'],['user@corp.example','Pessoa','CO','CO30','SEGURANCA','ATIVO','es']],Paises:[['Pais','Nome','PlanilhaID','Fuso','Idioma','Status'],['CO','Colombia','colombia-sheet','America/Bogota','es','ATIVO'],['BR','Brasil','brasil-sheet','America/Sao_Paulo','pt','ATIVO']],Unidades:[['Codigo','Pais','Nome','Endereco','Status'],['CO30','CO','Bodega CO30','Palmira','ATIVO'],['BR1','BR','Brasil','SP','ATIVO']]};
const userStores={};function userProps(){const data=userStores[email]||(userStores[email]={});return {getProperty:k=>data[k]??null,setProperty(k,v){data[k]=v;return this;},deleteProperty(k){delete data[k];return this;}};}
const sandbox={Session:{getActiveUser:()=>({getEmail:()=>email})},PropertiesService:{getUserProperties:userProps,getScriptProperties:()=>({getProperty:k=>props[k]})},SpreadsheetApp:{openById:id=>{opens.push(id);return{getSheetByName:name=>({getDataRange:()=>({getDisplayValues:()=>data[name]})})};}}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(base+'Code.gs','utf8'),sandbox);
const results=[];function test(name,fn){fn();sandbox.obterSessaoBackend();results.push('PASS '+name);}
function blocked(fn,code='ACESSO_NEGADO'){assert.throws(fn,new RegExp(code));}
test('Conta ativa recebe apenas unidade cadastrada',()=>assert.equal(sandbox.obterSessaoBackend().unidades[0].codigo,'CO30'));
test('Resposta não expõe ID da planilha',()=>assert(!JSON.stringify(sandbox.obterSessaoBackend()).includes('colombia-sheet')));
test('Seleção válida habilita módulo de chegada',()=>assert.equal(sandbox.selecionarUnidadeBackend('CO30').operacional,true));
test('Unidade de outro país bloqueada',()=>blocked(()=>sandbox.selecionarUnidadeBackend('BR1')));
test('Planilha operacional resolvida no servidor',()=>{sandbox.planilhaOperacional_('CO30');assert.equal(opens.at(-1),'colombia-sheet');});
test('Perfil de segurança não pode aprovar',()=>blocked(()=>sandbox.exigirPerfil_('CO30',['GERENTE','ADMINISTRADOR'])));
test('Bloqueio passa a valer no próximo login',()=>{data.Usuarios[1][5]='INATIVO';assert(sandbox.selecionarUnidadeBackend('CO30'));blocked(()=>sandbox.obterSessaoBackend());data.Usuarios[1][5]='ATIVO';});
test('E-mail desconhecido bloqueado',()=>{email='unknown@corp.example';blocked(()=>sandbox.obterSessaoBackend());email='user@corp.example';});
test('Identidade vazia bloqueada',()=>{email='';blocked(()=>sandbox.obterSessaoBackend(),'IDENTIDADE_INDISPONIVEL');email='user@corp.example';});
test('Domínio parecido não é aceito',()=>{email='user@corp.example.evil';blocked(()=>sandbox.obterSessaoBackend());email='user@corp.example';});
test('E-mail duplicado bloqueado',()=>{data.Usuarios.push([...data.Usuarios[1]]);blocked(()=>sandbox.obterSessaoBackend());data.Usuarios.pop();});
test('Cadastro não permite unidade de outro país',()=>{data.Usuarios[1][3]='BR1';blocked(()=>sandbox.obterSessaoBackend());data.Usuarios[1][3]='CO30';});
test('País inativo bloqueado',()=>{data.Paises[1][5]='INATIVO';blocked(()=>sandbox.obterSessaoBackend());data.Paises[1][5]='ATIVO';});
test('Unidade inativa bloqueada',()=>{data.Unidades[1][4]='INATIVO';blocked(()=>sandbox.obterSessaoBackend());data.Unidades[1][4]='ATIVO';});
test('Perfil arbitrário bloqueado',()=>{data.Usuarios[1][4]='SUPERUSER';blocked(()=>sandbox.obterSessaoBackend());data.Usuarios[1][4]='SEGURANCA';});
test('Idioma usa padrão do país quando vazio',()=>{data.Usuarios[1][6]='';assert.equal(sandbox.obterSessaoBackend().idioma,'es');data.Usuarios[1][6]='es';});
test('ID de planilha não pode ser substituído por argumento extra',()=>{sandbox.planilhaOperacional_('CO30','brasil-sheet');assert.equal(opens.at(-1),'colombia-sheet');});
test('Conta BR resolve outra planilha e outras unidades',()=>{data.Usuarios[1][2]='BR';data.Usuarios[1][3]='BR1';assert.equal(sandbox.obterSessaoBackend().pais,'BR');sandbox.planilhaOperacional_('BR1');assert.equal(opens.at(-1),'brasil-sheet');data.Usuarios[1][2]='CO';data.Usuarios[1][3]='CO30';});

function withMulti(fn){const user=data.Usuarios[1],old=user.slice();user[2]='BR;CO';user[3]='BR1;CO30';user[4]='ADMINISTRADOR';userProps().deleteProperty('LOGISTICA_SESSAO_V04');try{sandbox.obterSessaoBackend();fn();}finally{data.Usuarios[1]=old;sandbox.obterSessaoBackend();}}
test('Administrador recebe países autorizados sem expor planilhas',()=>withMulti(()=>{const s=sandbox.obterSessaoBackend();assert.deepEqual(Array.from(s.paises,x=>x.codigo),['BR','CO']);assert(!JSON.stringify(s).includes('colombia-sheet'));assert.equal(s.unidades[0].codigo,'BR1');}));
test('Troca país sem consultar controle ou renovar sessão e cada unidade mantém sua planilha',()=>withMulti(()=>{const before=sandbox.contexto_(),count=opens.length;const switched=sandbox.alternarPaisBackend('CO');assert.equal(switched.pais,'CO');assert.equal(switched.expiraEm,before.expiraEm);assert.equal(opens.length,count);sandbox.planilhaOperacional_('BR1');assert.equal(opens.at(-1),'brasil-sheet');sandbox.planilhaOperacional_('CO30');assert.equal(opens.at(-1),'colombia-sheet');blocked(()=>sandbox.alternarPaisBackend('MX'));}));
test('Gerente e segurança não podem obter acesso a vários países',()=>{const u=data.Usuarios[1],old=u.slice();try{u[2]='BR;CO';u[3]='BR1;CO30';for(const role of ['GERENTE','SEGURANCA']){u[4]=role;blocked(()=>sandbox.obterSessaoBackend());}}finally{data.Usuarios[1]=old;}});
test('País sem unidade atribuída e unidade externa continuam bloqueados',()=>{const u=data.Usuarios[1],old=u.slice();try{u[2]='BR;CO';u[3]='CO30';u[4]='ADMINISTRADOR';blocked(()=>sandbox.obterSessaoBackend());}finally{data.Usuarios[1]=old;}});
test('Novo login conserva país escolhido apenas se ainda estiver autorizado',()=>withMulti(()=>{sandbox.alternarPaisBackend('CO');assert.equal(sandbox.obterSessaoBackend().pais,'CO');const u=data.Usuarios[1];u[2]='BR';u[3]='BR1';assert.equal(sandbox.obterSessaoBackend().pais,'BR');blocked(()=>sandbox.contextoUnidade_('CO30'));}));
fs.writeFileSync(base+'VALIDACAO-ACESSO.txt',results.join('\n')+'\n\n23 testes locais de autorização aprovados. Serviços Google simulados.\nImplantação e autenticação reais ainda não testadas.\n');console.log(results.join('\n'));
