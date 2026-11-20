/** Fonte de estados: eventos anexados. Abas de apresentação podem ser reconstruídas. */
const EVENTO_HEADERS_=['ID Evento','Solicitacao','Hash','ID Viagem','Unidade','Pais','Acao','Instante UTC','Autor','Nome','Dados'];
const FOTO_HEADERS_=['ID Viagem','Solicitacao','Unidade','Pais','Imagem'];
const BASE_BR_=['ID Viagem','Unidade','Status Atual','Data Chegada','Hora Chegada','Finalidade','Transportadora','Nome Motorista','CPF','Placa Cavalo','Placa Carreta','Placa Carreta 2','Agente Chegada','NF Chegada','Lacre Origem','Foto Lacre'];
const ENTRADA_BR_=BASE_BR_.concat(['Data Entrada','Hora Entrada','Agente Entrada','N° TAG','Tempo Retenção','Controle Calço','Divergência / Liberação','Autorizado por','Checklist Entrada']);
const SAIDA_BR_=ENTRADA_BR_.concat(['Data Saída','Hora Saída','Agente Saída','Tempo Permanência','Destino','NF Saída','Lacre Saída','Checklist Saída']);
const CHECK_BR_=['mecanica','fluidos','pneus','estrutura','luzes','espelhos','interior','cobertura','outros'];
const CHECK_CO_=['container','pneus','reserva','compuertas','extintor'];
const CHECK_SAIDA_=['veiculo','carga','lacres'];
const ESTADOS_TEXTO_={AGUARDANDO_ENTRADA:'Aguardando entrada — fora da planta',PENDENTE_AVALIACAO:'Pendente de avaliação — fora da planta',AGUARDANDO_AUTORIZACAO:'Aguardando autorização — fora da planta',LIBERADO:'Liberado — aguardando entrada',DENTRO_UNIDADE:'Dentro da planta',CONCLUIDO:'Concluído',RECUSADO:'Recusado — fora da planta'};
const FIN_BR_={COLETA:'Coleta',DEVOLUCAO:'Devolução',TRANSFERENCIA:'Transferência',MOV_PALLET:'Movimentação de pallet',BR14:'BR14 (FTA) - Galpão E'};
function schemasV3_(pais){const s={Eventos_v3:EVENTO_HEADERS_,Fotos_v3:FOTO_HEADERS_};if(pais==='BR')Object.assign(s,{Chegadas_BR:BASE_BR_,Entradas_BR:ENTRADA_BR_,Saidas_BR:SAIDA_BR_});return s;}
function validarEstruturaV3_(ss,pais){const schemas=schemasV3_(pais);Object.keys(schemas).forEach(n=>conferirCabecalho_(ss.getSheetByName(n),schemas[n]));}
function prepararOperacao(){
  prepararOperacaoBase_();
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{const c=iniciarSessao_();if(c.usuario.Perfil!=='ADMINISTRADOR')falhar_('ACESSO_NEGADO');const ss=planilhaPais_(c),schemas=schemasV3_(c.pais.Pais);
    Object.keys(schemas).forEach(n=>{const sh=ss.getSheetByName(n);if(sh&&sh.getLastRow())conferirCabecalho_(sh,schemas[n]);});
    Object.keys(schemas).forEach(n=>{const sh=ss.getSheetByName(n)||ss.insertSheet(n);if(!sh.getLastRow()){sh.getRange(1,1,1,schemas[n].length).setValues([schemas[n]]).setFontWeight('bold');sh.setFrozenRows(1);}});
    atualizarVisoes_(ss,c);
    if(c.pais.Pais==='BR'){
      // Mantém sempre três abas operacionais visíveis antes de ocultar as técnicas.
      ['Chegadas_BR','Entradas_BR','Saidas_BR'].forEach(n=>ss.getSheetByName(n).showSheet());
      ['Chegadas_v2','Eventos_v3','Fotos_v3'].forEach(n=>ss.getSheetByName(n).hideSheet());
    }
    SpreadsheetApp.flush();console.log('Versão 0.3 preparada para '+c.pais.Pais+'. Registros existentes preservados.');
    return 'Preparação concluída';
  }finally{lock.releaseLock();}
}
function eventosV3_(ss){const sh=ss.getSheetByName('Eventos_v3');conferirCabecalho_(sh,EVENTO_HEADERS_);return sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,EVENTO_HEADERS_.length).getDisplayValues():[];}
function eventoObjeto_(r){return {id:r[0],key:r[1],hash:r[2],viagem:r[3],unidade:r[4],pais:r[5],acao:r[6],utc:r[7],autor:r[8],nome:r[9],dados:JSON.parse(r[10])};}
function estadoViagem_(row,eventos){
  const s={status:row[5],revisao:0,chegadaUTC:row[6],entradaUTC:'',saidaUTC:'',entrada:null,saida:null,retencao:null,autorizacao:null,divergencia:'',autorizadoPor:'',agenteEntrada:'',agenteSaida:''};
  eventos.filter(e=>e[3]===row[0]&&e[4]===row[4]&&e[5]===row[3]).forEach(e=>{
    const o=eventoObjeto_(e);s.revisao++;
    if(o.acao==='RETER'){s.status='AGUARDANDO_AUTORIZACAO';s.retencao=o.dados;s.divergencia=o.dados.divergencia;s.autorizacao=null;s.autorizadoPor='';}
    if(o.acao==='APROVAR'){s.status='LIBERADO';s.autorizacao=o;s.autorizadoPor=o.nome+' <'+o.autor+'>';}
    if(o.acao==='REJEITAR'){s.status='RECUSADO';s.autorizacao=o;s.autorizadoPor=o.nome+' <'+o.autor+'>';s.divergencia=o.dados.justificativa;}
    if(o.acao==='ENTRADA'){s.status='DENTRO_UNIDADE';s.entrada=o.dados;s.entradaUTC=o.utc;s.agenteEntrada=o.nome+' <'+o.autor+'>';}
    if(o.acao==='SAIDA'){s.status='CONCLUIDO';s.saida=o.dados;s.saidaUTC=o.utc;s.agenteSaida=o.nome+' <'+o.autor+'>';}
  });return s;
}
function minutos_(inicio,fim){if(!inicio||!fim)return '';const n=Math.floor((new Date(fim).getTime()-new Date(inicio).getTime())/60000);if(!isFinite(n)||n<0)falhar_('HORARIO_INVALIDO');return n;}
function duracao_(n){return n===''?'':Math.floor(n/60)+'h '+String(n%60).padStart(2,'0')+'m';}
function entradaPublica_(d){if(!d)return null;const v=Object.assign({},d);delete v.assinaturas;return v;}
function viagemPublica_(row,eventos){const s=estadoViagem_(row,eventos);return Object.assign(resumoChegada_(row),{placa3:row[19],faturas:JSON.parse(row[23]||'[]'),lacres:JSON.parse(row[24]||'[]'),status:s.status,revisao:s.revisao,entrada:entradaPublica_(s.entrada),retencao:entradaPublica_(s.retencao),divergencia:s.divergencia,autorizadoPor:s.autorizadoPor,entradaUTC:s.entradaUTC,saidaUTC:s.saidaUTC,retencaoMin:minutos_(row[6],s.entradaUTC),permanenciaMin:minutos_(s.entradaUTC,s.saidaUTC)});}
function viagemAutorizada_(ss,c,unit,id){
  const found=rowsChegadas_(ss).rows.filter(r=>r[0]===id);
  if(found.length!==1||found[0][3]!==c.pais.Pais||found[0][4]!==unit)falhar_('ACESSO_NEGADO');return found[0];
}
function obterPainelOperacaoBackend(codigo){
  const r=contextoUnidade_(codigo),ss=planilhaPais_(r.contexto);
  // Leitura do painel consulta apenas as duas fontes, sem validar as abas de relatório.
  const eventos=eventosV3_(ss),rows=rowsChegadas_(ss).rows.filter(x=>x[3]===r.contexto.pais.Pais&&x[4]===r.unidade.Codigo);
  const indice=Object.create(null);
  eventos.forEach(e=>{if(e[4]===r.unidade.Codigo&&e[5]===r.contexto.pais.Pais)(indice[e[3]]||(indice[e[3]]=[])).push(e);});
  const all=rows.map(x=>viagemPublica_(x,indice[x[0]]||[])).reverse();
  return {recentes:all.slice(0,50),entrada:all.filter(x=>!['DENTRO_UNIDADE','CONCLUIDO','RECUSADO'].includes(x.status)),
    saida:all.filter(x=>x.status==='DENTRO_UNIDADE'),concluidos:all.filter(x=>['CONCLUIDO','RECUSADO'].includes(x.status)).slice(0,30),
    podeAutorizar:['GERENTE','ADMINISTRADOR'].includes(r.contexto.usuario.Perfil)};
}
/** Uma única chamada inicial devolve configuração e todas as listas da unidade. */
function obterInicializacaoUnidadeBackend(codigo){
  return {config:obterConfiguracaoChegadaBackend(codigo),painel:obterPainelOperacaoBackend(codigo)};
}
function validarChecklist_(v,keys){
  if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))falhar_('CHECKLIST_INVALIDO');
  const out={};keys.forEach(k=>{const x=v[k];if(!x||!['CONFORME','NAO_CONFORME','NA'].includes(x.estado))falhar_('CHECKLIST_INCOMPLETO');const causa=textoChegada_(x.causa,k,300,x.estado==='NAO_CONFORME');out[k]={estado:x.estado,causa:x.estado==='NAO_CONFORME'?causa:''};});return out;
}
function temNaoConforme_(chk){return Object.keys(chk).some(k=>chk[k].estado==='NAO_CONFORME');}
function dadosEntrada_(d,c,unidade){
  const checklist=validarChecklist_(d.checklist,c.pais.Pais==='BR'?CHECK_BR_:CHECK_CO_);
  const imigrantes=c.pais.Pais==='BR'&&/IMIGRANTES/i.test(unidade.Codigo+' '+unidade.Nome);
  const tag=textoChegada_(d.tag,'tag',60,false);if(tag&&!imigrantes)falhar_('TAG_NAO_APLICAVEL');
  const calco=c.pais.Pais==='BR'?textoChegada_(d.calco,'calco',20,true):'NA';if(!['PROPRIO','EMPRESTADO','NA'].includes(calco))falhar_('CAMPO_INVALIDO:calco');
  const divergencia=textoChegada_(d.divergencia,'divergencia',2000,temNaoConforme_(checklist));
  const assinaturas={motorista:assinatura_(d.assinaturaMotorista,c.pais.Pais==='CO'),guarda:assinatura_(d.assinaturaGuarda,c.pais.Pais==='CO')};
  return {checklist,tag,calco,divergencia,assinaturas};
}
function assinatura_(v,required){const s=textoChegada_(v,'assinatura',16000,required);if(s&&!/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(s))falhar_('ASSINATURA_INVALIDA');return s;}
function hashV3_(obj){return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(obj),Utilities.Charset.UTF_8));}
function registrarMovimentoBackend(d){return medirOperacao_(acaoMedicao_(d&&d.acao),d,registrarMovimentoCore_);}
function registrarMovimentoCore_(d,med){
  const lock=LockService.getScriptLock();lock.waitLock(30000);med.marcar('trava');
  try{
    if(!d||typeof d!=='object')falhar_('REQUISICAO_INVALIDA');
    const r=contextoUnidade_(d.unidade),c=r.contexto,ss=planilhaPais_(c);validarEstruturaV3_(ss,c.pais.Pais);med.marcar('acesso_estrutura');
    const id=textoChegada_(d.id,'id',100,true),key=textoChegada_(d.solicitacao,'solicitacao',80,true);
    if(!/^[a-zA-Z0-9-]{16,80}$/.test(key))falhar_('REQUISICAO_INVALIDA');
    const row=viagemAutorizada_(ss,c,r.unidade.Codigo,id),eventos=eventosV3_(ss),s=estadoViagem_(row,eventos);
    const acao=textoChegada_(d.acao,'acao',15,true);let dados;
    if(['ENTRADA','RETER'].includes(acao))dados=dadosEntrada_(d,c,r.unidade);
    else if(['APROVAR','REJEITAR'].includes(acao)){
      if(!['GERENTE','ADMINISTRADOR'].includes(c.usuario.Perfil))falhar_('ACESSO_NEGADO');
      dados={justificativa:textoChegada_(d.justificativa,'justificativa',2000,true)};
    }else if(acao==='SAIDA'){
      const checklist=validarChecklist_(d.checklist,CHECK_SAIDA_);
      // Nesta etapa divergência na saída bloqueia conclusão; não há liberação tácita.
      if(temNaoConforme_(checklist))falhar_('SAIDA_DIVERGENTE');
      const devolucao=s.entrada&&s.entrada.calco==='EMPRESTADO'?textoChegada_(d.devolucaoCalco,'devolucaoCalco',3,true):'NA';
      if(!['SIM','NAO','NA'].includes(devolucao)||(s.entrada&&s.entrada.calco==='EMPRESTADO'&&devolucao!=='SIM'))falhar_('CALCO_NAO_DEVOLVIDO');
      dados={checklist,destino:textoChegada_(d.destino,'destino',160,true),faturas:listaChegada_(d.faturas||[],'faturas',false),lacres:listaChegada_(d.lacres||[],'lacres',false),devolucaoCalco:devolucao,observacao:textoChegada_(d.observacao,'observacao',2000,false)};
    }else falhar_('ACAO_INVALIDA');
    const hash=hashV3_({acao,dados});const repetido=eventos.find(e=>e[1]===key);
    if(repetido){if(repetido[3]!==id||repetido[4]!==r.unidade.Codigo||repetido[5]!==c.pais.Pais||repetido[8]!==c.email||repetido[2]!==hash)falhar_('SOLICITACAO_CONFLITANTE');med.marcar('validacao_leitura');med.gravacaoIniciada=true;atualizarViagemVisoes_(ss,c,row,eventos);med.marcar('relatorios');SpreadsheetApp.flush();med.marcar('confirmacao');return {viagem:viagemPublica_(row,eventos),repetida:true};}
    if(!Number.isInteger(d.revisao)||d.revisao!==s.revisao)falhar_('REGISTRO_ATUALIZADO');
    if(['ENTRADA','RETER'].includes(acao)&&!['AGUARDANDO_ENTRADA','PENDENTE_AVALIACAO','AGUARDANDO_AUTORIZACAO','LIBERADO'].includes(s.status))falhar_('TRANSICAO_INVALIDA');
    if(acao==='RETER'&&!dados.divergencia)falhar_('CAMPO_OBRIGATORIO:divergencia');
    if(['APROVAR','REJEITAR'].includes(acao)&&!['AGUARDANDO_AUTORIZACAO','PENDENTE_AVALIACAO'].includes(s.status))falhar_('TRANSICAO_INVALIDA');
    if(acao==='ENTRADA'){
      if(['PENDENTE_AVALIACAO','AGUARDANDO_AUTORIZACAO'].includes(s.status))falhar_('APROVACAO_NECESSARIA');
      if((temNaoConforme_(dados.checklist)||dados.divergencia)&&s.status!=='LIBERADO')falhar_('APROVACAO_NECESSARIA');
      if(s.status==='LIBERADO'&&s.retencao&&JSON.stringify(dados.checklist)!==JSON.stringify(s.retencao.checklist))falhar_('NOVA_AVALIACAO_NECESSARIA');
      if(s.status==='LIBERADO'&&dados.divergencia&&(!s.retencao||dados.divergencia!==s.retencao.divergencia))falhar_('NOVA_AVALIACAO_NECESSARIA');
    }
    if(acao==='SAIDA'&&s.status!=='DENTRO_UNIDADE')falhar_('TRANSICAO_INVALIDA');
    const event=[Utilities.getUuid(),key,hash,id,r.unidade.Codigo,c.pais.Pais,acao,new Date().toISOString(),c.email,c.usuario.Nome||c.email,JSON.stringify(dados)];
    if(event[10].length>45000)falhar_('ANEXO_MUITO_GRANDE');
    med.marcar('validacao_leitura');med.gravacaoIniciada=true;
    const sh=ss.getSheetByName('Eventos_v3');sh.getRange(sh.getLastRow()+1,1,1,event.length).setNumberFormat('@').setValues([event.map(celulaTexto_)]);
    eventos.push(event);med.marcar('gravacao');atualizarViagemVisoes_(ss,c,row,eventos);med.marcar('relatorios');SpreadsheetApp.flush();med.marcar('confirmacao');return {viagem:viagemPublica_(row,eventos),repetida:false};
  }finally{lock.releaseLock();}
}
function validarFotoLacre_(v){const s=textoChegada_(v,'fotoLacre',40000,false);if(s&&!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(s))falhar_('FOTO_INVALIDA');if(s&&s.indexOf('data:image/jpeg;base64,/9j/')!==0)falhar_('FOTO_INVALIDA');return s;}
function salvarFotoLacre_(ss,row,foto,key){
  const image=validarFotoLacre_(foto);if(!image)return;
  const sh=ss.getSheetByName('Fotos_v3');
  const count=sh.getLastRow()-1;
  // Procura só os metadados; não transfere as imagens de todas as viagens.
  const meta=count>0?sh.getRange(2,1,count,4).getDisplayValues():[];
  const index=meta.findIndex(x=>x[0]===row[0]);
  if(index>=0){
    const existing=meta[index];
    if(existing[1]!==key||existing[2]!==row[4]||existing[3]!==row[3]||sh.getRange(index+2,5).getDisplayValue()!==image)falhar_('SOLICITACAO_CONFLITANTE');
    return;
  }
  sh.getRange(sh.getLastRow()+1,1,1,5).setNumberFormat('@').setValues([[row[0],key,row[4],row[3],image]]);
}
function obterFotoLacreBackend(codigo,id){const r=contextoUnidade_(codigo),ss=planilhaPais_(r.contexto);viagemAutorizada_(ss,r.contexto,codigo,textoChegada_(id,'id',100,true));const sh=ss.getSheetByName('Fotos_v3');conferirCabecalho_(sh,FOTO_HEADERS_);if(sh.getLastRow()<2)return '';const row=sh.getRange(2,1,sh.getLastRow()-1,5).getDisplayValues().find(x=>x[0]===id&&x[2]===codigo&&x[3]===r.contexto.pais.Pais);return row?row[4]:'';}
function checklistTexto_(chk){if(!chk)return '';const labels={mecanica:'Condição mecânica',fluidos:'Ausência de vazamentos',pneus:'Pneus',estrutura:'Estrutura',luzes:'Luzes',espelhos:'Espelhos',interior:'Interior da carreta',cobertura:'Travessas/grades/lona',outros:'Outras condições',container:'Contêiner',reserva:'Pneu reserva',compuertas:'Portas/ancoragens/soldas',extintor:'Extintor',veiculo:'Veículo',carga:'Carga',lacres:'Lacres'};const estados={CONFORME:'Conforme',NAO_CONFORME:'Não conforme',NA:'N/A'};return Object.keys(chk).map(k=>(labels[k]||k)+': '+(estados[chk[k].estado]||chk[k].estado)+(chk[k].causa?' ('+chk[k].causa+')':'')).join(' | ');}
/** Índice em memória: evita percorrer o histórico inteiro para cada viagem. */
function indiceEventos_(eventos){const index=Object.create(null);eventos.forEach(e=>(index[e[3]]||(index[e[3]]=[])).push(e));return index;}
function temFotoLacre_(ss,id){const sh=ss.getSheetByName('Fotos_v3'),count=sh.getLastRow()-1;return count>0&&sh.getRange(2,1,count,1).getDisplayValues().some(x=>x[0]===id);}
function linhasVisoesViagem_(row,eventos,c,foto){
  const s=estadoViagem_(row,eventos),en=s.entrada,ex=s.saida;
  const base=[row[0],row[4],ESTADOS_TEXTO_[s.status]||s.status,row[7],row[8],FIN_BR_[row[12]]||row[12],row[16],row[14],row[13],row[17],row[18],row[19],row[11],JSON.parse(row[23]||'[]').join('; '),JSON.parse(row[24]||'[]').join('; '),foto?'Disponível no sistema':''];
  const df=utc=>utc?Utilities.formatDate(new Date(utc),c.pais.Fuso,'yyyy-MM-dd'):'',hf=utc=>utc?Utilities.formatDate(new Date(utc),c.pais.Fuso,'HH:mm:ss'):'';
  const ent=base.concat([df(s.entradaUTC),hf(s.entradaUTC),s.agenteEntrada,en?en.tag:'',duracao_(minutos_(row[6],s.entradaUTC)),en?({PROPRIO:'Próprio',EMPRESTADO:'Emprestado',NA:'Não se aplica'}[en.calco]||en.calco):'',s.divergencia+(s.autorizacao?' | '+s.autorizacao.dados.justificativa:''),s.autorizadoPor,checklistTexto_(en?en.checklist:s.retencao?s.retencao.checklist:null)]);
  const ext=ent.concat([df(s.saidaUTC),hf(s.saidaUTC),s.agenteSaida,duracao_(minutos_(s.entradaUTC,s.saidaUTC)),ex?ex.destino:'',ex?ex.faturas.join('; '):'',ex?ex.lacres.join('; '):'',checklistTexto_(ex?ex.checklist:null)]);
  return [base,ent,ext];
}
function linkFotoLacre_(sh,linha,row){
  if(typeof ScriptApp==='undefined'||typeof SpreadsheetApp.newRichTextValue!=='function')return;
  const url=ScriptApp.getService().getUrl();
  if(url)sh.getRange(linha,16).setRichTextValue(SpreadsheetApp.newRichTextValue().setText('Ver foto do lacre').setLinkUrl(url+'?unidade='+encodeURIComponent(row[1])+'&viagem='+encodeURIComponent(row[0])).build());
}
/** Caminho normal de gravação: somente a linha da viagem em cada uma das três abas. */
function atualizarViagemVisoes_(ss,c,row,eventos,foto){
  if(c.pais.Pais!=='BR')return;
  const temFoto=typeof foto==='boolean'?foto:temFotoLacre_(ss,row[0]);
  const relacionados=eventos.filter(e=>e[3]===row[0]&&e[4]===row[4]&&e[5]===row[3]);
  const dados=linhasVisoesViagem_(row,relacionados,c,temFoto);
  ['Chegadas_BR','Entradas_BR','Saidas_BR'].forEach((nome,i)=>{
    const sh=ss.getSheetByName(nome),count=sh.getLastRow()-1;
    const ids=count>0?sh.getRange(2,1,count,1).getDisplayValues():[];
    let linha=0;
    ids.forEach((x,j)=>{if(x[0]===row[0]){if(linha)falhar_('VISAO_ID_DUPLICADO');linha=j+2;}});
    if(!linha)linha=sh.getLastRow()+1;
    sh.getRange(linha,1,1,dados[i].length).setNumberFormat('@').setValues([dados[i].map(celulaTexto_)]);
    if(temFoto)linkFotoLacre_(sh,linha,dados[i]);
  });
}
/** Reconstrução completa fica restrita à preparação administrativa. */
function atualizarVisoes_(ss,c){
  if(c.pais.Pais!=='BR')return;
  const schemas=schemasV3_('BR');
  ['Chegadas_BR','Entradas_BR','Saidas_BR'].forEach(n=>conferirCabecalho_(ss.getSheetByName(n),schemas[n]));
  const eventos=indiceEventos_(eventosV3_(ss)),shFoto=ss.getSheetByName('Fotos_v3');conferirCabecalho_(shFoto,FOTO_HEADERS_);
  const fotos=new Set(shFoto.getLastRow()>1?shFoto.getRange(2,1,shFoto.getLastRow()-1,1).getDisplayValues().map(x=>x[0]):[]);
  const resultado=[[],[],[]];
  rowsChegadas_(ss).rows.filter(r=>r[3]==='BR').forEach(row=>{
    const dados=linhasVisoesViagem_(row,eventos[row[0]]||[],c,fotos.has(row[0]));
    dados.forEach((r,i)=>resultado[i].push(r));
  });
  ['Chegadas_BR','Entradas_BR','Saidas_BR'].forEach((nome,i)=>{
    const sh=ss.getSheetByName(nome),rows=resultado[i],old=sh.getLastRow()-1;
    if(rows.length)sh.getRange(2,1,rows.length,schemas[nome].length).setNumberFormat('@').setValues(rows.map(r=>r.map(celulaTexto_)));
    rows.forEach((r,j)=>{if(fotos.has(r[0]))linkFotoLacre_(sh,j+2,r);});
    if(old>rows.length)sh.getRange(rows.length+2,1,old-rows.length,schemas[nome].length).clearContent();
  });
}

