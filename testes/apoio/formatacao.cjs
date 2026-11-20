// Simula apenas as chamadas visuais da API Google Sheets, sem alterar os valores.
module.exports=(Sheet,app)=>{
 app.newRichTextValue=()=>{const v={};return {setText(t){v.text=t;return this;},setLinkUrl(u){v.url=u;return this;},build(){return v;}};};
 app.WrapStrategy={CLIP:'CLIP'};
 app.BandingTheme={LIGHT_GREY:'LIGHT_GREY'};
 Sheet.prototype.getMaxRows=function(){return this.maxRows||1000;};Sheet.prototype.getMaxColumns=function(){return this.maxColumns||26;};Sheet.prototype.insertRowsAfter=function(start,n){this.maxRows=start+n;};Sheet.prototype.insertColumnsAfter=function(start,n){this.maxColumns=start+n;};
 const original=Sheet.prototype.getRange;
 Sheet.prototype.getRange=function(...args){const range=original.apply(this,args),sheet=this;range.setRichTextValue=function(v){if(!sheet.rows[args[0]-1])sheet.rows[args[0]-1]=[];sheet.rows[args[0]-1][args[1]-1]=v.text;(sheet.links||(sheet.links={}))[args[0]+':'+args[1]]=v.url;return this;};for(const name of ['setFontFamily','setFontSize','setVerticalAlignment','setWrap','setBackground','setFontColor','applyRowBanding','createFilter','setWrapStrategy'])range[name]=function(...values){(sheet.visualCalls||(sheet.visualCalls=[])).push({name,args,values});return this;};return range;};
 for(const name of ['setFrozenColumns','setRowHeight','setRowHeights','setColumnWidths','setColumnWidth','autoResizeRows'])Sheet.prototype[name]=function(...args){(this.visualCalls||(this.visualCalls=[])).push({name,args});};
 Sheet.prototype.getBandings=function(){return [];};Sheet.prototype.getFilter=function(){return null;};
 const hide=Sheet.prototype.hideSheet,show=Sheet.prototype.showSheet;
 Sheet.prototype.hideSheet=function(){this.hidden=true;return hide?.call(this);};Sheet.prototype.showSheet=function(){this.hidden=false;return show?.call(this);};
};
