/** Projeção de leitura: os eventos continuam sendo a fonte do estado de cada viagem. */
const CONTROLE_CO_HEADERS_ = [
  'ID Viaje','Unidad','Estado actual','Fecha llegada','Hora llegada','Finalidad',
  'Transportadora / Empresa','Conductor','Documento','Teléfono','Placa vehículo','Remolque llegada',
  'Oficial llegada','Seguridad social vigente','Infracción','Orden de cargue','Facturas llegada',
  'Sellos llegada','Remitos','Bodega origen','Contenedor','Contenedor confirmado','Comodato',
  'Productos','Área destino','Estado aduanero','Observaciones llegada','Foto sello entrada',
  'Fecha entrada','Hora entrada','Oficial entrada','Espera hasta entrada','Checklist entrada',
  'Versión checklist entrada','Firma conductor','Firma guarda','Divergencias','Autorizado / rechazado por',
  'Motivo de decisión','Fecha salida','Hora salida','Oficial salida','Permanencia en planta','Destino salida',
  'Remolques salida','Facturas salida','Sellos salida','Checklist salida','Versión checklist salida',
  'Observaciones salida','Foto sello salida','Foto conductor y vehículo'
];
const CO_ESTADOS_REPORTE_ = {
  AGUARDANDO_ENTRADA:'Esperando entrada — fuera de planta',PENDENTE_AVALIACAO:'Pendiente de evaluación — fuera de planta',
  AGUARDANDO_AUTORIZACAO:'Esperando autorización — fuera de planta',LIBERADO:'Autorizado — esperando entrada',
  DENTRO_UNIDADE:'Dentro de planta',CONCLUIDO:'Finalizado — fuera de planta',RECUSADO:'Rechazado — fuera de planta'
};
const CO_FINALIDADES_REPORTE_ = {
  CARGA_NACIONAL:'Carga nacional',RECICLAGEM:'Reciclaje',EXPORTACAO:'Exportación',ENTRE_BODEGAS:'Movimiento entre bodegas',
  DEVOLUCOES:'Devoluciones',MATERIA_PRIMA:'Materia prima',IMPORTACAO:'Importación',OUTRA:'Otra recogida / entrega'
};
const CO_PREGUNTAS_REPORTE_ = {
  mecanica:'Condición mecánica',fluidos:'Sin fugas de fluidos',estructura:'Estructura y parachoques',luzes:'Luces',espelhos:'Espejos',
  interior:'Interior del remolque',cobertura:'Travesaños / lona',outros:'Otras condiciones',container:'Contenedor',pneus:'Neumáticos',
  reserva:'Neumático de repuesto',compuertas:'Puertas, anclajes y soldaduras',extintor:'Extintor',epi_colete:'Chaleco reflectivo',
  epi_bota:'Calzado de seguridad',epi_capacete:'Casco',veiculo:'Vehículo',carga:'Carga',lacres:'Sellos'
};
const CO_CAUSAS_REPORTE_ = {SUJO:'Sucio',ODOR:'Olor / contaminante',RESIDUOS:'Residuos',NAO_VAZIO:'No vacío',LUZ:'Filtración de luz',PISO:'Piso en mal estado',SOLDA:'Soldadura defectuosa',OUTRO:'Otro',PERNO:'Perno dañado',ARO:'Rin dañado',DESGASTE:'Desgaste inferior a 5 mm',PRESSAO:'Presión inadecuada',DEFEITO:'Defecto visible'};
function checklistReporteColombia_(dados) {
  if (!dados?.checklist) return '';
  const estados={CONFORME:'Conforme',NAO_CONFORME:'No conforme',NA:'No aplica'};
  return Object.entries(dados.checklist).map(([key,item])=>{
    const causas=dados.causas?.[key];
    const motivo=causas?causas.opcoes.map(x=>CO_CAUSAS_REPORTE_[x]||x).join(', ')+(causas.outro?' — '+causas.outro:''):item.causa;
    return (CO_PREGUNTAS_REPORTE_[key]||key)+': '+(estados[item.estado]||item.estado)+(motivo?' ('+motivo+')':'');
  }).join('\n');
}
/** Busca metadados uma vez; lê somente as referências de fotos das viagens solicitadas. */
function fotosReporteColombia_(ss,ids) {
  const fotos={ENTRADA:new Map(),SAIDA:new Map(),CONJUNTO:new Map()};
  for (const etapa of Object.keys(fotos)) {
    const sh=ss.getSheetByName(folhaFoto_(etapa)),count=sh?sh.getLastRow()-1:0;
    if(count<1)continue;
    const meta=sh.getRange(2,1,count,4).getDisplayValues();
    meta.forEach((r,i)=>{
      if(r[3]!=='CO'||!ids.has(r[0])||ids.get(r[0])!==r[2])return;
      const value=sh.getRange(i+2,5).getDisplayValue();
      fotos[etapa].set(r[0],idFotoDrive_(value)?value:value?'Foto histórica: ejecutar actualizarLinksFotos':'');
    });
  }
  return fotos;
}
function linhaControleColombia_(row,eventos,fotos) {
  const state=estadoViagem_(row,eventos),entrada=state.entrada,saida=state.saida,vistoria=entrada||state.retencao;
  const data=utc=>utc?Utilities.formatDate(new Date(utc),'America/Bogota','yyyy-MM-dd'):'';
  const hora=utc=>utc?Utilities.formatDate(new Date(utc),'America/Bogota','HH:mm:ss'):'';
  const lista=i=>JSON.parse(row[i]||'[]').join('; ');
  const simNao=x=>x==='SIM'?'Sí':x==='NAO'?'No':x;
  return [row[0],row[4],CO_ESTADOS_REPORTE_[state.status]||state.status,data(row[6]),hora(row[6]),CO_FINALIDADES_REPORTE_[row[12]]||row[12],
    row[16],row[14],row[13],row[15],row[17],row[18],row[11],simNao(row[20]),simNao(row[21]),row[22],lista(23),lista(24),lista(25),row[26],row[27],simNao(row[28]),row[29],lista(30),row[32],row[33],row[34],fotos.ENTRADA.get(row[0])||'',
    data(state.entradaUTC),hora(state.entradaUTC),state.agenteEntrada,duracao_(minutos_(row[6],state.entradaUTC)),checklistReporteColombia_(vistoria),vistoria?.versaoChecklist|| (vistoria?'Histórico':''),
    vistoria?.assinaturas?.motorista?'Registrada en la inspección':'',vistoria?.assinaturas?.guarda?'Registrada en la inspección':'',state.divergencia,state.autorizadoPor,state.autorizacao?.dados.justificativa||'',
    data(state.saidaUTC),hora(state.saidaUTC),state.agenteSaida,duracao_(minutos_(state.entradaUTC,state.saidaUTC)),saida?.destino||'',
    saida?(saida.placasCarretasSaida||row.slice(18,20).filter(Boolean)).join('; '):'',saida?.faturas.join('; ')||'',saida?.lacres.join('; ')||'',checklistReporteColombia_(saida),saida?.versaoChecklistSaida||(saida?'Histórico':''),saida?.observacao||'',fotos.SAIDA.get(row[0])||'',fotos.CONJUNTO.get(row[0])||''];
}
function vincularFotosControleColombia_(sh,linha,dados) {
  for(const coluna of [28,51,52]) {
    const url=dados[coluna-1];
    if(idFotoDrive_(url))sh.getRange(linha,coluna).setRichTextValue(SpreadsheetApp.newRichTextValue().setText(url).setLinkUrl(url).build());
  }
}
function atualizarControleColombia_(ss,row,eventos) {
  if(row[3]!=='CO')return;
  const sh=ss.getSheetByName('Control_CO');conferirCabecalho_(sh,CONTROLE_CO_HEADERS_);
  const count=sh.getLastRow()-1,ids=count>0?sh.getRange(2,1,count,1).getDisplayValues():[];
  const matches=ids.map((r,i)=>r[0]===row[0]?i+2:0).filter(Boolean);
  if(matches.length>1)falhar_('VISAO_ID_DUPLICADO');
  const linha=matches[0]||sh.getLastRow()+1;
  const dados=linhaControleColombia_(row,eventos,fotosReporteColombia_(ss,new Map([[row[0],row[4]]])));
  garantirTamanhoControle_(sh,linha,CONTROLE_CO_HEADERS_.length);
  sh.getRange(linha,1,1,dados.length).setNumberFormat('@').setValues([dados.map(celulaTexto_)]).setWrap(true).setVerticalAlignment('middle').setBackground(linha%2===0?'#ffffff':'#f1f5f9');
  sh.autoResizeRows(linha,1);vincularFotosControleColombia_(sh,linha,dados);
}
function reconstruirControleColombia_(ss) {
  const sh=ss.getSheetByName('Control_CO');conferirCabecalho_(sh,CONTROLE_CO_HEADERS_);
  const rows=rowsChegadas_(ss).rows.filter(r=>r[3]==='CO'),ids=new Set();
  rows.forEach(r=>{if(ids.has(r[0]))falhar_('VISAO_ID_DUPLICADO');ids.add(r[0]);});
  const eventos=indiceEventos_(eventosV3_(ss)),fotos=fotosReporteColombia_(ss,new Map(rows.map(r=>[r[0],r[4]])));
  const dados=rows.map(r=>linhaControleColombia_(r,eventos[r[0]]||[],fotos)),old=sh.getLastRow()-1;
  garantirTamanhoControle_(sh,Math.max(2,dados.length+1),CONTROLE_CO_HEADERS_.length);
  if(dados.length)sh.getRange(2,1,dados.length,CONTROLE_CO_HEADERS_.length).setNumberFormat('@').setValues(dados.map(r=>r.map(celulaTexto_)));
  dados.forEach((r,i)=>vincularFotosControleColombia_(sh,i+2,r));
  if(old>dados.length)sh.getRange(dados.length+2,1,old-dados.length,CONTROLE_CO_HEADERS_.length).clearContent();
}
function organizarAbasColombia_(ss) {
  const sh=ss.getSheetByName('Control_CO'),total=Math.max(2,sh.getLastRow()),cols=CONTROLE_CO_HEADERS_.length;
  sh.showSheet();sh.getBandings().forEach(b=>b.remove());
  const range=sh.getRange(1,1,total,cols);range.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
  range.setFontFamily('Arial').setFontSize(10).setWrap(true).setVerticalAlignment('middle');
  sh.setFrozenRows(1);sh.setFrozenColumns(3);sh.setRowHeight(1,64);sh.setColumnWidths(1,cols,170);
  for(const col of [7,8,13,31,38,42,44])sh.setColumnWidth(col,250);
  for(const col of [27,33,37,48,50])sh.setColumnWidth(col,460);
  for(const col of [28,51,52])sh.setColumnWidth(col,320);
  [[1,3,'#243448'],[4,25,'#b91c2b'],[29,11,'#175a9c'],[40,13,'#236b4a']].forEach(([col,n,color])=>sh.getRange(1,col,1,n).setBackground(color).setFontColor('#ffffff').setFontWeight('bold'));
  if(sh.getFilter())sh.getFilter().remove();range.createFilter();
  if(total>1)sh.autoResizeRows(2,total-1);
  sh.hideColumns(1);sh.hideColumns(34);sh.hideColumns(49);ss.setActiveSheet(sh);ss.moveActiveSheet(1);
  for(const name of ['Chegadas_v2','Eventos_v3','Fotos_v3','Fotos_Saida_v1','Fotos_Conjunto_CO_v1','Cadastros_CO_v1','SolicitacoesCanceladas_v1'])ss.getSheetByName(name)?.hideSheet();
  for(const name of ['Motoristas_v3','Veiculos_CO_v1','Produtos_v2','Transportadoras_v2'])ss.getSheetByName(name)?.showSheet();
}
