/** Chegadas v0.2. As abas legadas não são modificadas. */
const CHEGADA_HEADERS_ = ['ID','Solicitacao','Resumo','Pais','Unidade','Status','InstanteUTC','DataLocal','HoraLocal','Fuso','RegistradoPor','NomeOficial','Finalidade','Documento','Motorista','Telefone','Empresa','Placa1','Placa2','Placa3','SeguridadeSocial','Infracao','OrdemCarga','Faturas','Lacres','Remitos','BodegaOrigem','Container','ContainerConfirmado','Comodato','Produtos','Destino','AreaDestino','StatusAduaneiro','Observacao'];
const FINALIDADES_ = {
  CO: {
    CARGA_NACIONAL:['ordemCarga'], RECICLAGEM:['faturas'],
    EXPORTACAO:['ordemCarga','container','lacreEntrada','comodato','produtos','destino'],
    ENTRE_BODEGAS:['remitos','origem'], DEVOLUCOES:['origem','faturas','lacres'],
    MATERIA_PRIMA:['faturas','lacres','areaDestino','produtos'],
    IMPORTACAO:['faturas','lacres','statusAduaneiro','produtos'], OUTRA:['empresaOutra']
  },
  BR: {COLETA:['faturas'],DEVOLUCAO:['faturas','lacres'],TRANSFERENCIA:['faturas','lacres','origem'],MOV_PALLET:['faturas'],BR14:['faturas']}
};
const CATALOGOS_ = {
  Produtos_v2:['Codigo','Nome','Status'],
  Transportadoras_v2:['Nome','Status']
};
function planilhaPais_(c) {
  const id = String(c.pais.PlanilhaID).trim();
  // A configuração do país já foi conferida no início da sessão.
  if (!FINALIDADES_[c.pais.Pais]) falhar_('PAIS_NAO_CONFIGURADO');
  return SpreadsheetApp.openById(id);
}
function conferirCabecalho_(sh, headers) {
  if (!sh || !sh.getLastRow()) falhar_('OPERACAO_NAO_PREPARADA');
  const row = sh.getRange(1,1,1,headers.length).getDisplayValues()[0];
  if (sh.getLastColumn() !== headers.length || !headers.every((h,i)=>row[i]===h)) falhar_('CABECALHOS_INVALIDOS');
}
/** Executar no editor como ADMINISTRADOR. Prepara apenas o país cadastrado do executor. */
function prepararOperacaoBase_() {
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try {
    const c=iniciarSessao_();
    if(c.usuario.Perfil!=='ADMINISTRADOR') falhar_('ACESSO_NEGADO');
    const ss=planilhaPais_(c);
    const schemas=Object.assign({Chegadas_v2:CHEGADA_HEADERS_},CATALOGOS_);
    Object.keys(schemas).forEach(nome=>{const sh=ss.getSheetByName(nome);if(sh&&sh.getLastRow())conferirCabecalho_(sh,schemas[nome]);});
    Object.keys(schemas).forEach(nome=>{
      const sh=ss.getSheetByName(nome)||ss.insertSheet(nome);
      if(!sh.getLastRow()) {sh.getRange(1,1,1,schemas[nome].length).setValues([schemas[nome]]).setFontWeight('bold');sh.setFrozenRows(1);}
    });
    SpreadsheetApp.flush();
    const mensagem='Operação preparada para '+c.pais.Pais+'. Cadastre produtos e transportadoras antes de registrar chegadas.';
    console.log(mensagem);
    return mensagem;
  } finally {lock.releaseLock();}
}
function catalogo_(ss,nome) {
  const sh=ss.getSheetByName(nome);conferirCabecalho_(sh,CATALOGOS_[nome]);
  if(sh.getLastRow()<2)return [];
  return sh.getRange(2,1,sh.getLastRow()-1,CATALOGOS_[nome].length).getDisplayValues()
    .filter(r=>r[r.length-1]==='ATIVO').map(r=>nome==='Produtos_v2'?{codigo:r[0].trim(),nome:r[1].trim()}:{nome:r[0].trim()})
    .filter(r=>r.nome&&(nome!=='Produtos_v2'||r.codigo));
}
function obterConfiguracaoChegadaBackend(codigo) {
  const r=contextoUnidade_(codigo),ss=planilhaPais_(r.contexto);
  conferirCabecalho_(ss.getSheetByName('Chegadas_v2'),CHEGADA_HEADERS_);
  return {pais:r.contexto.pais.Pais,finalidades:FINALIDADES_[r.contexto.pais.Pais],
    oficial:r.contexto.usuario.Nome||r.contexto.email,
    tag:r.contexto.pais.Pais==='BR'&&/IMIGRANTES/i.test(r.unidade.Codigo+' '+r.unidade.Nome),
    origens:r.contexto.origens.filter(u=>u.Codigo!==r.unidade.Codigo).map(u=>({codigo:u.Codigo,nome:u.Nome})),
    produtos:catalogo_(ss,'Produtos_v2'),transportadoras:catalogo_(ss,'Transportadoras_v2')};
}
function textoChegada_(v,field,max,required) {
  if(v!==undefined&&v!==null&&typeof v!=='string')falhar_('CAMPO_INVALIDO:'+field);
  const s=String(v||'').trim();
  if(required&&!s)falhar_('CAMPO_OBRIGATORIO:'+field);
  if(s.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s))falhar_('CAMPO_INVALIDO:'+field);
  return s;
}
function listaChegada_(v,field,required) {
  if(!Array.isArray(v)||v.length>100)falhar_('CAMPO_INVALIDO:'+field);
  const a=v.map(x=>textoChegada_(x,field,100,true));
  if(required&&!a.length)falhar_('CAMPO_OBRIGATORIO:'+field);
  if(new Set(a).size!==a.length)falhar_('ITENS_DUPLICADOS:'+field);
  return a;
}
function documentoChegada_(v,pais) {
  const s=textoChegada_(v,'documento',32,true).replace(/[.\s-]/g,'').toUpperCase();
  if(pais==='BR') {
    if(!/^\d{11}$/.test(s)||/^(\d)\1{10}$/.test(s))falhar_('DOCUMENTO_INVALIDO');
    for(let len=9;len<=10;len++){
      let sum=0;for(let i=0;i<len;i++)sum+=Number(s[i])*(len+1-i);
      const d=(sum*10)%11%10;if(d!==Number(s[len]))falhar_('DOCUMENTO_INVALIDO');
    }
  }else if(!/^[A-Z0-9]{4,24}$/.test(s))falhar_('DOCUMENTO_INVALIDO');
  return s;
}
function placaChegada_(v,pais,required) {
  const s=textoChegada_(v,'placa',12,required).replace(/[\s-]/g,'').toUpperCase();
  if(!s)return '';
  const pattern=pais==='BR'?/^[A-Z]{3}\d[A-Z0-9]\d{2}$/:/^[A-Z0-9]{5,10}$/;
  if(!pattern.test(s))falhar_('PLACA_INVALIDA');return s;
}
function containerChegada_(v) {
  const s=String(v||'').replace(/\s/g,'').toUpperCase();
  if(!/^[A-Z]{3}[UJZ]\d{7}$/.test(s))falhar_('CONTAINER_INVALIDO');
  const letras={A:10,B:12,C:13,D:14,E:15,F:16,G:17,H:18,I:19,J:20,K:21,L:23,M:24,N:25,O:26,P:27,Q:28,R:29,S:30,T:31,U:32,V:34,W:35,X:36,Y:37,Z:38};
  let total=0;for(let i=0;i<10;i++)total+=(i<4?letras[s[i]]:Number(s[i]))*Math.pow(2,i);
  if((total%11)%10!==Number(s[10]))falhar_('CONTAINER_INVALIDO');return s;
}
function validarChegada_(d,c,ss) {
  if(!d||typeof d!=='object'||Array.isArray(d))falhar_('REQUISICAO_INVALIDA');
  const pais=c.pais.Pais,fin=textoChegada_(d.finalidade,'finalidade',32,true);
  const campos=FINALIDADES_[pais]&&FINALIDADES_[pais][fin];if(!campos)falhar_('FINALIDADE_INVALIDA');
  const req=k=>campos.includes(k),out={finalidade:fin};
  out.documento=documentoChegada_(d.documento,pais);
  out.motorista=textoChegada_(d.motorista,'motorista',160,true);
  out.telefone=textoChegada_(d.telefone,'telefone',30,pais==='CO');
  if(out.telefone&&!/^\+?[\d\s().-]{7,30}$/.test(out.telefone))falhar_('CAMPO_INVALIDO:telefone');
  out.placa1=placaChegada_(d.placa1,pais,true);out.placa2=placaChegada_(d.placa2,pais,false);out.placa3=pais==='BR'?placaChegada_(d.placa3,pais,false):'';
  const placas=[out.placa1,out.placa2,out.placa3].filter(Boolean);if(new Set(placas).size!==placas.length)falhar_('PLACAS_DUPLICADAS');
  out.empresa=textoChegada_(d.empresa,'empresa',160,true);
  if(!req('empresaOutra')&&!catalogo_(ss,'Transportadoras_v2').some(t=>t.nome===out.empresa))falhar_('TRANSPORTADORA_INVALIDA');
  out.seguridadeSocial=textoChegada_(d.seguridadeSocial,'seguridadeSocial',3,pais==='CO');
  out.infracao=textoChegada_(d.infracao,'infracao',3,pais==='CO');
  for(const k of ['seguridadeSocial','infracao'])if(out[k]&&!['SIM','NAO'].includes(out[k]))falhar_('CAMPO_INVALIDO:'+k);
  for(const k of ['ordemCarga','origem','comodato','destino','areaDestino','statusAduaneiro'])out[k]=req(k)?textoChegada_(d[k],k,160,true):'';
  if(out.origem===String(d.unidade||'').trim())falhar_('ORIGEM_INVALIDA');
  if(out.origem&&!c.origens.some(u=>u.Codigo===out.origem))falhar_('ORIGEM_INVALIDA');
  if(out.statusAduaneiro&&!['NACIONALIZADO','DEPOSITO_ADUANEIRO'].includes(out.statusAduaneiro))falhar_('CAMPO_INVALIDO:statusAduaneiro');
  for(const k of ['faturas','lacres','remitos','produtos'])out[k]=req(k)?listaChegada_(d[k]||[],k,pais!=='BR'):[];
  if(fin==='IMPORTACAO'&&out.faturas.length!==1)falhar_('CAMPO_INVALIDO:faturas');
  if(req('lacreEntrada'))out.lacres=[textoChegada_(d.lacreEntrada,'lacreEntrada',100,true)];
  if(out.produtos.length){const codigos=catalogo_(ss,'Produtos_v2').map(p=>p.codigo);if(out.produtos.some(p=>!codigos.includes(p)))falhar_('PRODUTO_INVALIDO');}
  out.container=req('container')?containerChegada_(d.container):'';
  out.containerConfirmado=req('container')&&d.containerConfirmado===true;
  if(req('container')&&!out.containerConfirmado)falhar_('CONTAINER_NAO_CONFIRMADO');
  out.observacao=textoChegada_(d.observacao,'observacao',2000,false);
  out.status=out.infracao==='SIM'||out.seguridadeSocial==='NAO'?'PENDENTE_AVALIACAO':'AGUARDANDO_ENTRADA';
  return out;
}
function celulaTexto_(v) {
  const s=String(v===undefined||v===null?'':v);
  // Defesa adicional contra fórmulas originadas em campos de texto.
  return /^[\s]*[=+@-]/.test(s)?"'"+s:s;
}
function rowsChegadas_(ss) {
  const sh=ss.getSheetByName('Chegadas_v2');conferirCabecalho_(sh,CHEGADA_HEADERS_);
  return {sheet:sh,rows:sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,CHEGADA_HEADERS_.length).getDisplayValues():[]};
}
function resumoChegada_(row) {
  return {id:row[0],unidade:row[4],status:row[5],data:row[7],hora:row[8],oficial:row[11],finalidade:row[12],documento:row[13],motorista:row[14],empresa:row[16],placa1:row[17],placa2:row[18],observacao:row[34]};
}
function registrarChegadaBackend(dados) {
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try {
    const r=contextoUnidade_(dados&&dados.unidade),c=r.contexto,ss=planilhaPais_(c);
    validarEstruturaV3_(ss,c.pais.Pais);
    const key=textoChegada_(dados.solicitacao,'solicitacao',80,true);
    if(!/^[a-zA-Z0-9-]{16,80}$/.test(key))falhar_('REQUISICAO_INVALIDA');
    const novo=validarChegada_(dados,c,ss),table=rowsChegadas_(ss);
    const hash=Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(Object.assign({},novo,{fotoLacre:validarFotoLacre_(dados.fotoLacre)})),Utilities.Charset.UTF_8));
    const repetida=table.rows.find(row=>row[1]===key);
    if(repetida){
      if(repetida[3]!==c.pais.Pais||repetida[4]!==r.unidade.Codigo||repetida[10]!==c.email||repetida[2]!==hash)falhar_('SOLICITACAO_CONFLITANTE');
      salvarFotoLacre_(ss,repetida,dados.fotoLacre,key);
      atualizarViagemVisoes_(ss,c,repetida,eventosV3_(ss),!!dados.fotoLacre);SpreadsheetApp.flush();
      return Object.assign(viagemPublica_(repetida,eventosV3_(ss)),{repetida:true});
    }
    const placas=[novo.placa1,novo.placa2,novo.placa3].filter(Boolean);
    const eventos=eventosV3_(ss),porViagem=indiceEventos_(eventos);
    if(table.rows.some(row=>row[3]===c.pais.Pais&&!['CONCLUIDO','RECUSADO'].includes(estadoViagem_(row,porViagem[row[0]]||[]).status)&&
      (row[13]===novo.documento||row.slice(17,20).some(p=>p&&placas.includes(p)))))falhar_('CHEGADA_ATIVA_EXISTENTE');
    const agora=new Date(),fuso=c.pais.Fuso;
    const row=[Utilities.getUuid(),key,hash,c.pais.Pais,r.unidade.Codigo,novo.status,agora.toISOString(),
      Utilities.formatDate(agora,fuso,'yyyy-MM-dd'),Utilities.formatDate(agora,fuso,'HH:mm:ss'),fuso,c.email,c.usuario.Nome||c.email,
      novo.finalidade,novo.documento,novo.motorista,novo.telefone,novo.empresa,novo.placa1,novo.placa2,novo.placa3,novo.seguridadeSocial,novo.infracao,
      novo.ordemCarga,JSON.stringify(novo.faturas),JSON.stringify(novo.lacres),JSON.stringify(novo.remitos),novo.origem,novo.container,
      novo.containerConfirmado?'SIM':'',novo.comodato,JSON.stringify(novo.produtos),novo.destino,novo.areaDestino,novo.statusAduaneiro,novo.observacao];
    table.sheet.getRange(table.sheet.getLastRow()+1,1,1,row.length).setNumberFormat('@').setValues([row.map(celulaTexto_)]);
    salvarFotoLacre_(ss,row,dados.fotoLacre,key);
    atualizarViagemVisoes_(ss,c,row,eventos,!!dados.fotoLacre);SpreadsheetApp.flush();return Object.assign(viagemPublica_(row,eventos),{repetida:false});
  } finally {lock.releaseLock();}
}
function listarChegadasBackend(codigo) {
  const r=contextoUnidade_(codigo),table=rowsChegadas_(planilhaPais_(r.contexto));
  const eventos=eventosV3_(planilhaPais_(r.contexto));
  return table.rows.filter(row=>row[3]===r.contexto.pais.Pais&&row[4]===r.unidade.Codigo).slice(-50).reverse().map(row=>viagemPublica_(row,eventos));
}
function buscarHistoricoChegadaBackend(codigo,filtro) {
  const r=contextoUnidade_(codigo),pais=r.contexto.pais.Pais;
  const documento=filtro&&filtro.documento?documentoChegada_(filtro.documento,pais):'';
  const placa=filtro&&filtro.placa?placaChegada_(filtro.placa,pais,true):'';
  if(!documento&&!placa)falhar_('FILTRO_OBRIGATORIO');
  const ss=planilhaPais_(r.contexto),eventos=eventosV3_(ss);
  return rowsChegadas_(ss).rows.filter(row=>row[3]===pais&&row[4]===r.unidade.Codigo&&
    ((documento&&row[13]===documento)||(placa&&row.slice(17,20).includes(placa)))).slice(-20).reverse().map(row=>viagemPublica_(row,eventos));
}
