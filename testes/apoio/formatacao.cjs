// Simula apenas as chamadas visuais da API Google Sheets, sem alterar os valores.
module.exports=(Sheet,app)=>{
 app.WrapStrategy={CLIP:'CLIP'};
 app.BandingTheme={LIGHT_GREY:'LIGHT_GREY'};
 Sheet.prototype.getMaxRows=function(){return this.maxRows||1000;};Sheet.prototype.getMaxColumns=function(){return this.maxColumns||26;};Sheet.prototype.insertRowsAfter=function(start,n){this.maxRows=start+n;};Sheet.prototype.insertColumnsAfter=function(start,n){this.maxColumns=start+n;};
 const original=Sheet.prototype.getRange;
 Sheet.prototype.getRange=function(...args){const range=original.apply(this,args),sheet=this;for(const name of ['setFontFamily','setFontSize','setVerticalAlignment','setWrap','setBackground','setFontColor','applyRowBanding','createFilter','setWrapStrategy'])range[name]=function(...values){(sheet.visualCalls||(sheet.visualCalls=[])).push({name,args,values});return this;};return range;};
 for(const name of ['setFrozenColumns','setRowHeight','setRowHeights','setColumnWidths','setColumnWidth','autoResizeRows'])Sheet.prototype[name]=function(...args){(this.visualCalls||(this.visualCalls=[])).push({name,args});};
 Sheet.prototype.getBandings=function(){return [];};Sheet.prototype.getFilter=function(){return null;};
 const hide=Sheet.prototype.hideSheet,show=Sheet.prototype.showSheet;
 Sheet.prototype.hideSheet=function(){this.hidden=true;return hide?.call(this);};Sheet.prototype.showSheet=function(){this.hidden=false;return show?.call(this);};
};
