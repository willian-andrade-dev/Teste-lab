/** Regras e cadastros colombianos. Não modifica o contrato brasileiro. */
const CO_REGRAS_={
  versao:'CO-2',entrada:['mecanica','fluidos','estrutura','luzes','espelhos','interior','cobertura','outros','container','pneus','reserva','compuertas','extintor','epi_colete','epi_bota','epi_capacete'],saida:['veiculo','carga','lacres'],na:['interior','cobertura','outros','container','compuertas','epi_capacete','carga','lacres'],causas:{
    container:['SUJO','ODOR','RESIDUOS','NAO_VAZIO','LUZ','PISO','SOLDA','OUTRO'],pneus:['PERNO','ARO','DESGASTE','PRESSAO','DEFEITO','OUTRO']
  }
};
const CO_CADASTRO_HEADERS_=['Solicitacao','Hash','Autor','Unidade','Entidade','Chave','Nome','Empresa','Telefone','Tipo','Observacao','UTC'];
const CO_VEICULO_HEADERS_=['Pais','Placa','Tipo','Observacao','AtualizadoUTC'];
function schemasColombia_(){
  return {
    Cadastros_CO_v1:CO_CADASTRO_HEADERS_,Veiculos_CO_v1:CO_VEICULO_HEADERS_,Fotos_Conjunto_CO_v1:FOTO_HEADERS_
  };
}
function contextoColombia_(unidade){
  const r=contextoUnidade_(unidade);
  if(r.contexto.pais.Pais!=='CO')falhar_('ACESSO_NEGADO');
  return r;
}
function prepararColombia_(ss){
  Object.entries(schemasColombia_()).forEach(([name,headers])=>{
    const sh=ss.getSheetByName(name)||ss.insertSheet(name);
    if(!sh.getLastRow())sh.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');
    else conferirCabecalho_(sh,headers);
    sh.setFrozenRows(1);
  });
}
function validarCausasColombia_(d,checklist){
  const out={};
  for(const [k,opcoes] of Object.entries(CO_REGRAS_.causas)){
    if(checklist[k]?.estado!=='NAO_CONFORME')continue;
    const item=d.causas?.[k];
    if(!item||!Array.isArray(item.opcoes)||!item.opcoes.length||new Set(item.opcoes).size!==item.opcoes.length||item.opcoes.some(x=>!opcoes.includes(x)))falhar_('CAUSAS_OBRIGATORIAS');
    out[k]={
      opcoes:item.opcoes.slice().sort(),outro:textoChegada_(item.outro,'outro',300,item.opcoes.includes('OUTRO'))
    };
  }
  return out;
}
function atualizarVeiculoColombia_(ss,placa,tipo,observacao,utc){
  const sh=ss.getSheetByName('Veiculos_CO_v1');
  conferirCabecalho_(sh,CO_VEICULO_HEADERS_);
  const rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,5).getDisplayValues():[],idx=rows.findIndex(x=>x[0]==='CO'&&x[1]===placa);
  if(idx>=0&&rows[idx][4]>utc)return;
  sh.getRange(idx>=0?idx+2:sh.getLastRow()+1,1,1,5).setNumberFormat('@').setValues([['CO',placa,tipo,observacao,utc].map(celulaTexto_)]);
}
function registrarVeiculosChegadaColombia_(ss,row){
  if(row[3]!=='CO')return;
  const sh=ss.getSheetByName('Veiculos_CO_v1');
  if(!sh)return;
  const rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,2).getDisplayValues():[];
  row.slice(17,20).filter(Boolean).forEach(placa=>{
    if(!rows.some(x=>x[1]===placa))atualizarVeiculoColombia_(ss,placa,'NA','',row[6]);
  });
}
/** Append de comandos garante reenvio e conserva versões anteriores do cadastro. */
function salvarCadastroColombiaBackend(d){
  return medirOperacao_('CADASTRO',d,salvarCadastroColombia_);
}
function salvarCadastroColombia_(d,med){
  const lock=LockService.getScriptLock();
  lock.waitLock(30000);
  try{
    const r=contextoColombia_(d?.unidade),c=r.contexto,ss=planilhaPais_(c);
    Object.entries(schemasColombia_()).forEach(([n,h])=>conferirCabecalho_(ss.getSheetByName(n),h));
    const key=textoChegada_(d.solicitacao,'solicitacao',80,true);
    if(!/^[a-zA-Z0-9-]{16,80}$/.test(key))falhar_('REQUISICAO_INVALIDA');
    conferirNaoCancelada_(ss,key,c,r.unidade.Codigo,'CADASTRO');
    const entidade=d.entidade;
    if(!['MOTORISTA','VEICULO'].includes(entidade))falhar_('CAMPO_INVALIDO:entidade');
    const chave=entidade==='MOTORISTA'?documentoChegada_(d.chave,'CO'):placaChegada_(d.chave,'CO',true),nome=textoChegada_(d.nome,'motorista',160,entidade==='MOTORISTA'),empresa=textoChegada_(d.empresa,'empresa',160,entidade==='MOTORISTA'),telefone=textoChegada_(d.telefone,'telefone',30,entidade==='MOTORISTA');
    if(telefone&&!/^\+?[\d\s().-]{7,30}$/.test(telefone))falhar_('CAMPO_INVALIDO:telefone');
    const tipo=entidade==='VEICULO'?textoChegada_(d.tipo,'tipo',20,true):'';
    if(tipo&&!['CARRO','CAMINHONETE','CAMINHAO','CARRETA','NA'].includes(tipo))falhar_('CAMPO_INVALIDO:tipo');
    const obs=textoChegada_(d.observacao,'observacao',2000,false),hash=hashV3_({
      entidade,chave,nome,empresa,telefone,tipo,obs
    }),sh=ss.getSheetByName('Cadastros_CO_v1'),rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,12).getDisplayValues():[];
    let event=rows.find(x=>x[0]===key);
    if(event){
      if(event[1]!==hash||event[2]!==c.email||event[3]!==r.unidade.Codigo)falhar_('SOLICITACAO_CONFLITANTE');
    }
    else{
      const previous=rows.length?Date.parse(rows[rows.length-1][11]):0;
      const cad=entidade==='MOTORISTA'?ss.getSheetByName('Motoristas_v3'):ss.getSheetByName('Veiculos_CO_v1');
      const all=cad.getLastRow()>1?cad.getRange(2,1,cad.getLastRow()-1,entidade==='MOTORISTA'?7:5).getDisplayValues():[];
      const existing=all.find(x=>x[1]===chave);
      const stamp=new Date(Math.max(Date.now(),(previous||0)+1,(existing?Date.parse(existing[entidade==='MOTORISTA'?5:4]):0)+1||0)).toISOString();
      med.gravacaoIniciada=true;
      event=[key,hash,c.email,r.unidade.Codigo,entidade,chave,nome,empresa,telefone,tipo,obs,stamp];
      sh.getRange(sh.getLastRow()+1,1,1,12).setNumberFormat('@').setValues([event.map(celulaTexto_)]);
    }
    med.gravacaoIniciada=true;
    if(entidade==='VEICULO')atualizarVeiculoColombia_(ss,chave,tipo,obs,event[11]);
    else{
      const row=Array(35).fill('');
      Object.assign(row,{
        0:key,3:'CO',6:event[11],13:chave,14:nome,15:telefone,16:empresa
      });
      atualizarMotorista_(ss,row);
    }
    SpreadsheetApp.flush();
    return {
      confirmado:true,repetida:rows.some(x=>x[0]===key)
    };
  }
  finally{
    lock.releaseLock();
  }
}
function buscarVeiculoColombiaBackend(unidade,placa){
  const r=contextoColombia_(unidade),ss=planilhaPais_(r.contexto),p=placaChegada_(placa,'CO',true),sh=ss.getSheetByName('Veiculos_CO_v1');
  conferirCabecalho_(sh,CO_VEICULO_HEADERS_);
  const rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,5).getDisplayValues():[],v=rows.find(x=>x[0]==='CO'&&x[1]===p);
  return v?{
    placa:v[1],tipo:v[2],observacao:v[3],atualizado:v[4]
  }
  :null;
}
function observacoesColombiaBackend(unidade,filtro){
  const r=contextoColombia_(unidade),c=r.contexto,ss=planilhaPais_(c),doc=filtro?.documento?documentoChegada_(filtro.documento,'CO'):'',placa=filtro?.placa?placaChegada_(filtro.placa,'CO',true):'';
  if(!doc&&!placa)falhar_('FILTRO_OBRIGATORIO');
  const units=new Set(c.unidades.map(x=>x.Codigo)),events=indiceEventos_(eventosV3_(ss));
  return rowsChegadas_(ss).rows.filter(x=>x[3]==='CO'&&units.has(x[4])&&((doc&&x[13]===doc)||(placa&&x.slice(17,20).includes(placa)))).reverse().slice(0,20).map(x=>{
    const state=estadoViagem_(x,events[x[0]]||[]);
    return {
      data:x[7],hora:x[8],origem:(c.unidades.find(u=>u.Codigo===x[4])||{}).Nome||x[4],observacao:x[34],divergencia:state.divergencia||'',tipo:['AGUARDANDO_AUTORIZACAO','PENDENTE_AVALIACAO'].includes(state.status)?'RESTRICAO':'INFORMACAO'
    };
  }).filter(x=>x.observacao||x.divergencia);
}
/** Importa somente veículos ausentes; nunca substitui cadastros manuais. */
function migrarCadastrosColombia(){
  const lock=LockService.getScriptLock();
  lock.waitLock(30000);
  try{
    const c=iniciarSessao_();
    if(c.pais.Pais!=='CO'||c.usuario.Perfil!=='ADMINISTRADOR')falhar_('ACESSO_NEGADO');
    const ss=planilhaPais_(c);
    prepararColombia_(ss);
    const sh=ss.getSheetByName('Veiculos_CO_v1'),existing=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,2).getDisplayValues():[],known=new Set(existing.map(x=>x[1])),insert=[];
    for(const row of rowsChegadas_(ss).rows){
      if(row[3]!=='CO')continue;
      for(const placa of row.slice(17,20).filter(Boolean)){
        if(known.has(placa))continue;
        known.add(placa);
        insert.push(['CO',placa,'NA','',row[6]].map(celulaTexto_));
      }
    }
    if(insert.length)sh.getRange(sh.getLastRow()+1,1,insert.length,5).setNumberFormat('@').setValues(insert);
    SpreadsheetApp.flush();
    return {
      importados:insert.length
    };
  }
  finally{
    lock.releaseLock();
  }
}
function causasEquivalentesColombia_(a,b){
  const canonical=x=>Object.keys(x||{}).sort().map(k=>[k,[...(x[k].opcoes||[])].sort(),x[k].outro||'']);
  return JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
}
function historicoVeiculoColombiaBackend(unidade,placa){
  const r=contextoColombia_(unidade),c=r.contexto,ss=planilhaPais_(c),p=placaChegada_(placa,'CO',true),units=new Set(c.unidades.map(x=>x.Codigo)),events=indiceEventos_(eventosV3_(ss));
  return rowsChegadas_(ss).rows.filter(x=>x[3]==='CO'&&units.has(x[4])&&x.slice(17,20).includes(p)).reverse().slice(0,20).map(x=>({
    data:x[7],hora:x[8],origem:(c.unidades.find(u=>u.Codigo===x[4])||{}).Nome||x[4],motorista:x[14],empresa:x[16],finalidade:x[12],status:estadoViagem_(x,events[x[0]]||[]).status
  }));
}
/** Diagnóstico manual: lê a configuração real sem alterá-la. */
function verificarConfiguracaoColombia(){
  const c=iniciarSessao_();
  if(c.pais.Pais!=='CO'||c.usuario.Perfil!=='ADMINISTRADOR')falhar_('ACESSO_NEGADO');
  const ss=planilhaPais_(c),result={
    fusoConfigurado:c.pais.Fuso,fusoOperacional:fusoOperacional_(c),unidades:['CO30','CO20','CP39'].map(codigo=>{
      const u=c.origens.find(x=>x.Codigo===codigo);
      return {
        codigo,encontrada:!!u,nome:u?.Nome||'',endereco:u?.Endereco||''
      };
    }),produtos:catalogo_(ss,'Produtos_v2').length,transportadoras:catalogo_(ss,'Transportadoras_v2').length
  };
  console.log(JSON.stringify(result));
  return result;
}
