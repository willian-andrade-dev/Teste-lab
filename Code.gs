/** Acesso corporativo — v0.4. Configurações existentes preservadas. */
function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('Colgate | Controle Logístico')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Funções terminadas em _ são privadas para google.script.run.
function propriedades_() { return PropertiesService.getScriptProperties(); }
function falhar_(codigo) { throw new Error(codigo); }
function emailAtual_() {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) falhar_('IDENTIDADE_INDISPONIVEL');
  const dominios = String(propriedades_().getProperty('DOMINIOS_PERMITIDOS') || '')
    .split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  if (!dominios.length || !dominios.includes(email.split('@')[1])) falhar_('ACESSO_NEGADO');
  return email;
}
function central_() {
  const id = propriedades_().getProperty('PLANILHA_CONTROLE_ID');
  if (!id) falhar_('CONFIGURACAO_PENDENTE');
  return SpreadsheetApp.openById(id);
}
const CABECALHOS_ = {
  Usuarios: ['Email', 'Nome', 'Pais', 'Unidades', 'Perfil', 'Status', 'Idioma'],
  Paises: ['Pais', 'Nome', 'PlanilhaID', 'Fuso', 'Idioma', 'Status'],
  Unidades: ['Codigo', 'Pais', 'Nome', 'Endereco', 'Status']
};
function tabela_(nome) {
  const sheet = central_().getSheetByName(nome);
  if (!sheet) falhar_('CONFIGURACAO_PENDENTE');
  const rows = sheet.getDataRange().getDisplayValues();
  const esperado = CABECALHOS_[nome];
  if (!esperado.every((h,i) => rows[0][i] === h)) falhar_('CABECALHOS_INVALIDOS');
  return rows.slice(1).filter(r => r.some(x => String(x).trim())).map(r => {
    const item = {}; esperado.forEach((h,i) => item[h] = String(r[i] || '').trim()); return item;
  });
}
function validarLogin_() {
  const email = emailAtual_();
  const usuarios = tabela_('Usuarios').filter(u => u.Email.toLowerCase() === email);
  if (usuarios.length !== 1 || usuarios[0].Status !== 'ATIVO') falhar_('ACESSO_NEGADO');
  const u = usuarios[0];
  if (!['SEGURANCA', 'GERENTE', 'ADMINISTRADOR'].includes(u.Perfil)) falhar_('ACESSO_NEGADO');
  const todosPaises = tabela_('Paises');
  const paises = todosPaises.filter(p => p.Pais === u.Pais);
  if (paises.length !== 1 || paises[0].Status !== 'ATIVO') falhar_('ACESSO_NEGADO');
  const p = paises[0];
  if (!p.PlanilhaID || !p.Fuso || !['pt','en','es'].includes(p.Idioma)) falhar_('CONFIGURACAO_PENDENTE');
  if(p.PlanilhaID === String(propriedades_().getProperty('PLANILHA_CONTROLE_ID')||'').trim()) falhar_('PLANILHA_OPERACIONAL_INVALIDA');
  if(todosPaises.some(x => x.Pais!==u.Pais && x.PlanilhaID===p.PlanilhaID)) falhar_('PLANILHA_COMPARTILHADA_ENTRE_PAISES');
  const ids = u.Unidades.split(';').map(x => x.trim()).filter(Boolean);
  if (!ids.length || new Set(ids).size !== ids.length) falhar_('ACESSO_NEGADO');
  const todas = tabela_('Unidades');
  const unidades = ids.map(id => {
    const candidatas = todas.filter(x => x.Codigo === id);
    if (candidatas.length !== 1 || candidatas[0].Pais !== u.Pais || candidatas[0].Status !== 'ATIVO') {
      falhar_('ACESSO_NEGADO');
    }
    return candidatas[0];
  });
  return {email, usuario:u, pais:p, unidades, origens:todas.filter(x=>x.Pais===u.Pais && x.Status==='ATIVO')};
}
function publico_(c) {
  return {
    email:c.email, nome:c.usuario.Nome, pais:c.pais.Pais, perfil:c.usuario.Perfil,
    expiraEm:c.expiraEm, idioma:['pt','en','es'].includes(c.usuario.Idioma) ? c.usuario.Idioma : c.pais.Idioma,
    unidades:c.unidades.map(u => ({codigo:u.Codigo, nome:u.Nome, endereco:u.Endereco}))
  };
}
const SESSAO_CHAVE_='LOGISTICA_SESSAO_V04';
const SESSAO_DURACAO_MS_=4*60*60*1000;
function iniciarSessao_() {
  const store=PropertiesService.getUserProperties();
  // Um novo login invalida a sessão anterior, mesmo quando o cadastro foi bloqueado.
  store.deleteProperty(SESSAO_CHAVE_);
  const c=validarLogin_();
  c.iniciadaEm=Date.now(); c.expiraEm=c.iniciadaEm+SESSAO_DURACAO_MS_;c.versaoSessao=4;
  // ASCII permite medir o limite de bytes do Properties Service sem chamadas adicionais.
  const json=JSON.stringify(c).replace(/[^\x00-\x7F]/g,x=>'\\u'+x.charCodeAt(0).toString(16).padStart(4,'0'));
  if(json.length>8000) falhar_('SESSAO_MUITO_GRANDE');
  store.setProperty(SESSAO_CHAVE_,json);
  return c;
}
function contexto_() {
  // Consulta local ao armazenamento do usuário. Não abre a planilha de controle.
  const store=PropertiesService.getUserProperties();
  let c;
  try {c=JSON.parse(store.getProperty(SESSAO_CHAVE_)||'null');}catch(e){c=null;}
  const email=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
  const agora=Date.now();
  if(!c || c.versaoSessao!==4 || !email || c.email!==email || !Number.isFinite(c.iniciadaEm) ||
     !Number.isFinite(c.expiraEm) || c.expiraEm-c.iniciadaEm!==SESSAO_DURACAO_MS_ || agora<c.iniciadaEm || agora>=c.expiraEm){
    store.deleteProperty(SESSAO_CHAVE_);falhar_('SESSAO_EXPIRADA');
  }
  return c;
}
function obterSessaoBackend() { return publico_(iniciarSessao_()); }

