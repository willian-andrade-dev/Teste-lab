/** Fonte de estados: eventos anexados. Abas de apresentação podem ser reconstruídas. */
const EVENTO_HEADERS_=['ID Evento','Solicitacao','Hash','ID Viagem','Unidade','Pais','Acao','Instante UTC','Autor','Nome','Dados'];
const FOTO_HEADERS_=['ID Viagem','Solicitacao','Unidade','Pais','Imagem'];
const BASE_BR_=['ID Viagem','Unidade','Status Atual','Data Chegada','Hora Chegada','Finalidade','Transportadora','Nome Motorista','CPF','Placa Cavalo','Placa Carreta','Placa Carreta 2','Agente Chegada','NF Chegada','Lacre Origem','Foto Lacre'];
const ENTRADA_BR_=BASE_BR_.concat(['Data Entrada','Hora Entrada','Agente Entrada','N° TAG','Tempo Retenção','Controle Calço','Divergência / Liberação','Autorizado por','Checklist Entrada']);
const SAIDA_ANTERIOR_BR_=ENTRADA_BR_.concat(['Data Saída','Hora Saída','Agente Saída','Tempo Permanência','Destino','NF Saída','Lacre Saída','Checklist Saída']);
const SAIDA_BR_=SAIDA_ANTERIOR_BR_.concat(['Carreta Saída','Carreta 2 Saída','Foto Lacre Saída']);
const CHECK_BR_=['mecanica','fluidos','pneus','estrutura','luzes','espelhos','interior','cobertura','outros','epi_colete','epi_bota','epi_capacete'];
const CHECK_CO_=['container','pneus','reserva','compuertas','extintor','epi_colete','epi_bota','epi_capacete'];
const CHECK_NA_=['interior','cobertura','outros','container','compuertas','carga','lacres'];
const CHECK_SAIDA_=['veiculo','carga','lacres'];
const ESTADOS_TEXTO_={AGUARDANDO_ENTRADA:'Aguardando entrada — fora da planta',PENDENTE_AVALIACAO:'Pendente de avaliação — fora da planta',AGUARDANDO_AUTORIZACAO:'Aguardando autorização — fora da planta',LIBERADO:'Liberado — aguardando entrada',DENTRO_UNIDADE:'Dentro da planta',CONCLUIDO:'Concluído',RECUSADO:'Recusado — fora da planta'};
const FIN_BR_={COLETA:'Coleta',DEVOLUCAO:'Devolução',TRANSFERENCIA:'Transferência',MOV_PALLET:'Movimentação de pallet',BR14:'BR14 (FTA) - Galpão E'};
function schemasV3_(pais){const s={Eventos_v3:EVENTO_HEADERS_,Fotos_v3:FOTO_HEADERS_,Fotos_Saida_v1:FOTO_HEADERS_,SolicitacoesCanceladas_v1:CANCELAMENTO_HEADERS_};if(pais==='BR')Object.assign(s,{Controle_BR:SAIDA_BR_});return s;}
function validarEstruturaV3_(ss,pais){const schemas=schemasV3_(pais);Object.keys(schemas).forEach(n=>conferirCabecalho_(ss.getSheetByName(n),schemas[n]));}
function prepararOperacao(){
  prepararOperacaoBase_();
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{const c=iniciarSessao_();if(c.usuario.Perfil!=='ADMINISTRADOR')falhar_('ACESSO_NEGADO');const ss=planilhaPais_(c),schemas=schemasV3_(c.pais.Pais);
    const control=ss.getSheetByName('Controle_BR');if(c.pais.Pais==='BR'&&control&&control.getLastColumn()===33){conferirCabecalho_(control,SAIDA_ANTERIOR_BR_);garantirTamanhoControle_(control,2,36);control.getRange(1,1,1,36).setValues([SAIDA_BR_]);}
    Object.keys(schemas).forEach(n=>{const sh=ss.getSheetByName(n);if(sh&&sh.getLastRow())conferirCabecalho_(sh,schemas[n]);});
    Object.keys(schemas).forEach(n=>{const sh=ss.getSheetByName(n)||ss.insertSheet(n);if(n==='Controle_BR')garantirTamanhoControle_(sh,2,36);if(!sh.getLastRow()){sh.getRange(1,1,1,schemas[n].length).setValues([schemas[n]]).setFontWeight('bold');sh.setFrozenRows(1);}});
    atualizarVisoes_(ss,c);
    if(c.pais.Pais==='BR'){
      ss.getSheetByName('Controle_BR').showSheet();
      formatarControleBrasil_(ss.getSheetByName('Controle_BR'));
      ['Chegadas_BR','Entradas_BR','Saidas_BR'].forEach(n=>{const antiga=ss.getSheetByName(n);if(antiga)antiga.hideSheet();});
      ['Chegadas_v2','Eventos_v3','Fotos_v3','Fotos_Saida_v1','SolicitacoesCanceladas_v1'].forEach(n=>ss.getSheetByName(n).hideSheet());
    }
    formatarAbasApoio_(ss,c.pais.Pais);
    console.log('Pasta privada de fotos '+c.pais.Pais+': '+pastaFotosPais_(c.pais.Pais).getUrl());
    SpreadsheetApp.flush();console.log('Versão 0.15 preparada para '+c.pais.Pais+'. Registros existentes preservados.');
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
function viagemPublica_(row,eventos){const s=estadoViagem_(row,eventos);return Object.assign(resumoChegada_(row),{placa3:row[19],temFotoLacreSaida:!!(s.saida&&s.saida.fotoLacreHash),temFotoLacre:!!(s.entrada&&s.entrada.fotoLacreHash),faturas:JSON.parse(row[23]||'[]'),lacres:JSON.parse(row[24]||'[]'),status:s.status,revisao:s.revisao,entrada:entradaPublica_(s.entrada),retencao:entradaPublica_(s.retencao),divergencia:s.divergencia,autorizadoPor:s.autorizadoPor,entradaUTC:s.entradaUTC,saidaUTC:s.saidaUTC,retencaoMin:minutos_(row[6],s.entradaUTC),permanenciaMin:minutos_(s.entradaUTC,s.saidaUTC)});}
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
  const photoSheet=ss.getSheetByName('Fotos_v3'),photoCount=photoSheet?photoSheet.getLastRow()-1:0;const fotos=new Set(photoCount>0?photoSheet.getRange(2,1,photoCount,1).getDisplayValues().map(x=>x[0]):[]);
  const all=rows.map(x=>Object.assign(viagemPublica_(x,indice[x[0]]||[]),{temFotoLacre:fotos.has(x[0]),transferenciaRecebida:x[1].indexOf('transf-')===0})).reverse();
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
  const out={};keys.forEach(k=>{const x=v[k];if(!x||!['CONFORME','NAO_CONFORME','NA'].includes(x.estado)||(x.estado==='NA'&&!CHECK_NA_.includes(k)))falhar_('CHECKLIST_INCOMPLETO');const causa=textoChegada_(x.causa,k,300,x.estado==='NAO_CONFORME');out[k]={estado:x.estado,causa:x.estado==='NAO_CONFORME'?causa:''};});return out;
}
function temNaoConforme_(chk){return Object.keys(chk).some(k=>chk[k].estado==='NAO_CONFORME');}
function dadosEntrada_(d,c,unidade,keysLegadas=null){
  const checklist=validarChecklist_(d.checklist,keysLegadas||(c.pais.Pais==='BR'?CHECK_BR_:CHECK_CO_));
  const imigrantes=c.pais.Pais==='BR'&&/IMIGRANTES/i.test(unidade.Codigo+' '+unidade.Nome);
  const tag=textoChegada_(d.tag,'tag',60,false);if(tag&&!imigrantes)falhar_('TAG_NAO_APLICAVEL');
  const calco=c.pais.Pais==='BR'?textoChegada_(d.calco,'calco',20,true):'NA';if(!['PROPRIO','EMPRESTADO','NA'].includes(calco))falhar_('CAMPO_INVALIDO:calco');
  const divergencia=textoChegada_(d.divergencia,'divergencia',2000,temNaoConforme_(checklist));
  const assinaturas={motorista:assinatura_(d.assinaturaMotorista,true),guarda:assinatura_(d.assinaturaGuarda,true)};
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
    conferirNaoCancelada_(ss,key,c,r.unidade.Codigo,'MOVIMENTO');
    const row=viagemAutorizada_(ss,c,r.unidade.Codigo,id),eventos=eventosV3_(ss),s=estadoViagem_(row,eventos);
    const todas=rowsChegadas_(ss).rows;
    const acao=textoChegada_(d.acao,'acao',15,true),anterior=eventos.find(e=>e[1]===key);const dadosAnteriores=anterior?JSON.parse(anterior[10]):null;let dados;
    const keysLegadas=anterior&&anterior[8]===c.email&&['ENTRADA','RETER'].includes(acao)&&dadosAnteriores.checklist?Object.keys(dadosAnteriores.checklist):null;
    if(['ENTRADA','RETER'].includes(acao))dados=dadosEntrada_(d,c,r.unidade,keysLegadas);
    else if(['APROVAR','REJEITAR'].includes(acao)){
      if(!['GERENTE','ADMINISTRADOR'].includes(c.usuario.Perfil))falhar_('ACESSO_NEGADO');
      dados={justificativa:textoChegada_(d.justificativa,'justificativa',2000,true)};
    }else if(acao==='SAIDA'){
      const checklist=validarChecklist_(d.checklist,CHECK_SAIDA_);
      const carregado=textoChegada_(d.carregado,'carregado',3,true);if(!['SIM','NAO'].includes(carregado))falhar_('CAMPO_INVALIDO:carregado');
      if(carregado==='SIM'&&['carga','lacres'].some(k=>checklist[k].estado==='NA'))falhar_('CHECKLIST_INVALIDO');
      // Nesta etapa divergência na saída bloqueia conclusão; não há liberação tácita.
      if(temNaoConforme_(checklist))falhar_('SAIDA_DIVERGENTE');
      const devolucao=s.entrada&&s.entrada.calco==='EMPRESTADO'?textoChegada_(d.devolucaoCalco,'devolucaoCalco',3,true):'NA';
      if(!['SIM','NAO','NA'].includes(devolucao)||(s.entrada&&s.entrada.calco==='EMPRESTADO'&&devolucao!=='SIM'))falhar_('CALCO_NAO_DEVOLVIDO');
      dados={checklist,carregado,destino:carregado==='SIM'?textoChegada_(d.destino,'destino',160,true):'',faturas:listaChegada_(d.faturas||[],'faturas',carregado==='SIM'),lacres:listaChegada_(d.lacres||[],'lacres',carregado==='SIM'),devolucaoCalco:devolucao,observacao:textoChegada_(d.observacao,'observacao',2000,false)};
      if(carregado==='NAO'&&dados.lacres.length&&!dados.faturas.length)falhar_('CAMPO_OBRIGATORIO:faturas');
    }else falhar_('ACAO_INVALIDA');
    if(acao==='SAIDA'&&c.pais.Pais==='BR'&&d.destinoCodigo){const destino=validarDestinoBR_(c,r.unidade,d,anterior);dados.destino=destino.nome;dados.destinoCodigo=destino.codigo;}
    if(acao==='SAIDA'&&(!anterior||Object.prototype.hasOwnProperty.call(dadosAnteriores,'placasCarretasSaida')))dados.placasCarretasSaida=d.trocarCarretas==='SIM'?(Array.isArray(d.placasCarretasSaida)?d.placasCarretasSaida.map(placaPatio_):[]):row.slice(18,20).filter(Boolean);
    const foto=['ENTRADA','SAIDA'].includes(acao)?validarFotoLacre_(d.fotoLacre):'';
    const exigeFoto=(acao==='ENTRADA'&&JSON.parse(row[23]||'[]').length>0)||(acao==='SAIDA'&&dados.lacres.length>0&&(!anterior||!!dadosAnteriores.fotoLacreHash));
    if(exigeFoto&&!foto)falhar_('FOTO_OBRIGATORIA');
    if((acao==='ENTRADA'&&!exigeFoto&&foto)||(acao==='SAIDA'&&foto&&!dados.lacres.length)||(!['ENTRADA','SAIDA'].includes(acao)&&d.fotoLacre))falhar_('FOTO_NAO_APLICAVEL');
    if(foto)dados.fotoLacreHash=hashV3_(foto);
    const hash=hashV3_({acao,dados});const repetido=eventos.find(e=>e[1]===key);
    if(repetido){if(repetido[3]!==id||repetido[4]!==r.unidade.Codigo||repetido[5]!==c.pais.Pais||repetido[8]!==c.email||repetido[2]!==hash)falhar_('SOLICITACAO_CONFLITANTE');med.marcar('validacao_leitura');med.gravacaoIniciada=true;if(foto)salvarFotoLacre_(ss,row,foto,key,true,acao==='SAIDA'?'SAIDA':'ENTRADA');atualizarViagemVisoes_(ss,c,row,eventos);if(acao==='SAIDA')encaminharTransferencia_(ss,c,row,repetido||eventos[eventos.length-1],eventos);med.marcar('relatorios');SpreadsheetApp.flush();med.marcar('confirmacao');return {viagem:viagemPublica_(row,eventos),repetida:true};}
    if(!Number.isInteger(d.revisao)||d.revisao!==s.revisao)falhar_('REGISTRO_ATUALIZADO');
    if(['ENTRADA','RETER'].includes(acao)&&!['AGUARDANDO_ENTRADA','PENDENTE_AVALIACAO','AGUARDANDO_AUTORIZACAO','LIBERADO'].includes(s.status))falhar_('TRANSICAO_INVALIDA');
    if(acao==='RETER'&&!dados.divergencia)falhar_('CAMPO_OBRIGATORIO:divergencia');
    if(['APROVAR','REJEITAR'].includes(acao)&&!['AGUARDANDO_AUTORIZACAO','PENDENTE_AVALIACAO'].includes(s.status))falhar_('TRANSICAO_INVALIDA');
    if(acao==='SAIDA'&&(!anterior||Object.prototype.hasOwnProperty.call(dadosAnteriores,'placasCarretasSaida')))dados.placasCarretasSaida=placasSaida_(d,row,todas,eventos);
    if(acao==='ENTRADA'){
      const dentro=carretasPatio_(todas,eventos,c.pais.Pais);if(row.slice(18,20).filter(Boolean).some(p=>dentro.some(x=>x.placa===p)))falhar_('CARRETA_JA_DENTRO');
      if(['PENDENTE_AVALIACAO','AGUARDANDO_AUTORIZACAO'].includes(s.status))falhar_('APROVACAO_NECESSARIA');
      if((temNaoConforme_(dados.checklist)||dados.divergencia)&&s.status!=='LIBERADO')falhar_('APROVACAO_NECESSARIA');
      if(s.status==='LIBERADO'&&s.retencao&&JSON.stringify(dados.checklist)!==JSON.stringify(s.retencao.checklist))falhar_('NOVA_AVALIACAO_NECESSARIA');
      if(s.status==='LIBERADO'&&dados.divergencia&&(!s.retencao||dados.divergencia!==s.retencao.divergencia))falhar_('NOVA_AVALIACAO_NECESSARIA');
    }
    if(acao==='SAIDA'&&s.status!=='DENTRO_UNIDADE')falhar_('TRANSICAO_INVALIDA');
    if(acao==='SAIDA'&&dados.destinoCodigo)conferirDestinoLivre_(todas,eventos,row,dados);
    const event=[Utilities.getUuid(),key,hash,id,r.unidade.Codigo,c.pais.Pais,acao,new Date().toISOString(),c.email,c.usuario.Nome||c.email,JSON.stringify(dados)];
    if(event[10].length>45000)falhar_('ANEXO_MUITO_GRANDE');
    med.marcar('validacao_leitura');med.gravacaoIniciada=true;
    const sh=ss.getSheetByName('Eventos_v3');sh.getRange(sh.getLastRow()+1,1,1,event.length).setNumberFormat('@').setValues([event.map(celulaTexto_)]);
    eventos.push(event);if(foto)salvarFotoLacre_(ss,row,foto,key,true,acao==='SAIDA'?'SAIDA':'ENTRADA');med.marcar('gravacao');atualizarViagemVisoes_(ss,c,row,eventos);if(acao==='SAIDA')encaminharTransferencia_(ss,c,row,repetido||eventos[eventos.length-1],eventos);med.marcar('relatorios');SpreadsheetApp.flush();med.marcar('confirmacao');return {viagem:viagemPublica_(row,eventos),repetida:false};
  }finally{lock.releaseLock();}
}
function validarFotoLacre_(v){const s=textoChegada_(v,'fotoLacre',40000,false);if(s&&!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(s))falhar_('FOTO_INVALIDA');if(s&&s.indexOf('data:image/jpeg;base64,/9j/')!==0)falhar_('FOTO_INVALIDA');return s;}
function salvarFotoLacre_(ss,row,foto,key,entrada=false,etapa='ENTRADA'){
  const image=validarFotoLacre_(foto);if(!image)return;
  const sh=ss.getSheetByName(etapa==='SAIDA'?'Fotos_Saida_v1':'Fotos_v3');
  const count=sh.getLastRow()-1;
  // Procura só os metadados; não transfere as imagens de todas as viagens.
  const meta=count>0?sh.getRange(2,1,count,4).getDisplayValues():[];
  const index=meta.findIndex(x=>x[0]===row[0]);
  if(index>=0){
    const existing=meta[index];
    if(existing[2]!==row[4]||existing[3]!==row[3])falhar_('SOLICITACAO_CONFLITANTE');
    if(existing[1]===key){if(imagemFotoArmazenada_(sh.getRange(index+2,5).getDisplayValue(),row[3])!==image)falhar_('SOLICITACAO_CONFLITANTE');return;}
    if(!entrada)falhar_('SOLICITACAO_CONFLITANTE');
    gravarReferenciaFotoDrive_(sh,index+2,row,key,image,etapa);return;
  }
  gravarReferenciaFotoDrive_(sh,sh.getLastRow()+1,row,key,image,etapa);
}
function obterFotoLacreBackend(codigo,id,etapa='ENTRADA'){if(!['ENTRADA','SAIDA'].includes(etapa))falhar_('FOTO_INVALIDA');const r=contextoUnidade_(codigo),ss=planilhaPais_(r.contexto);viagemAutorizada_(ss,r.contexto,codigo,textoChegada_(id,'id',100,true));const sh=ss.getSheetByName(etapa==='SAIDA'?'Fotos_Saida_v1':'Fotos_v3');conferirCabecalho_(sh,FOTO_HEADERS_);if(sh.getLastRow()<2)return '';const row=sh.getRange(2,1,sh.getLastRow()-1,5).getDisplayValues().find(x=>x[0]===id&&x[2]===codigo&&x[3]===r.contexto.pais.Pais);return row?imagemFotoArmazenada_(row[4],r.contexto.pais.Pais):'';}
function checklistTexto_(chk){if(!chk)return '';const labels={mecanica:'Condição mecânica',fluidos:'Ausência de vazamentos',pneus:'Pneus',estrutura:'Estrutura',luzes:'Luzes',espelhos:'Espelhos',interior:'Interior da carreta',cobertura:'Travessas/grades/lona',outros:'Outras condições',container:'Contêiner',reserva:'Pneu reserva',compuertas:'Portas/ancoragens/soldas',extintor:'Extintor',epi_colete:'Colete refletivo',epi_bota:'Bota de segurança',epi_capacete:'Capacete',veiculo:'Veículo',carga:'Carga',lacres:'Lacres'};const estados={CONFORME:'Conforme',NAO_CONFORME:'Não conforme',NA:'N/A'};return Object.keys(chk).map(k=>(labels[k]||k)+': '+(estados[chk[k].estado]||chk[k].estado)+(chk[k].causa?' ('+chk[k].causa+')':'')).join(' | ');}
/** Índice em memória: evita percorrer o histórico inteiro para cada viagem. */
function indiceEventos_(eventos){const index=Object.create(null);eventos.forEach(e=>(index[e[3]]||(index[e[3]]=[])).push(e));return index;}
function temFotoLacre_(ss,id){const sh=ss.getSheetByName('Fotos_v3'),count=sh.getLastRow()-1;return count>0&&sh.getRange(2,1,count,1).getDisplayValues().some(x=>x[0]===id);}
function linhasVisoesViagem_(row,eventos,c,foto,urlFoto='',urlSaida=''){
  const s=estadoViagem_(row,eventos),en=s.entrada,ex=s.saida;
  const chegada=resumoChegada_(row);
  const base=[row[0],row[4],ESTADOS_TEXTO_[s.status]||s.status,chegada.data,chegada.hora,FIN_BR_[row[12]]||row[12],row[16],row[14],row[13],row[17],row[18],row[19],row[11],JSON.parse(row[23]||'[]').join('; '),JSON.parse(row[24]||'[]').join('; '),foto?(urlFoto||'Foto antiga: executar atualizarLinksFotos'):''];
  const df=utc=>utc?Utilities.formatDate(new Date(utc),fusoOperacional_(c),'yyyy-MM-dd'):'',hf=utc=>utc?Utilities.formatDate(new Date(utc),fusoOperacional_(c),'HH:mm:ss'):'';
  const ent=base.concat([df(s.entradaUTC),hf(s.entradaUTC),s.agenteEntrada,en?en.tag:'',duracao_(minutos_(row[6],s.entradaUTC)),en?({PROPRIO:'Próprio',EMPRESTADO:'Emprestado',NA:'Não se aplica'}[en.calco]||en.calco):'',s.divergencia+(s.autorizacao?' | '+s.autorizacao.dados.justificativa:''),s.autorizadoPor,checklistTexto_(en?en.checklist:s.retencao?s.retencao.checklist:null)]);
  const ext=ent.concat([df(s.saidaUTC),hf(s.saidaUTC),s.agenteSaida,duracao_(minutos_(s.entradaUTC,s.saidaUTC)),ex?ex.destino:'',ex?ex.faturas.join('; '):'',ex?ex.lacres.join('; '):'',checklistTexto_(ex?ex.checklist:null)]);
  const placas=ex?(Array.isArray(ex.placasCarretasSaida)?ex.placasCarretasSaida:row.slice(18,20).filter(Boolean)):[];return [base,ent,ext.concat([placas[0]||'',placas[1]||'',urlSaida])];
}
function linkFotoLacre_(sh,linha,row,urlDireta,etapa='ENTRADA'){const coluna=etapa==='SAIDA'?36:16;
  if(urlDireta){sh.getRange(linha,coluna).setRichTextValue(SpreadsheetApp.newRichTextValue().setText(urlDireta).setLinkUrl(urlDireta).build());return;}
  if(typeof ScriptApp==='undefined')return;
  const url=ScriptApp.getService().getUrl();
  if(url)sh.getRange(linha,coluna).setRichTextValue(SpreadsheetApp.newRichTextValue().setText('Ver foto do lacre').setLinkUrl(url+'?unidade='+encodeURIComponent(row[1])+'&viagem='+encodeURIComponent(row[0])).build());
}
/** A gravação atualiza somente uma linha do relatório consolidado. */
function atualizarViagemVisoes_(ss,c,row,eventos,foto){
  if(c.pais.Pais!=='BR')return;
  const temFoto=typeof foto==='boolean'?foto:temFotoLacre_(ss,row[0]);
  const relacionados=eventos.filter(e=>e[3]===row[0]&&e[4]===row[4]&&e[5]===row[3]);
  const dados=linhasVisoesViagem_(row,relacionados,c,temFoto,temFoto?urlFotoDireta_(ss,row[0]):'',urlFotoDireta_(ss,row[0],'SAIDA'))[2],sh=ss.getSheetByName('Controle_BR'),count=sh.getLastRow()-1;
  const ids=count>0?sh.getRange(2,1,count,1).getDisplayValues():[];let linha=0;
  ids.forEach((x,j)=>{if(x[0]===row[0]){if(linha)falhar_('VISAO_ID_DUPLICADO');linha=j+2;}});
  if(!linha)linha=sh.getLastRow()+1;
  garantirTamanhoControle_(sh,linha,dados.length);
  sh.getRange(linha,1,1,dados.length).setNumberFormat('@').setValues([dados.map(celulaTexto_)]).setWrap(true).setVerticalAlignment('middle').setBackground(linha%2===0?'#ffffff':'#f3f6fa');
  sh.autoResizeRows(linha,1);
  if(temFoto)linkFotoLacre_(sh,linha,dados,urlFotoDireta_(ss,row[0]));
  if(dados[35])linkFotoLacre_(sh,linha,dados,dados[35],'SAIDA');
}
/** Reconstrução administrativa usa as fontes, sem depender dos três relatórios antigos. */
function atualizarVisoes_(ss,c){
  if(c.pais.Pais!=='BR')return;
  const sh=ss.getSheetByName('Controle_BR');conferirCabecalho_(sh,SAIDA_BR_);
  const eventos=indiceEventos_(eventosV3_(ss)),shFoto=ss.getSheetByName('Fotos_v3');conferirCabecalho_(shFoto,FOTO_HEADERS_);
  const fotos=new Set(shFoto.getLastRow()>1?shFoto.getRange(2,1,shFoto.getLastRow()-1,1).getDisplayValues().map(x=>x[0]):[]);
  const rows=rowsChegadas_(ss).rows.filter(r=>r[3]==='BR').map(row=>linhasVisoesViagem_(row,eventos[row[0]]||[],c,fotos.has(row[0]),fotos.has(row[0])?urlFotoDireta_(ss,row[0]):'',urlFotoDireta_(ss,row[0],'SAIDA'))[2]);
  const old=sh.getLastRow()-1;
  garantirTamanhoControle_(sh,Math.max(2,rows.length+1),36);
  if(rows.length)sh.getRange(2,1,rows.length,SAIDA_BR_.length).setNumberFormat('@').setValues(rows.map(r=>r.map(celulaTexto_)));
  rows.forEach((r,j)=>{if(fotos.has(r[0]))linkFotoLacre_(sh,j+2,r,urlFotoDireta_(ss,r[0]));if(r[35])linkFotoLacre_(sh,j+2,r,r[35],'SAIDA');});
  if(old>rows.length)sh.getRange(rows.length+2,1,old-rows.length,SAIDA_BR_.length).clearContent();
}
/** Formatação é executada apenas na preparação; nenhuma reconstrução visual por atendimento. */
function formatarControleBrasil_(sh){
  const total=Math.max(2,sh.getLastRow()),range=sh.getRange(1,1,total,SAIDA_BR_.length);
  sh.getBandings().forEach(b=>b.remove());
  range.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
  range.setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle').setWrap(true);
  sh.setFrozenRows(1);sh.setFrozenColumns(3);sh.setRowHeight(1,64);
  sh.setColumnWidths(1,36,150);sh.setColumnWidth(1,260);sh.setColumnWidth(3,290);
  [7,8,13,19,24,28,30].forEach(c=>sh.setColumnWidth(c,240));
  [14,15,23,31,32].forEach(c=>sh.setColumnWidth(c,300));
  [25,33].forEach(c=>sh.setColumnWidth(c,520));sh.setColumnWidths(34,2,180);sh.setColumnWidth(36,320);
  [[1,3,'#243448'],[4,13,'#b91c2b'],[17,9,'#175a9c'],[26,11,'#236b4a']].forEach(([c,n,color])=>sh.getRange(1,c,1,n).setBackground(color).setFontColor('#ffffff').setFontWeight('bold'));
  if(sh.getFilter())sh.getFilter().remove();range.createFilter();
  if(total>1){sh.setRowHeights(2,total-1,60);sh.autoResizeRows(2,total-1);}
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

function garantirTamanhoControle_(sh,linhas,colunas){const atuais=sh.getMaxRows(),cols=sh.getMaxColumns();if(linhas>atuais)sh.insertRowsAfter(atuais,linhas-atuais);if(colunas>cols)sh.insertColumnsAfter(cols,colunas-cols);}

/** Abas auxiliares dos dois países; Controle_BR mantém sua formatação própria. */
function formatarAbasApoio_(ss,pais){
  const definitions={Chegadas_v2:{headers:CHEGADA_HEADERS_,color:'#b91c2b'},Motoristas_v3:{headers:MOTORISTA_HEADERS_,color:'#175a9c'},Eventos_v3:{headers:EVENTO_HEADERS_,color:'#475569'},Fotos_v3:{headers:FOTO_HEADERS_,color:'#6d3991'},Fotos_Saida_v1:{headers:FOTO_HEADERS_,color:'#6d3991'},SolicitacoesCanceladas_v1:{headers:CANCELAMENTO_HEADERS_,color:'#475569'},Produtos_v2:{headers:CATALOGOS_.Produtos_v2,color:'#236b4a'},Transportadoras_v2:{headers:CATALOGOS_.Transportadoras_v2,color:'#176c80'}};
  Object.keys(definitions).forEach(name=>{const sh=ss.getSheetByName(name);if(!sh)return;const d=definitions[name];conferirCabecalho_(sh,d.headers);const count=Math.max(2,sh.getLastRow()),cols=d.headers.length;garantirTamanhoControle_(sh,count,cols);const gridRows=Math.max(count,sh.getMaxRows()),range=sh.getRange(1,1,gridRows,cols);sh.getBandings().forEach(b=>b.remove());range.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);range.setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle').setWrap(true);sh.setFrozenRows(1);sh.setFrozenColumns(Math.min(2,cols));sh.setColumnWidths(1,cols,180);sh.setRowHeight(1,58);sh.getRange(1,1,1,cols).setBackground(d.color).setFontColor('#ffffff').setFontWeight('bold');if(sh.getFilter())sh.getFilter().remove();range.createFilter();if(count>1){sh.setRowHeights(2,gridRows-1,54);}
    d.headers.forEach((header,i)=>{if(/Motorista|Empresa|Nome|RegistradoPor|Autor|Observacao|Dados|Imagem|Faturas|Lacres|Remitos|Produtos/.test(header))sh.setColumnWidth(i+1,/Dados|Observacao/.test(header)?480:300);});
    if(name==='Eventos_v3')sh.getRange(2,11,gridRows-1,1).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    else if(['Fotos_v3','Fotos_Saida_v1'].includes(name))sh.getRange(2,5,gridRows-1,1).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    else sh.autoResizeRows(2,count-1);
  });
}

