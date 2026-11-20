// Drive em memória: pasta/arquivo privados, bytes e identidades distintos por país.
module.exports=sandbox=>{
 const folders=new Map(),files=new Map();let count=0;
 const iterator=values=>{let i=0;return {hasNext:()=>i<values.length,next:()=>values[i++]};};
 const blob=(bytes,type,name)=>({getBytes:()=>Array.from(bytes),getContentType:()=>type,name});
 sandbox.Utilities.base64Decode=s=>Array.from(Buffer.from(s,'base64'));
 sandbox.Utilities.newBlob=(bytes,type,name)=>blob(bytes,type,name);
 sandbox.DriveApp={createFolder(name){const id='folder-'+(++count),folder={getId:()=>id,getUrl:()=>`https://drive.google.com/drive/folders/${id}`,getFilesByName:n=>iterator([...files.values()].filter(f=>f.parent===id&&f.name===n)),createFile(b){const fileId='file-'+(++count),f={name:b.name,parent:id,getId:()=>fileId,getUrl:()=>`https://drive.google.com/file/d/${fileId}/view`,getBlob:()=>b,getParents:()=>iterator([folder])};files.set(fileId,f);return f;}};folders.set(id,folder);return folder;},getFolderById:id=>{if(!folders.has(id))throw Error('DRIVE_ACCESS');return folders.get(id);},getFileById:id=>{if(!files.has(id))throw Error('DRIVE_ACCESS');return files.get(id);}};
 const old=sandbox.PropertiesService.getScriptProperties;
 sandbox.PropertiesService.getScriptProperties=()=>{const props=old(),extra=sandbox.driveProps||(sandbox.driveProps={});return {getProperty:k=>extra[k]??props.getProperty(k),setProperty(k,v){extra[k]=v;return this;}};};
 sandbox.driveFiles=files;
};
