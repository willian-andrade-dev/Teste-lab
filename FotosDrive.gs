/** Fotos privadas, separadas por país. Não modifica compartilhamento nem publica arquivos. */
function pastaFotosPais_(pais){
  if(!['BR','CO'].includes(pais))falhar_('PAIS_NAO_CONFIGURADO');
  const props=PropertiesService.getScriptProperties(),key='FOTOS_DRIVE_'+pais,id=props.getProperty(key);
  if(id)return DriveApp.getFolderById(id);
  const folder=DriveApp.createFolder('Logistica_Fotos_'+pais);props.setProperty(key,folder.getId());return folder;
}
function salvarImagemDrive_(pais,viagem,solicitacao,image){
  const folder=pastaFotosPais_(pais),hash=hashV3_(image).replace(/[^A-Za-z0-9]/g,'').slice(0,24);
  const name='Lacre_'+viagem+'_'+solicitacao+'_'+hash+'.jpg',files=folder.getFilesByName(name);
  if(files.hasNext())return files.next().getUrl();
  return folder.createFile(Utilities.newBlob(Utilities.base64Decode(image.split(',')[1]),'image/jpeg',name)).getUrl();
}
function idFotoDrive_(url){const match=String(url||'').match(/^https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)\/view(?:\?.*)?$/);return match?match[1]:'';}
function imagemFotoArmazenada_(value,pais){
  if(!value)return '';if(String(value).startsWith('data:image/jpeg;base64,'))return value;
  const id=idFotoDrive_(value);if(!id)falhar_('FOTO_INVALIDA');
  const file=DriveApp.getFileById(id),parents=file.getParents(),folderId=PropertiesService.getScriptProperties().getProperty('FOTOS_DRIVE_'+pais);let permitted=false;
  while(parents.hasNext())if(parents.next().getId()===folderId)permitted=true;
  if(!permitted)falhar_('ACESSO_NEGADO');
  const blob=file.getBlob();if(blob.getContentType()!=='image/jpeg')falhar_('FOTO_INVALIDA');
  return 'data:image/jpeg;base64,'+Utilities.base64Encode(blob.getBytes());
}
function urlFotoDireta_(ss,id){const sh=ss.getSheetByName('Fotos_v3'),count=sh.getLastRow()-1;if(count<1)return '';const ids=sh.getRange(2,1,count,1).getDisplayValues(),index=ids.findIndex(x=>x[0]===id);if(index<0)return '';const value=sh.getRange(index+2,5).getDisplayValue();return idFotoDrive_(value)?value:'';}
/** Executar como ADMINISTRADOR. Converte até 20 imagens antigas por execução, sem apagar dados antes de salvar. */
function migrarFotosParaDrive(){
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{const c=iniciarSessao_();if(c.usuario.Perfil!=='ADMINISTRADOR')falhar_('ACESSO_NEGADO');const ss=planilhaPais_(c),sh=ss.getSheetByName('Fotos_v3');conferirCabecalho_(sh,FOTO_HEADERS_);let n=0;const count=sh.getLastRow()-1,meta=count>0?sh.getRange(2,1,count,4).getDisplayValues():[];
    for(let i=0;i<meta.length&&n<20;i++){if(meta[i][3]!==c.pais.Pais)continue;const image=sh.getRange(i+2,5).getDisplayValue();if(!image.startsWith('data:image/jpeg;base64,'))continue;const url=salvarImagemDrive_(c.pais.Pais,meta[i][0],meta[i][1],validarFotoLacre_(image));sh.getRange(i+2,5).setNumberFormat('@').setValues([[url]]);vincularFotoDrive_(sh,i+2,url);n++;}
    const links=atualizarLinksFotosPais_(ss,c);SpreadsheetApp.flush();const message=n+' fotos convertidas, '+links+' links atualizados. Repita até converter 0. Os links das fotos convertidas já foram atualizados.';console.log(message);return message;
  }finally{lock.releaseLock();}
}

function vincularFotoDrive_(sh,linha,url){sh.getRange(linha,5).setRichTextValue(SpreadsheetApp.newRichTextValue().setText(url).setLinkUrl(url).build());}
function gravarReferenciaFotoDrive_(sh,linha,row,key,image){const url=salvarImagemDrive_(row[3],row[0],key,image);sh.getRange(linha,1,1,5).setNumberFormat('@').setValues([[row[0],key,row[4],row[3],url]]);vincularFotoDrive_(sh,linha,url);}

/** Repara fotos existentes sem reconstruir ou modificar as outras colunas do relatório. */
function atualizarLinksFotos(){return migrarFotosParaDrive();}
function atualizarLinksFotosPais_(ss,c){
  const photos=ss.getSheetByName('Fotos_v3'),count=photos.getLastRow()-1;if(count<1)return 0;
  const meta=photos.getRange(2,1,count,4).getDisplayValues(),urls=new Map();let n=0;
  meta.forEach((r,i)=>{if(r[3]!==c.pais.Pais)return;const value=photos.getRange(i+2,5).getDisplayValue();if(!idFotoDrive_(value))return;vincularFotoDrive_(photos,i+2,value);urls.set(r[0],value);n++;});
  const report=ss.getSheetByName('Controle_BR');if(c.pais.Pais==='BR'&&report&&report.getLastRow()>1){conferirCabecalho_(report,SAIDA_BR_);const ids=report.getRange(2,1,report.getLastRow()-1,2).getDisplayValues();ids.forEach((r,i)=>{if(urls.has(r[0])){report.getRange(i+2,16).setNumberFormat('@').setValues([[urls.get(r[0])]]);linkFotoLacre_(report,i+2,r,urls.get(r[0]));}});}
  return n;
}