/** Medições do código executado no servidor; não incluem transporte/inicialização do Apps Script. */
function acaoMedicao_(acao){return ['ENTRADA','SAIDA','RETER','APROVAR','REJEITAR'].includes(acao)?acao:'MOVIMENTO';}
function medirOperacao_(acao,dados,executar){
  const inicio=Date.now();let ultimo=inicio;const etapas={};
  const med={gravacaoIniciada:false,marcar(nome){const agora=Date.now();etapas[nome]=(etapas[nome]||0)+Math.max(0,agora-ultimo);ultimo=agora;}};
  function finalizar(sucesso){med.marcar('finalizacao');const m={versao:'0.7',acao,servidorMs:Math.max(0,Date.now()-inicio),etapas,gravacaoIniciada:med.gravacaoIniciada};
    console.log(JSON.stringify({evento:'DESEMPENHO_LOGISTICA',acao,sucesso,servidorMs:m.servidorMs,etapas}));return m;}
  try{const r=executar(dados,med);return Object.assign(r,{medicoes:finalizar(true)});}
  catch(e){e.medicoes=finalizar(false);throw e;}
}
/** Envelope da fila: somente confirma sucesso após a gravação real e o flush. */
function enviarOperacaoBackend(pedido){
  try{
    if(!pedido||!['CHEGADA','MOVIMENTO'].includes(pedido.tipo))falhar_('REQUISICAO_INVALIDA');
    const resultado=pedido.tipo==='CHEGADA'?registrarChegadaBackend(pedido.dados):registrarMovimentoBackend(pedido.dados);
    return {ok:true,resultado,medicoes:resultado.medicoes};
  }catch(e){const raw=String(e.message||'');const prefix=raw.split(':')[0];const codigo=/^[A-Z][A-Z0-9_]{1,70}$/.test(prefix)?prefix:'ERRO_SERVIDOR';
    return {ok:false,erro:{codigo,gravacaoIniciada:e.medicoes?e.medicoes.gravacaoIniciada:true},medicoes:e.medicoes||null};}
}
