/** Estoque físico por unidade: entrada adiciona carretas; saída remove as efetivamente levadas. */
function carretasPatio_(rows,eventos,pais,unidade){
 const byId=new Map(rows.filter(r=>r[3]===pais).map(r=>[r[0],r])),stock=new Map();
 eventos.forEach(e=>{
  if(e[5]!==pais||(unidade&&e[4]!==unidade))return;
  // Eventos manuais não são viagens: entram no mesmo estoque físico, em ordem de gravação.
  if(e[6]==='PATIO_ADICIONAR'){const d=JSON.parse(e[10]);stock.set(e[4]+'|'+d.placa,{placa:d.placa,unidade:e[4],viagemOrigem:'',entradaUTC:e[7]});return;}
  const row=byId.get(e[3]);if(!row||e[5]!==pais||e[4]!==row[4]||(unidade&&e[4]!==unidade))return;const d=JSON.parse(e[10]);
  if(e[6]==='ENTRADA')row.slice(18,20).filter(Boolean).forEach(placa=>stock.set(e[4]+'|'+placa,{placa,unidade:e[4],viagemOrigem:row[0],entradaUTC:e[7]}));
  if(e[6]==='SAIDA')(Array.isArray(d.placasCarretasSaida)?d.placasCarretasSaida:row.slice(18,20).filter(Boolean)).forEach(p=>stock.delete(e[4]+'|'+p));
 });return [...stock.values()].sort((a,b)=>a.placa.localeCompare(b.placa));
}
function listarCarretasPatioBackend(codigo){const r=contextoUnidade_(codigo),ss=planilhaPais_(r.contexto);return carretasPatio_(rowsChegadas_(ss).rows,eventosV3_(ss),r.contexto.pais.Pais,r.unidade.Codigo);}
function placasSaida_(d,row,rows,eventos){const originais=row.slice(18,20).filter(Boolean);let placas=originais;if(d.trocarCarretas==='SIM'){if(!Array.isArray(d.placasCarretasSaida)||d.placasCarretasSaida.length>2)falhar_('CARRETA_INVALIDA');placas=d.placasCarretasSaida.map(p=>placaPatio_(p));}else if(d.trocarCarretas&&d.trocarCarretas!=='NAO')falhar_('CARRETA_INVALIDA');
 if(new Set(placas).size!==placas.length||placas.includes(row[17]))falhar_('CARRETA_INVALIDA');
 const dentro=carretasPatio_(rows,eventos,row[3],row[4]);if(placas.some(p=>!dentro.some(c=>c.placa===p)))falhar_('CARRETA_INDISPONIVEL');return placas;
}

function placaPatio_(value){return textoChegada_(value,'placa',12,true).replace(/[\s-]/g,'').toUpperCase();}

/** Inclusão excepcional auditada. O mesmo lock da movimentação impede dupla ocupação. */
function adicionarCarretaPatioBackend(d){
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const r=contextoUnidade_(d&&d.unidade),c=r.contexto;
  if(!['GERENTE','ADMINISTRADOR'].includes(c.usuario.Perfil))falhar_('ACESSO_NEGADO');
  const key=textoChegada_(d.solicitacao,'solicitacao',80,true);
  if(!/^[a-zA-Z0-9-]{16,80}$/.test(key))falhar_('REQUISICAO_INVALIDA');
  const dados={placa:placaChegada_(d.placa,c.pais.Pais,true),motivo:textoChegada_(d.motivo,'motivo',500,true)};
  const ss=planilhaPais_(c),rows=rowsChegadas_(ss).rows,eventos=eventosV3_(ss),hash=hashV3_({acao:'PATIO_ADICIONAR',dados});
  const anterior=eventos.find(e=>e[1]===key);
  if(anterior){
   if(anterior[6]!=='PATIO_ADICIONAR'||anterior[2]!==hash||anterior[4]!==r.unidade.Codigo||anterior[5]!==c.pais.Pais||anterior[8]!==c.email)falhar_('SOLICITACAO_CONFLITANTE');
  }else{
   if(rows.some(x=>x[3]===c.pais.Pais&&x[17]===dados.placa&&estadoViagem_(x,eventos).status==='DENTRO_UNIDADE'))falhar_('CARRETA_INVALIDA');
   if(carretasPatio_(rows,eventos,c.pais.Pais).some(x=>x.placa===dados.placa))falhar_('CARRETA_JA_DENTRO');
   const event=[Utilities.getUuid(),key,hash,'PATIO-'+key,r.unidade.Codigo,c.pais.Pais,'PATIO_ADICIONAR',new Date().toISOString(),c.email,c.usuario.Nome||c.email,JSON.stringify(dados)];
   const sh=ss.getSheetByName('Eventos_v3');if(!sh)falhar_('CONFIGURACAO_PENDENTE');
   sh.getRange(sh.getLastRow()+1,1,1,event.length).setNumberFormat('@').setValues([event.map(celulaTexto_)]);eventos.push(event);
  }
  SpreadsheetApp.flush();return {patio:carretasPatio_(rows,eventos,c.pais.Pais,r.unidade.Codigo),servidorUTC:new Date().toISOString(),repetida:!!anterior};
 }finally{lock.releaseLock();}
}