/** Destinos internos usam o código autorizado; outros destinos não geram recebimento automático. */
function destinosBR_(c,unidade){
 const labels=['Imigrantes','Anchieta','Jaguaré'];
 const normal=v=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 return labels.map(nome=>{const u=c.origens.find(x=>normal(x.Codigo+' '+x.Nome).includes(normal(nome)));return u&&u.Codigo!==unidade.Codigo?{codigo:u.Codigo,nome}:null;}).filter(Boolean).concat(['RCR','Gylog','CD Nysseis','K&G','Provider'].map(nome=>({codigo:'EXTERNO-'+nome,nome})),[{codigo:'OUTRO',nome:'Outro'}]);
}
function validarDestinoBR_(c,unidade,d,anterior){
 if(d.carregado!=='SIM')falhar_('DESTINO_INVALIDO');
 const selected=destinosBR_(c,unidade).find(x=>x.codigo===d.destinoCodigo);
 if(!selected)falhar_('DESTINO_INVALIDO');
 return {codigo:selected.codigo,nome:selected.codigo==='OUTRO'?textoChegada_(d.destino,'destino',160,true):selected.nome};
}
function destinoInterno_(dados){return dados.destinoCodigo&&!dados.destinoCodigo.startsWith('EXTERNO-')&&dados.destinoCodigo!=='OUTRO';}
function conferirDestinoLivre_(rows,eventos,row,dados){
 if(!destinoInterno_(dados))return;
 const placas=[row[17],...(dados.placasCarretasSaida||[])];
 if(rows.some(x=>x[3]===row[3]&&x[4]===dados.destinoCodigo&&!['CONCLUIDO','RECUSADO'].includes(estadoViagem_(x,eventos).status)&&(x[13]===row[13]||x.slice(17,20).filter(Boolean).some(p=>placas.includes(p)))))falhar_('DESTINO_REGISTRO_ATIVO');
}
function chaveTransferencia_(event){return 'transf-'+hashV3_(event[1]).replace(/[^a-zA-Z0-9]/g,'').slice(0,40);}
function encaminharTransferencia_(ss,c,origem,event,eventos){
 const dados=JSON.parse(event[10]);if(origem[3]!=='BR'||!destinoInterno_(dados))return;
 const table=rowsChegadas_(ss),key=chaveTransferencia_(event);let row=table.rows.find(x=>x[1]===key);
 if(!row){
  row=origem.slice();row[0]='receb-'+key;row[1]=key;row[2]=hashV3_({origem:origem[0],saida:event[0]});row[4]=dados.destinoCodigo;row[5]='AGUARDANDO_ENTRADA';row[6]=event[7];row[7]=Utilities.formatDate(new Date(event[7]),fusoOperacional_(c),'yyyy-MM-dd');row[8]=Utilities.formatDate(new Date(event[7]),fusoOperacional_(c),'HH:mm:ss');row[10]=event[8];row[11]=event[9];row[12]='TRANSFERENCIA';row[18]=(dados.placasCarretasSaida||[])[0]||'';row[19]=(dados.placasCarretasSaida||[])[1]||'';row[23]=JSON.stringify(dados.faturas);row[24]=JSON.stringify(dados.lacres);row[26]=origem[4];row[31]='';row[34]=dados.observacao||'';
  table.sheet.getRange(table.sheet.getLastRow()+1,1,1,row.length).setNumberFormat('@').setValues([row.map(celulaTexto_)]);
 }
 atualizarViagemVisoes_(ss,c,row,eventos);
}
function obterInformacoesTransferenciaBackend(codigo,id){
 const r=contextoUnidade_(codigo),c=r.contexto,ss=planilhaPais_(c),row=viagemAutorizada_(ss,c,r.unidade.Codigo,id);
 if(row[3]!=='BR'||!row[1].startsWith('transf-'))falhar_('ACESSO_NEGADO');
 const events=eventosV3_(ss),event=events.find(e=>e[5]===row[3]&&e[6]==='SAIDA'&&chaveTransferencia_(e)===row[1]&&JSON.parse(e[10]).destinoCodigo===row[4]);
 if(!event)falhar_('ACESSO_NEGADO');const dados=JSON.parse(event[10]),source=rowsChegadas_(ss).rows.find(x=>x[0]===event[3]&&x[4]===event[4]&&x[3]===row[3]);if(!source)falhar_('ACESSO_NEGADO');
 const url=urlFotoDireta_(ss,source[0],'SAIDA');return {origem:(c.origens.find(u=>u.Codigo===source[4])||{}).Nome||source[4],destino:(c.origens.find(u=>u.Codigo===row[4])||{}).Nome||row[4],motorista:row[14],documento:row[13],telefone:row[15],empresa:row[16],placas:row.slice(17,20).filter(Boolean),faturas:dados.faturas,lacres:dados.lacres,observacao:dados.observacao,saida:event[7],fuso:fusoOperacional_(c),foto:url?imagemFotoArmazenada_(url,c.pais.Pais):''};
}
