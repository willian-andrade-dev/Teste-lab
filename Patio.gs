/** Estoque físico por unidade: entrada adiciona carretas; saída remove as efetivamente levadas. */
function carretasPatio_(rows,eventos,pais,unidade){
 const byId=new Map(rows.filter(r=>r[3]===pais).map(r=>[r[0],r])),stock=new Map();
 eventos.forEach(e=>{const row=byId.get(e[3]);if(!row||e[5]!==pais||e[4]!==row[4]||(unidade&&e[4]!==unidade))return;const d=JSON.parse(e[10]);
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