// Confere unidade contra a sessão de quatro horas. Não consulta bloqueios no cadastro.
function contextoUnidade_(codigo) {
  const c = contexto_();
  const unidade = c.unidades.find(u => u.Codigo === String(codigo || '').trim());
  if (!unidade) falhar_('ACESSO_NEGADO');
  return {contexto:c, unidade};
}
function selecionarUnidadeBackend(codigo) {
  const r = contextoUnidade_(codigo);
  return {sessao:publico_(r.contexto), unidade:r.unidade.Codigo,
    nome:r.unidade.Nome, fuso:r.contexto.pais.Fuso, operacional:true};
}
// Ponto de integração para a próxima etapa. Somente funções privadas podem obter a planilha.
function planilhaOperacional_(codigo) {
  const r = contextoUnidade_(codigo);
  return SpreadsheetApp.openById(r.contexto.pais.PlanilhaID);
}
function exigirPerfil_(codigo, perfis) {
  const r = contextoUnidade_(codigo);
  if (!perfis.includes(r.contexto.usuario.Perfil)) falhar_('ACESSO_NEGADO');
  return r;
}

/** Executar manualmente no editor. Não sobrescreve abas/cabeçalhos existentes. */
function prepararControle() {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  const admin = String(propriedades_().getProperty('ADMIN_INICIAL_EMAIL') || '').trim().toLowerCase();
  if (!email || !admin || email !== admin) falhar_('ACESSO_NEGADO');
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const ss = central_();
    // Confere todas as abas antes de criar qualquer uma.
    Object.keys(CABECALHOS_).forEach(nome => {
      const sh = ss.getSheetByName(nome);
      if (sh && sh.getLastRow() && !CABECALHOS_[nome].every((h,i) =>
        sh.getRange(1,i+1).getDisplayValue() === h)) falhar_('CABECALHOS_INVALIDOS');
    });
    Object.keys(CABECALHOS_).forEach(nome => {
      const sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
      if (!sh.getLastRow()) {
        sh.getRange(1,1,1,CABECALHOS_[nome].length).setValues([CABECALHOS_[nome]]).setFontWeight('bold');
        sh.setFrozenRows(1);
      }
    });
    SpreadsheetApp.flush();
    return 'Estrutura criada. Preencha os cadastros conforme o guia.';
  } finally { lock.releaseLock(); }
}
