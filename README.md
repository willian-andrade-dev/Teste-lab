# Ajuste v0.23 — placas, carretas e controles para tablet

Atualização para **Brasil e Colômbia**, baseada no main de 1701585. Substitua **Chegada.gs, Operacao.gs, Patio.gs e Index.html**, salve e publique em **Deploy → Manage deployments → Edit → Version → New version → Deploy**. Reabra o link `/exec`. **Não é necessário executar função de preparação/migração de planilhas nesta atualização** se a operação já estava preparada. Não há novos cabeçalhos, abas ou escopos. As funções de preparação citadas nas versões anteriores abaixo continuam destinadas àquelas instalações/migrações.

- Brasil aceita os modelos `ABC-1234`/`ABC1234` e `ABC1D23`, com normalização, na chegada e na inclusão manual. Colômbia mantém a validação própria de placas; não recebe a expressão brasileira.
- A saída usa as carretas efetivamente escolhidas. Sem carreta, a pergunta carregado/descarregado fica oculta e o evento guarda **NA**, sem declarar veículo vazio. Com carreta, exige escolha Sim/Não. O servidor rejeita NA com carreta. Reenvios antigos com Sim/Não continuam compatíveis.
- Notas, lacres e remitos usam **um único + ao lado do primeiro campo**; os itens seguintes têm × com espaço e alvo de toque de 44px. A segunda carreta de troca só aparece após selecionar a primeira e tocar em +; limpar a primeira remove a segunda. Duplicidade de placas é sinalizada no formulário.
- HUD nas três etapas: somente **placa e tempo na planta**, restrito à unidade atual. Em telas largas fica lateral; em retrato fica acima do formulário, com altura limitada e rolagem própria. ↻ atualiza o estoque da saída aberta ou o painel, sem botão adicional no formulário.
- **GERENTE ou ADMINISTRADOR**, autorizado na unidade de qualquer dos dois países, pode usar **+ no HUD** para incluir carreta fisicamente presente, com placa válida e motivo obrigatório. Segurança não consegue nem por chamada direta ao servidor. O horário é o da inclusão: não foi inventado um horário antigo de entrada. Carreta já presente no país e placa de veículo trator dentro da planta são rejeitadas.
- Inclusão excepcional é auditada em **Eventos_v3**, ação `PATIO_ADICIONAR`, com autor real, país/unidade, motivo e horário do servidor. Não cria chegada de motorista nem viagem no relatório. O lock das movimentações também protege inclusões; reenvio da mesma solicitação não duplica evento, e outro pedido para placa já dentro é rejeitado. A saída remove apenas as carretas levadas; deixar a original e pegar outra preserva o estoque físico. Para reinscrever depois de uma saída, use uma nova inclusão física.
- Espera é **chegada → entrada**; permanência é **entrada → saída**. As filas exibem o tempo correndo, derivado dos instantes salvos e do relógio recebido do servidor, atualizado localmente a cada 30s sem nova consulta para o cronômetro. O HUD mede entrada física da carreta → agora. Esses tempos não identificam início/fim efetivo de carga/descarga.
- Na Colômbia, destino e foto motorista + caminhão continuam obrigatórios mesmo sem carreta; lacre sem fatura continua possível e exige sua foto. No Brasil, sem carreta ou descarregado, as notas e lacres opcionais são abertos pelo +; foto continua obrigatória quando há lacre. Não foram alterados checklists, aprovações, configurações de acesso ou arquivos do Drive.

## Validação da v0.23

**279 testes simulados aprovados**: 25 acesso, 33 chegada, 47 operação, 14 sessão, 73 frontend, 45 gravação, 25 Colômbia, 13 fila e 4 medições. Execute `for f in testes/*.cjs; do node "$f" || exit 1; done` na raiz. Cobrem placas antiga/nova, escopo país/unidade, acesso direto por segurança, motivo obrigatório, inclusão/reenvio, troca/retirada/reinclusão, NA apenas sem carreta, preservação do histórico, relógio do servidor e + por toque em DOM simulado. Não são testes de concorrência com clientes reais.

Tentativa de validação visual com Playwright não pôde abrir o Chromium: `/usr/bin/chromium` existe como launcher, mas `/usr/lib/chromium/chromium` está ausente. Não houve renderização real, teste em tablet físico, nem acesso ao Apps Script, às planilhas ou ao Drive reais. Estilos e comportamento foram verificados nos testes locais; o aspecto visual precisa da conferência abaixo.

## Roteiro operacional curto — repetir em BR e CO

1. Como SEGURANCA, registre chegada com placa válida do país. No BR teste `ABC-1234`, `ABC1D23` e erro `AB12345`; CO continua aceitando seu modelo `ABC123`. Use dados de teste autorizados e não reutilize documento/placa com visita ativa.
2. Antes da entrada, a carreta não deve estar no HUD. Confira os documentos, checklist e assinaturas; após confirmação real da entrada, veja a placa com tempo correndo. A fila de saída mostra permanência desde a entrada.
3. Como GERENTE/ADMINISTRADOR, na mesma unidade, + do HUD → placa de outra carreta fisicamente presente + motivo → confirmar. Confira a linha auditada em Eventos_v3 caso necessário. Reenvio não duplica; tentar incluir de novo deve avisar que já está dentro. SEGURANCA não deve ter esse +.
4. Abra saída → trocar carretas → selecione a primeira no estoque. A segunda só abre por +. Uma placa repetida deve bloquear o formulário. Teste também sem carreta: não aparece carregado/descarregado. Na CO continue preenchendo destino/foto conjunta.
5. Com carreta, marque carregado e confira as estrelas de nota/lacre, + ao lado de cada campo, foto do lacre obrigatória e falta de dados bloqueando antes do envio. Sem carreta no BR, confira o + opcional de documentos.
6. Após confirmação da saída, a carreta levada sai do HUD; a deixada permanece com seu horário original. Troque de unidade/país e confira que o estoque não vaza. Registros antigos, aprovações e arquivos devem permanecer.
7. Em tablet retrato e paisagem, teste toque no +/×/↻, rolagem do HUD, legibilidade e modos claro/escuro. Compare tempos e estoque com o movimento físico. Homologue antes de ampliar o uso.

---

# Ajuste v0.22.1 — diagnóstico de login multipaís

Substitua **Code.gs e Index.html**, salve e publique uma **New version** no Deploy. Não execute preparação de planilhas para corrigir autorização.

A tela inicial informa quando faltam unidades de um país, quando o perfil não permite multipaís ou quando os códigos/estado de país e unidade estão incorretos. O erro genérico não manda mais voltar a uma seleção de unidades que ainda não abriu. As regras de acesso permanecem restritas; a alteração não concede acesso automaticamente.

Para uma conta ADMINISTRADOR acessar Brasil e Colômbia:

- Uma única linha por e-mail na aba central **Usuarios**.
- **Pais:** `BR;CO` (ou `CO;BR`), com ponto e vírgula. Não escrever `Brasil;Colombia`.
- **Unidades:** ao menos um código ativo de cada país. Exemplo: `BR-JAGUARE;CO30`, usando códigos realmente cadastrados na aba Unidades.
- **Perfil:** `ADMINISTRADOR`. **Status:** `ATIVO`.
- Na aba **Paises**, manter duas linhas separadas: uma com Pais `BR` e outra com `CO`. Nunca juntar os países nessa aba. Cada um possui sua própria planilha operacional.

Depois de corrigir a configuração, clique em **Tentar novamente**. Não apague cookies, dados do navegador ou solicitações pendentes. Se a configuração já estiver correta, confirme que a implantação publicada utiliza o Code.gs com suporte multipaís; salvar o arquivo no editor não substitui a versão publicada do aplicativo.

**263 testes simulados aprovados**, incluindo login recusado por país sem unidade, correção da mesma linha seguida de login válido e mensagens específicas de configuração. Sem acesso à configuração real da conta do solicitante; o diagnóstico exato depende dos dados preenchidos nela.

---

# Colgate v0.22 — Planilha colombiana com controle consolidado

## Atualizar da v0.21

1. Substitua **Operacao.gs, Colombia.gs e FotosDrive.gs**. Crie o arquivo de script **ControleCO.gs** (nome ControleCO no editor).
2. Para administrador multipaís, abra o aplicativo e selecione **Colômbia**. No editor, com conta ADMINISTRADOR autorizada nesse país, execute **prepararOperacao**.
3. Essa preparação cria **Control_CO**, reconstrói as viagens existentes pelos eventos, aplica cores, filtros e larguras e coloca a aba no início. Não apaga registros, eventos, fotos ou cadastros.
4. Publique uma **New version** e reabra os dispositivos. Não há novo escopo Google nem alteração do controle brasileiro.
5. Se fotos antigas aparecerem como pendentes de migração, execute **atualizarLinksFotos**, como administrador CO, até o retorno indicar zero conversões. O comando converte até vinte fotos antigas de entrada por execução e atualiza os links do controle.

## O que o gestor deve consultar

**Control_CO** tem uma linha por viagem com status atual, horários de Bogotá, motorista/documento/telefone, placas, finalidade, documentos da carga, contêiner, chegada, entrada, saída, espera/permanência, checklists, registro das assinaturas, decisão gerencial e três links identificados:

- Foto sello entrada: foto do lacre na entrada.
- Foto sello salida: foto do lacre na saída.
- Foto conductor y vehículo: foto conjunta exigida na saída colombiana.

As colunas são agrupadas por cores: identificação/situação, chegada, entrada/aprovação e saída. Cabeçalho e primeiras colunas congelados, filtro e texto ajustado. As colunas internas ID e versões de checklist ficam ocultas. Não existem hashes de solicitação, bytes de imagem ou assinaturas em base64 no controle visível. As assinaturas originais permanecem preservadas nos eventos; o relatório indica seu registro.

O status é reconstruído de Chegadas_v2 + Eventos_v3. Uma saída gravada resulta em **Finalizado — fuera de planta**. O sistema não inventa uma saída que não existe no histórico; se uma viagem ainda aparecer aguardando, conferir se há evento SAIDA para ela. A aba técnica Chegadas_v2 conserva o snapshot original da chegada e por isso seu status isolado não acompanha a movimentação.

## Organização das abas

Visíveis: **Control_CO**, **Motoristas_v3**, **Veiculos_CO_v1**, **Produtos_v2** e **Transportadoras_v2**.

Ocultas, preservadas e utilizadas pelo sistema: Chegadas_v2, Eventos_v3, Fotos_v3, Fotos_Saida_v1, Fotos_Conjunto_CO_v1, Cadastros_CO_v1 e SolicitacoesCanceladas_v1. Ocultar melhora a navegação; não muda permissões nem é uma proteção de acesso.

Cadastros_CO_v1 é o histórico interno dos comandos de pré-cadastro. Pode estar vazio mesmo com viagens: a chegada normal alimenta Motoristas_v3 diretamente. As três abas de fotos são armazenamento por finalidade, não relatórios duplicados. Seus links agora aparecem na mesma linha do controle, permitindo consultar tudo sem percorrer abas técnicas.

Gravações comuns atualizam somente a linha da viagem, inclusive depois de ordenar o controle. Reexecutar prepararOperacao reconstrói o relatório sem duplicar viagens ou modificar fontes. Não edite manualmente valores derivados do controle esperando preservá-los: eles serão recalculados.

## Validação

**260 testes simulados aprovados**, incluindo reconstrução de histórico concluído, atualização incremental após ordenação, três links distintos, preservação das fontes/cadastros e visibilidade das abas. Sem acesso à planilha real, sem implantação na conta Colgate e sem teste visual real no Google Sheets nesta alteração.

---

# Colgate v0.21 — Chegada mais clara na Colômbia

## Atualizar da v0.20

Substitua **Index.html e ColombiaUI.html**, publique uma **New version** e reabra o aplicativo. Não há migração de planilha nem mudança de permissão.

- Pré-cadastros saiu do meio dos campos e passou para uma ação secundária no topo da chegada. A explicação deixa claro que a chegada normal já cadastra o motorista automaticamente; pré-cadastro serve para antecipar ou corrigir dados.
- Transportadora mantém sua posição ao trocar a finalidade, evitando a reorganização inesperada dos campos.
- Número do contêiner mostra o exemplo **ICSU4065506** e explica: quatro letras, seis números de série e um dígito verificador. A conferência existente continua mostrando o dígito esperado e exigindo confirmação física.
- Produtos colombianos usam busca por código/nome e caixas de seleção por toque, sem Ctrl/Cmd. A busca não apaga os produtos já selecionados. A seleção é obrigatória nas finalidades aplicáveis e conserva o contrato de gravação existente.
- Cabeçalho, espaçamento e grupos da chegada foram ajustados para leitura no tablet, preservando os temas e o painel de aprovações.

**256 testes simulados passaram**, incluindo seleção/filtragem/coleta dos produtos e preservação da posição da transportadora. Não houve teste visual no tablet físico ou execução contra planilha real nesta alteração.

---

# Colgate v0.20 — Administrador multipaís e conferência de contêiner

## Atualizar da v0.19.1

1. Substitua **Code.gs, Index.html e ColombiaUI.html** e publique uma **New version**.
2. Não precisa executar preparação de planilhas ou migração. As colunas da aba central Usuarios permanecem iguais.
3. Para um administrador operar dois países, mantenha **uma única linha para o e-mail** na aba **Usuarios**:

| Campo | Exemplo |
|---|---|
| Pais | BR;CO |
| Unidades | BR-JAGUARE;CO30 |
| Perfil | ADMINISTRADOR |
| Status | ATIVO |

Use exatamente os códigos existentes nas abas Paises e Unidades. O exemplo autoriza somente Jaguaré e CO30. Para outras unidades, acrescente seus códigos separados por ponto e vírgula, como já ocorre hoje. Cada país listado deve ter ao menos uma unidade atribuída, estar ativo e possuir sua própria planilha. Não duplique o e-mail em duas linhas.

O usuário precisa reabrir o aplicativo para atualizar as autorizações do login. Aparece um seletor de países no topo. A troca apresenta as unidades do país escolhido e limpa os dados visuais da unidade anterior. O outro país não recebe acesso por ser administrador: ambos precisam estar explicitamente cadastrados na mesma linha. Os demais perfis continuam com um único país; a tela não oferece acesso multipaís para GERENTE ou SEGURANCA.

A troca usa a sessão validada, sem releitura das tabelas centrais e sem renovar suas quatro horas. A unidade de cada requisição resolve o país/planilha no servidor dentro dos acessos autorizados: um envio em andamento não muda de destino quando se altera o país na tela. A fila persistente conserva as solicitações e apresenta/processa as do país ativo. Não apague pendências para trocar de país. Operações administrativas executadas no editor mantêm o último país escolhido, depois de validar novamente a configuração e os perfis.

## Contêiner colombiano

A fórmula do dígito verificador já existia no servidor. Agora o campo de Exportação mostra também a conferência durante o preenchimento:

- Com quatro letras e seis números, mostra o dígito esperado.
- Com o número completo, informa se o dígito coincide; divergência destaca o campo e impede envio.
- Aceita colagem com espaços/hífens e normaliza as letras para maiúsculas.
- Não completa nem corrige o dígito automaticamente. O vigilante compara com a identificação física e confirma a conferência.
- Alterar o número desmarca a confirmação física anterior.
- Exemplo do gerente: **ICSU4065506**. Resto dez produz dígito **zero**, e não dez.

## Validação

**254 testes simulados**: 23 acesso, 33 chegada, 41 operação, 14 sessão, 63 frontend, 45 gravação, 18 Colômbia, 13 fila e 4 medições. Incluem administração em dois países, bloqueio de perfis/unidades não autorizados, conservação do vencimento da sessão, gravação correta de envios após troca e o exemplo do contêiner. Não houve implantação ou autenticação real na conta Colgate nem teste visual em tablet nesta atualização.

---

# Ajuste visual v0.19.1 — seleção de fotos

Substitua **Index.html e ColombiaUI.html** e publique uma **New version**. Não exige preparação de planilha.

A seleção de foto usa somente o campo nativo. O botão duplicado Selecionar arquivo foi removido. A remoção fica no **× sobre a prévia**, exibido apenas depois de selecionar uma imagem. O seletor nativo aceita imagens; as opções de câmera/galeria dependem do dispositivo. Obrigatoriedade e envio das fotos permanecem iguais.

---

# Colgate v0.19 — Operação colombiana

## Instalar a partir da v0.18

1. Conclua ou reenvie pendências antes de atualizar. Não limpe os dados dos navegadores.
2. Substitua **Code.gs, Chegada.gs, Operacao.gs, FotosDrive.gs, Cancelamentos.gs, Index.html e Fila.html**.
3. Crie o arquivo de script **Colombia.gs** e o arquivo HTML **ColombiaUI.html**. O nome no editor deve ser Colombia e ColombiaUI, respectivamente. Os demais arquivos continuam necessários, incluindo Patio.gs.
4. Como **ADMINISTRADOR cadastrado no país CO**, execute **prepararOperacao**. Cria e formata três abas adicionais sem apagar fontes: Cadastros_CO_v1, Veiculos_CO_v1 e Fotos_Conjunto_CO_v1.
5. Com o mesmo perfil/país, execute **migrarCadastrosColombia** para importar placas históricas ainda ausentes. É idempotente e não substitui tipos/observações editados manualmente.
6. Execute **verificarConfiguracaoColombia**. Confira CO30, CO20, CP39, endereços, fuso e catálogos no resultado. Essa função só lê e não altera o controle.
7. Publique uma **New version** no Deploy e reabra nos dispositivos dos dois países. Não há novo escopo Google. Não é necessário preparar ou migrar o Brasil novamente.

## O que mudou

Regras CO ficam em Colombia.gs, entregues ao frontend na configuração autenticada. ColombiaUI.html concentra os componentes exclusivos. Brasil conserva suas finalidades e checklists. A entrada CO-2 contém os 16 itens confirmados do checklist anterior e das adições colombianas, sem calço. Pneus e contêiner têm causas múltiplas e Outro obrigatório. A vistoria aprovada é preservada com a versão e causas, independentemente do idioma.

Pré-cadastro no botão **Cadastros de motoristas e veículos**, na chegada. Selecione a entidade, informe documento/placa e use Consultar para carregar os dados antes de editar. O histórico de veículos aparece após a consulta por placa. Salvar usa a mesma fila persistente; somente a confirmação do servidor significa cadastro gravado. Documento e placa não são vinculados permanentemente. O histórico append dos comandos fica em Cadastros_CO_v1. Observações de viagens anteriores aparecem automaticamente ao sair dos campos documento/placa, dentro das unidades autorizadas; informação histórica não bloqueia uma viagem nova.

As oito finalidades usam os campos próprios. Reciclagem e Outra aceitam empresa/pessoa livre. Notas, remitos e lacres usam campos individuais com botões. Exportação vazia admite lacre sem fatura e exige foto do lacre na entrada. A saída CO exige destino, foto conjunta do motorista/caminhão e, quando há lacre de saída, uma foto própria do lacre. Carga declarada carregada exige notas/lacres; sem carga os documentos podem ficar vazios. Fotos são arquivos distintos no Drive, com links privados nas abas de fotos. O usuário do link precisa ter acesso ao arquivo no Drive; não foi criado compartilhamento público. O aplicativo mantém a visualização autenticada por viagem e unidade.

Em novas movimentações CO, fotos são persistidas antes do evento que efetiva entrada/saída. Se houver falha, o evento não conclui a movimentação; reenvios reaproveitam os arquivos já criados. Checklist, eventos e cadastros seguem idempotência e proteção contra conflitos. Só a confirmação real autoriza considerar a gravação concluída.

Bogotá é o fuso operacional CO, independentemente do tablet. Espanhol é o padrão sem preferência; preferência por conta e idioma do usuário são respeitados. Modos claro/escuro e painel permanente de aprovações permanecem.

## Dependências externas e matriz

Veja [PENDENCIAS-COLOMBIA.md](PENDENCIAS-COLOMBIA.md). O formulário completo original de saída não foi fornecido: ficaram os três itens confirmados, versionados, sem System Liberation. Não foi afirmado atendimento integral a um formulário desconhecido. Unidades, endereços e catálogos precisam de conferência na planilha real.

## Validação

**245 testes automatizados simulados**: 18 acesso, 33 chegada, 41 operação, 14 sessão, 61 frontend, 44 gravação, 17 específicos CO, 13 fila e 4 medições. Serviços Google/Drive e DOM são simulados. Não houve autenticação Colgate nem execução contra planilhas reais. A tentativa de validação com Playwright constatou ausência do executável do navegador; não constitui teste visual.

Execute: `for f in testes/*.cjs; do node "$f" || exit 1; done`

## Roteiro curto na Colômbia

1. Conferir diagnóstico e catálogos. Validar login CO sem acesso BR e restrição por unidade.
2. Pré-cadastrar motorista e veículo. Consultar documento na chegada, verificar telefone, editar e consultar novamente. Verificar histórico de placa.
3. Registrar cada finalidade; testar várias notas/lacres/remitos e importação com duas faturas recusada no formulário.
4. Registrar exportação vazia com lacre sem fatura: a entrada exige foto do lacre e duas assinaturas.
5. Marcar pneu/contêiner não conforme, escolher causas e Outro. Confirmar retenção sem entrada. Segurança não aprova; gestor aprova ou rejeita com motivo. Conferir entrada após aprovação e nova avaliação após alteração.
6. Na saída, conferir destino, placas físicas, checklist, foto conjunta e foto separada do lacre quando aplicável. Simular falha de conexão e reenvio; não liberar veículo enquanto houver envio pendente.
7. Abrir os links do Drive com as contas autorizadas; conferir tablet em retrato/paisagem, idiomas e temas. Repetir um fluxo brasileiro como regressão operacional.

---

# Colgate v0.18 — Entrada após aprovação e telefone na chegada

## Atualizar da v0.17

1. Substitua **Index.html e Operacao.gs**.
2. Publique uma **New version** no Deploy e reabra o aplicativo nos dispositivos.
3. Não é necessário preparar a planilha novamente: não há novas abas, colunas ou permissões.

Na entrada de um registro **LIBERADO**, a vistoria e os motivos aprovados são apresentados para consulta e enviados exatamente como foram aprovados. Não é necessário responder de novo ao checklist. A portaria ainda informa os dados da entrada física, fornece as assinaturas e, quando aplicável, a foto do lacre. A autorização permanece vinculada ao gestor que decidiu.

Se algo mudou, o botão **Alterar vistoria / nova avaliação** reabre as respostas. O operador deve informar o motivo e enviar para uma nova aprovação; isso não libera uma entrada automaticamente. O servidor continua verificando o estado real e os motivos autorizados sob a trava da operação. A comparação de checklists usa o conteúdo dos itens e causas, sem depender da ordem das propriedades do JSON.

A chegada brasileira agora mostra **Telefone**, obrigatório nos novos formulários, assim como já ocorria na Colômbia. Ao consultar o CPF, nome, empresa e telefone são preenchidos pelo cadastro **Motoristas_v3**. Correções digitadas enquanto a consulta está em andamento são preservadas. Cadastros históricos sem telefone precisam receber o número manualmente; o sistema não consegue recuperar números que nunca foram informados. O backend mantém a compatibilidade com solicitações antigas já salvas na fila que não continham telefone.

Validação: **222 testes automatizados simulados**, incluindo o fluxo retenção → aprovação → entrada, preservação da autoria da autorização, bloqueio de motivos novos, reenvio idempotente, telefone salvo e preenchido pelo CPF e preservação de edições manuais. Não houve teste em tablet físico ou execução contra planilhas reais nesta atualização.

---

# Colgate v0.17 — Painel permanente de aprovações e horário das transferências

## Atualizar da v0.16

1. Substitua **Index.html e Operacao.gs**.
2. Publique uma **New version** no Deploy e reabra o aplicativo.
3. Não é necessário preparar a planilha novamente. Não há novas abas, colunas ou permissões Google.

As informações de transferência mostram data e hora no fuso **America/Sao_Paulo**, independentemente do fuso do tablet. O formato segue o idioma selecionado; em português, por exemplo, **22/11/2026, 12:07**. Os detalhes são apresentados em pares de rótulo e valor, com espaçamento e adaptação a telas menores. O instante UTC original permanece no registro para auditoria.

O painel **Aguardando aprovação** aparece à direita de Chegada, Entrada e Saída. Os registros pendentes deixam a lista comum de entrada e aparecem nesse painel com motorista, placa, finalidade, empresa e motivos. O painel acompanha a rolagem, tem contador, estado vazio e atualização manual. Em telas estreitas, vira uma faixa recolhível no topo, alinhada à direita, para não cobrir o formulário. A atualização em segundo plano a cada 30 segundos funciona nas três telas, nos dois países, quando o aplicativo está visível e sem formulário de movimentação aberto.

Ao marcar uma resposta **Não conforme**, o botão de confirmação passa para **Enviar para aprovação**. O envio usa a retenção existente no servidor, guarda checklist, causas e assinaturas e mantém o veículo fora da planta. Os motivos do checklist preenchem automaticamente a divergência quando ela não foi digitada. Não exige foto de entrada física nessa retenção; essa foto continua obrigatória na entrada efetiva quando houver nota.

Todos os operadores autorizados da unidade podem acompanhar as pendências. Somente **GERENTE (gestor)** e **ADMINISTRADOR** podem aprovar ou rejeitar, com justificativa obrigatória. A restrição é validada no servidor e continua respeitando as unidades e o país do usuário. A tela de decisão mostra as respostas e causas do checklist. Aprovação não registra entrada física: o guarda precisa concluir essa etapa depois. Um checklist já aprovado com os mesmos motivos pode seguir para entrada; alterar os motivos exige nova avaliação.

**217 testes automatizados aprovados**, com serviços Google, Drive, DOM e armazenamento simulados. Incluem fuso diferente do tablet, encaminhamento automático para retenção, decisão por perfil e manutenção do veículo fora da planta. Não houve teste visual no tablet físico nem execução com planilhas reais nesta atualização.

---

# Colgate v0.16 — Destinos e transferências entre plantas brasileiras

## Atualizar da versão 0.15

1. Antes de atualizar, conclua ou reenvie operações pendentes nos dispositivos. Não limpe os dados do navegador.
2. Substitua **Chegada.gs, Operacao.gs e Index.html** pelos arquivos deste repositório. Preserve os outros arquivos da versão 0.15.
3. Publique uma **New version** no Deploy e reabra o aplicativo nos tablets. Quem já preparou a versão 0.15 não precisa executar outra preparação: esta atualização usa as mesmas abas e permissões. Em instalação anterior, siga a preparação da versão 0.15 abaixo.
4. Confira na configuração central se **Imigrantes, Anchieta e Jaguaré** estão cadastradas como unidades ativas do Brasil, com códigos próprios, apontando para a mesma planilha brasileira do país. Cada usuário continua vendo somente as unidades atribuídas a ele. Uma sessão já aberta só reconhece mudanças de configuração ao renovar o login.

## Comportamento da versão 0.16

- Destinos brasileiros: Imigrantes, Anchieta, Jaguaré (unidades ativas cadastradas, excluindo a unidade atual), RCR, Gylog, CD Nysseis, K&G, Provider e Outro. Outro abre um campo obrigatório. Destinos externos não criam recebimentos entre unidades. Veículos descarregados continuam dispensados de destino, conforme regra anterior.
- Havendo qualquer lacre na saída, a foto é obrigatória no formulário e no servidor, inclusive nos casos raros de saída descarregada com nota/lacre. Reenvios de saídas históricas já gravadas sem foto continuam idempotentes.
- Ao abrir uma saída, o sistema consulta as carretas presentes no pátio. Se a carreta original já saiu com outro cavalo, abre a troca automaticamente e exige conferência explícita das carretas selecionadas ou da saída sem carreta. A confirmação consulta o estoque novamente antes de entrar na fila de gravação. A gravação final também valida sob trava: a conferência prévia não reserva uma carreta.
- Saída carregada com destino a outra unidade interna gera automaticamente uma viagem na fila de entrada dessa unidade, com motorista, documento, telefone, empresa, cavalo, carretas efetivamente levadas, notas e lacres de saída. Não exige outro cadastro manual na chegada. O registro significa **aguardando entrada**, podendo ainda estar em trânsito: não marca entrada física nem adiciona as carretas ao pátio do destino.
- A fila de entrada brasileira atualiza em segundo plano a cada 30 segundos enquanto está visível e sem formulário aberto; também pode ser atualizada manualmente. Não há atualização em tempo real via push.
- O botão **Verificar informações da transferência** mostra origem, dados do motorista e carga e a foto do lacre enviada na saída. O servidor só permite consultar esses dados por uma viagem recebida na unidade autorizada, sem conceder acesso geral aos registros de outra planta.
- A conferência de entrada continua exigindo checklist, assinaturas e foto local quando houver notas. A foto da origem é uma referência para comparação, preservada separadamente da foto de entrada.
- Reenvios usam uma chave derivada da saída: não duplicam a viagem no destino e reparam falhas parciais. Se já existir motorista ou veículo ativo no destino, a saída é recusada antes da gravação. A saída só está confirmada após a confirmação do servidor; uma solicitação ainda pendente no ícone de sincronização não é uma liberação física.

Validação: **210 testes automatizados com serviços Google, DOM e armazenamento simulados**. Não houve teste com planilhas reais, conta Colgate ou tablet físico nesta atualização.

---

# Colgate v0.15 — Troca de carretas, foto de saída, cancelamento e EPI

## Instalar

1. Feche o aplicativo nos dispositivos. Procure concluir/reenviar pendências antes de atualizar, mas **não apague os dados do navegador** se houver uma falha sem confirmação.
2. Substitua **Chegada.gs, Operacao.gs, FotosDrive.gs, Index.html e Fila.html**.
3. Crie dois arquivos de script: **Patio** (Patio.gs) e **Cancelamentos** (Cancelamentos.gs).
4. Salve e execute **prepararOperacao** como ADMINISTRADOR de cada país utilizado. No Brasil, Controle_BR passa automaticamente de 33 para **36 colunas**, preservando as colunas existentes e reconstruindo as linhas a partir das fontes.
5. Publique uma **New version** no Deploy e reabra pelo mesmo endereço, com a mesma conta/perfil do navegador. Code.gs e appsscript.json permanecem iguais; não há novo escopo.

A preparação cria **Fotos_Saida_v1** e **SolicitacoesCanceladas_v1**. As novas colunas de Controle_BR são Carreta Saída, Carreta 2 Saída e Foto Lacre Saída. As carretas da chegada continuam nas colunas originais. Fontes e arquivos anteriores não são apagados.

## Troca de carretas

O formulário de saída oferece “Trocar as carretas na saída?”. Ao escolher Sim, dois seletores são preenchidos pelo servidor com as carretas registradas fisicamente dentro da unidade atual. Uma seleção vazia permite sair sem carreta. Não há campo livre para inventar placas. Enquanto a consulta não termina, não é possível confirmar uma troca; existe botão para atualizar a lista.

O estoque é calculado pelos eventos ENTRADA/SAIDA, separado por país e unidade. A chegada na portaria não coloca a carreta dentro da planta. Uma carreta deixada pelo cavalo que sai continua no estoque. Uma carreta levada por outro cavalo sai do estoque, e uma segunda tentativa de saída com ela é recusada. A conferência final ocorre sob a mesma trava da gravação, usando os dados reais naquele momento. O cavalo não é alterado por essa opção.

As entradas e saídas históricas são consideradas. Como versões anteriores não registravam trocas, o histórico antigo pressupõe saída com as carretas de chegada; trocas físicas antigas não registradas não podem ser inferidas automaticamente. Confira o estoque físico antes de adotar a nova opção em operação. A versão não cria cadastro avulso manual de carretas.

## Foto do lacre de saída

Ao preencher um lacre na saída, aparece a opção de foto, **opcional**. É compactada e enviada ao Drive, com referência em Fotos_Saida_v1 e link na última coluna de Controle_BR. A foto da entrada permanece em Fotos_v3/coluna Foto Lacre. Os arquivos são distintos por etapa, mesmo que a imagem seja a mesma. Remover o lacre limpa a foto que ainda estava no formulário. A busca de histórico permite abrir também a foto de saída quando existente.

## Cancelar solicitação com erro

No popup de sincronização, uma solicitação em FALHA oferece Cancelar solicitação. O servidor verifica conta, país, unidade e identificador usando a trava de gravação. Se nada foi gravado, registra o cancelamento e bloqueia um eventual envio atrasado com a mesma identificação; só então a fila remove os dados locais.

Se a operação já consta na fonte/eventos, a interface orienta reenviar para finalizar a confirmação/reparar uma falha parcial. Cancelar a solicitação não desfaz uma entrada/saída física já registrada. Sem resposta do servidor ou sem conexão, os dados ficam preservados. Um reenvio fica bloqueado enquanto o cancelamento está sendo verificado. O registro de cancelamento fica na aba técnica para auditoria.

Reenvios de entradas/retencões já gravadas na versão anterior continuam podendo confirmar o checklist histórico sem inventar respostas de EPI. Novas solicitações precisam responder os itens atuais. Uma retenção/autorização antiga pode precisar de nova avaliação antes de uma entrada com checklist atualizado.

## Três itens de EPI

Entrada no Brasil e na Colômbia acrescenta **colete refletivo, bota de segurança e capacete**. São três perguntas, sem opção N/A. Usam as mesmas respostas Conforme/Não conforme e exigência de causa da inspeção existente. Não conformidade segue o fluxo de retenção e autorização, sem liberação automática. O servidor também exige as respostas.

**Validação:** 201 testes locais com serviços Google/Drive, DOM e armazenamento simulados. Novos cenários cobrem estoque após troca, indisponibilidade após outra saída, saída sem carreta, links de fotos separados, cancelamento com confirmação/bloqueio de envio tardio, autoria, reenvio histórico e EPI. Migração de 33 para 36 colunas e preservação de viagens também verificadas. Sem acesso a planilhas reais ou teste visual/câmera/assinaturas no tablet nesta atualização.

---

# Colgate v0.14 — Campos individuais de notas e lacres no Brasil

**Instalar:** substitua somente **Index.html**, salve e publique uma New version no Deploy. Nenhuma alteração de planilha, manifesto, escopo ou preparação é necessária. Atualize com a fila vazia.

- Notas e lacres brasileiros deixam de usar uma caixa com um item por linha. Cada nota/lacre tem seu campo; Adicionar outra nota ou Adicionar outro lacre cria mais um campo, com botão Remover para o item adicional.
- O mesmo componente aparece na chegada (quando a finalidade usa essas informações) e na saída. Coleta continua sem nota na chegada; transferência continua exigindo nota e lacre.
- A saída carregada exibe asteriscos visíveis e persistentes nos títulos de nota e lacre, inclusive depois de trocar idioma. Todos os campos adicionais abertos precisam ser preenchidos ou removidos.
- A saída descarregada mantém os botões opcionais da versão anterior. Quando aberta uma nota opcional, também é possível acrescentar mais notas e lacres; remover a nota opcional ou mudar o tipo de saída limpa os itens que ficaram ocultos.
- O servidor continua recebendo as mesmas listas, com limite de 100 itens por lista; o esquema da planilha e a fila de gravação não mudam. Restaurar uma chegada rejeitada antes de gravar preserva cada item da lista.
- O projeto registra em PENDENCIAS-COLOMBIA.md a retomada solicitada para 21/11/2026. As telas colombianas de notas/lacres permanecem para a retomada própria.

**Validação:** 186 testes locais simulados; novos casos conferem múltiplos campos, três lacres, remoção de item intermediário, asterisco após tradução, limpeza de dados ocultos e restauração de listas. Sem teste visual no tablet nesta atualização.

---

# Colgate v0.13.1 — Reparar links das fotos

Substitua **Operacao.gs e FotosDrive.gs**, salve e execute **atualizarLinksFotos** no editor como ADMINISTRADOR do país. Essa função converte até 20 fotos antigas por vez e corrige os links em Fotos_v3 e Controle_BR, sem reconstruir ou alterar as outras informações do relatório. Repita enquanto o log indicar fotos convertidas; quando indicar 0, os links existentes já foram reparados. Depois publique uma New version para novas movimentações. Atualize com a fila vazia.

O relatório agora grava o **URL real do arquivo** como texto da célula e aplica também o hyperlink. Não depende mais do marcador “Disponível no sistema”. Reconstruções e atualizações da viagem preservam o endereço. Sem foto no Drive, uma imagem legada recebe indicação explícita de conversão, em vez de aparentar ter link. O caminho de criação do hyperlink não ignora silenciosamente uma falha da API.

A conta que abre o link precisa de acesso à pasta do país no Drive. A autorização do aplicativo, as pastas e o manifesto são os da versão 0.13; não há escopo novo nesta correção. Não é necessário executar prepararOperacao novamente apenas para reparar links. A conversão não duplica arquivos e a imagem antiga só é substituída depois de salva.

Validação: **181 testes locais simulados**, incluindo reparo de célula com marcador, URL e hyperlink reais na simulação, preservação das demais colunas e reconstrução sem perder o link. Sem acesso à planilha/Drive real ou confirmação de prévia visual no Google Sheets.

---

# Colgate v0.13 — Abas de apoio, fotos no Drive e saída descarregada

## Instalar

1. Esvazie a fila e feche o aplicativo nos dispositivos durante a atualização.
2. Substitua **Operacao.gs, Index.html e appsscript.json**. Adicione um arquivo de script chamado **FotosDrive** e copie FotosDrive.gs. Code.gs, Chegada.gs e Fila.html permanecem iguais.
3. Se o manifesto não estiver visível: Project Settings → Show "appsscript.json" manifest file in editor. O manifesto adiciona o escopo **https://www.googleapis.com/auth/drive** usado pelo DriveApp. O Google pedirá nova autorização para Drive; o escopo é amplo, embora o código trabalhe nas pastas de fotos do aplicativo. Não há serviço avançado a ativar.
4. Salve e execute **prepararOperacao** com ADMINISTRADOR de cada país. Isso formata as respectivas abas e cria uma pasta privada Logistica_Fotos_BR ou Logistica_Fotos_CO. O link da pasta aparece no Execution log. O país é o da conta cadastrada; não se altera o cadastro de país automaticamente.
5. Compartilhe a pasta do país com as contas que precisam abrir as fotos (Leitor). Se o web app executa como o usuário que acessa, operadores que enviam fotos também precisam de permissão de Editor na pasta. Se executa como proprietário, esse proprietário precisa de acesso para gravar. Compartilhar a planilha não concede automaticamente acesso à pasta do Drive. O código não envia convites nem muda compartilhamento.
6. Publique uma **New version** e reabra o aplicativo. Os operadores podem precisar autorizar o novo escopo, conforme a implantação.

## Abas formatadas

Chegadas_v2, Motoristas_v3, Eventos_v3, Fotos_v3, Produtos_v2 e Transportadoras_v2 recebem cabeçalhos com cores próprias, filtro, primeiras colunas e linha de cabeçalho fixas, larguras maiores, linhas alternadas e espaçamento. A formatação também cobre linhas vazias já existentes para acomodar novos registros. Células técnicas com JSON/assinaturas e imagens antigas são exibidas com corte visual, evitando linhas gigantes; o conteúdo completo é preservado. A configuração visual de Controle_BR permanece a mesma.

No Brasil as fontes técnicas continuam ocultas; sua formatação pode ser vista ao reexibir a aba. As três abas de relatório arquivadas da versão 0.12 não são refeitas nem reativadas. Na Colômbia o esquema de abas existente é mantido, sem criar um relatório brasileiro ou renomear cabeçalhos técnicos.

## Fotos

Novas fotos são salvas como JPEG no Drive, em pastas separadas por país. A coluna Imagem de Fotos_v3 passa a guardar o URL direto do arquivo, mantendo o esquema de cinco colunas. Controle_BR usa um link **Ver foto no Drive**; o arquivo abre no visualizador do Drive. O aplicativo continua mostrando a imagem após conferir unidade e país e verificar a pasta do arquivo. Arquivos não são publicados nem compartilhados por link automaticamente.

Reenvio usa nome determinístico por viagem/solicitação/conteúdo para recuperar um arquivo criado antes de uma falha parcial, sem criar outra cópia. Se uma foto antiga da chegada for substituída por uma da entrada, o arquivo anterior não é apagado do Drive. A duração real da gravação passa a incluir o upload; a fila e as medições continuam funcionando.

**Fotos antigas:** execute **migrarFotosParaDrive** como administrador do país. Converte até 20 imagens Base64 por execução, substituindo a célula somente depois de salvar no Drive. Repita até o log indicar 0 fotos convertidas. Depois execute prepararOperacao novamente para atualizar os links do relatório. Sem conversão, as fotos antigas continuam acessíveis pelo aplicativo e o relatório mantém o link anterior para elas. Migração não muda o compartilhamento das pastas.

## Saída descarregada

Ao escolher Não em “O veículo está saindo carregado?”, destino, notas e lacres ficam ocultos/desabilitados. Destino não é exigido nem gravado nessa situação. Um botão Adicionar nota (opcional) revela o campo de nota; só depois de preenchê-la surge Adicionar lacre (opcional). Ao abrir um extra, é preciso preenchê-lo ou removê-lo pelo respectivo botão. Remover a nota também remove/limpa o lacre. Trocar de carregado para descarregado limpa os dados agora ocultos.

Saída carregada continua exigindo destino, nota e lacre. O servidor também impede lacre sem nota em saída descarregada e mantém as demais conferências de checklist, assinaturas e calço.

**Validação:** 179 testes locais com serviços Google, Drive, DOM e armazenamento simulados. Cobrem formatação sem alterar valores, manutenção de Controle_BR, países separados, link direto, migração em lotes, reenvio sem duplicar arquivo e fluxo dos extras na saída. Não houve acesso ao Drive/Sheets real nem teste visual no tablet nesta atualização.

---

# Colgate v0.12 — Relatório único e espaçamento da placa adicional

## Atualização necessária

1. Deixe a fila de solicitações vazia e feche o aplicativo nos dispositivos durante a atualização.
2. Substitua **Operacao.gs e Index.html** e salve. Os demais arquivos permanecem na versão 0.11.
3. Como ADMINISTRADOR do Brasil, selecione **prepararOperacao** no editor e clique Run. Isso cria/popula/formata Controle_BR a partir das fontes existentes. Aguarde a conclusão.
4. Publique uma **New version** no Deploy e reabra o aplicativo.

Nesta versão a preparação é necessária, pois a gravação brasileira passa a exigir a aba Controle_BR. Não é necessário editar cabeçalhos manualmente ou alterar permissões. Preparação repetida não duplica viagens. O esquema de outros países permanece igual.

## Relatório consolidado

**Controle_BR** substitui Chegadas_BR, Entradas_BR e Saidas_BR como relatório operacional. Uma linha por ID de viagem reúne as mesmas 33 colunas que já existiam em Saidas_BR, desde a chegada até a saída, inclusive para veículos aguardando entrada ou ainda dentro da planta. A linha é atualizada por ID, preservando o funcionamento se a ordem da tabela for alterada.

As três abas antigas são **ocultadas e preservadas sem reescrever seus dados**, como histórico da transição. Deixam de receber atualizações e podem ser reexibidas pelo menu do Google Sheets, se necessário. Fontes Chegadas_v2, Eventos_v3 e Fotos_v3 continuam sendo os registros técnicos do sistema; o cadastro Motoristas_v3 e os catálogos também são preservados. A consolidação utiliza essas fontes, sem importar edições manuais feitas apenas nos relatórios antigos.

Cada chegada, entrada, retenção, autorização ou saída altera somente **uma linha de relatório**, em vez de três. A reconstrução completa continua restrita à preparação administrativa.

## Apresentação

- Cabeçalhos por grupo: identificação em azul escuro, chegada em vermelho, entrada em azul e saída em verde.
- Cabeçalho e três primeiras colunas fixos, filtro e linhas alternadas.
- Larguras maiores para motorista, transportadora, notas, lacres, divergências e checklists.
- Texto com quebra de linha, alinhamento vertical central e altura ajustada ao conteúdo. A formatação geral ocorre na preparação; a linha movimentada recebe quebra/altura ajustadas sem reconstruir toda a tabela.
- No aplicativo, botão Remover placa adicional separado do campo por 12 px, em linha própria e com área de toque de pelo menos 48 px.

**Validação:** 171 testes locais com serviços Google/DOM simulados. Incluem migração com preservação dos relatórios antigos, uma única linha por viagem, nova preparação sem duplicação, gravação apenas da viagem alterada e chamadas de formatação/filtro/larguras. Aparência da planilha real e do tablet ainda deve ser conferida após instalar.

---

# Colgate v0.11 — Finalidade visível, horário brasileiro e assinaturas

**Atualização:** substitua **Code.gs, Chegada.gs, Operacao.gs e Index.html**, salve e publique uma New version no Deploy. Fila.html e appsscript.json permanecem iguais. Atualize com a fila vazia: novas entradas e retenções exigem as duas assinaturas. Não há mudança de cabeçalhos ou escopos.

- Nos cartões de entrada/saída, a finalidade aparece antes da transportadora: “Transferência · Transportadora”. O cabeçalho do formulário também apresenta finalidade, empresa, motorista e placas.
- As unidades brasileiras atuais (todas em São Paulo) usam **America/Sao_Paulo**, mesmo se a coluna Fuso do país ou a sessão antiga estiver em UTC. Chegada, entrada, saída e relatórios exibem esse horário. Colômbia continua usando seu fuso cadastrado.
- UTC permanece nas colunas técnicas InstanteUTC/Instante UTC e nos cálculos de duração. Isso preserva os instantes reais e a auditoria. Data/hora de chegada exibidas são calculadas a partir do instante original, inclusive para datas antigas salvas com formatação UTC e para viradas de dia.
- Novos registros e linhas movimentadas ficam corrigidos automaticamente. Para corrigir também todas as linhas antigas das abas **Chegadas_BR, Entradas_BR e Saidas_BR**, um ADMINISTRADOR pode executar **prepararOperacao** uma vez no editor após substituir os arquivos. Essa reconstrução preserva as fontes/eventos/cadastros e não inventa assinaturas antigas. Campos de data local antigos na fonte técnica não são sobrescritos; a exibição/reconstrução usa o instante original.
- A entrada brasileira recebe os mesmos dois espaços separados da Colômbia: **assinatura do motorista** e **assinatura do vigilante**. Ambas precisam ser preenchidas. Retenção no módulo de entrada segue a mesma regra já usada pela Colômbia. O servidor rejeita uma assinatura ausente, além da conferência na interface. As assinaturas são persistidas no evento; não são enviadas na listagem pública de viagens. Registros históricos sem assinatura não são alterados.

**Validação:** 169 testes locais, com serviços/DOM simulados. Novos casos verificam ausência de cada assinatura, persistência separada, finalidade antes da empresa, Brasil com cadastro UTC, horário de entrada e virada de dia no fuso de São Paulo. Sem teste visual/desenho de assinatura no tablet ou acesso a planilhas reais nesta atualização.

---

# Colgate v0.10 — Bloqueios antes do envio e saída carregada

**Atualização:** substitua **Chegada.gs, Operacao.gs e Index.html**, salve e publique uma New version no Deploy. Não precisa executar prepararOperacao nem alterar cabeçalhos. Atualize sem solicitações pendentes: as novas regras exigem informações que a versão anterior não enviava. Code.gs, Fila.html e manifesto permanecem iguais.

- Transferência no Brasil exige ao menos uma nota e um lacre. Obrigatoriedade aparece no formulário e é conferida novamente no servidor. A lista de lacres se abre ao preencher notas.
- A placa brasileira de uma nova chegada segue o formato Mercosul **ABC1D23** (três letras, número, letra, dois números). Ao sair do campo, espaços/hífen são removidos e letras ficam maiúsculas; erros aparecem junto ao campo. O envio bloqueia a placa inválida antes de criar pendência. O servidor aplica o mesmo formato. Registros históricos com placa de formato antigo são preservados. A regra não altera as placas colombianas.
- Checklist de entrada não oferece N/A para mecânica, vazamentos, pneus, estrutura, luzes e espelhos; na Colômbia, pneus, reserva e extintor também precisam de avaliação. N/A permanece para interior da carreta, cobertura/travessas/lona, outros achados, contêiner e portas/ancoragens. O servidor rejeita N/A nos itens universais, inclusive em payload adulterado.
- A saída exige responder explicitamente **“O veículo está saindo carregado?”**, sem resposta pré-selecionada. “Sim” exige nota e lacre e não permite N/A para carga/lacres do checklist. “Não” permite notas/lacres opcionais. A decisão fica no evento de saída; as colunas atuais dos relatórios não mudam. A informação depende da conferência do vigilante.
- O botão Ver foto do lacre não aparece nos cartões da fila de entrada. Na saída, só aparece quando a viagem tem foto realmente armazenada. O painel consulta apenas os IDs das fotos para essa indicação, sem carregar todas as imagens. A foto continua sendo capturada no formulário de entrada quando há nota, conforme v0.9.

**Validação:** 164 testes locais, com Google/DOM/armazenamento simulados. Novos casos conferem transferência sem documentos, saída carregada, ausência de escolha sobre carga, N/A indevido, foto ausente, placa inválida antes do envio e campos condicionais. Não é teste visual da implantação/tablet e não mede latência Google.

---

# Colgate v0.9 — Cadastro de motoristas e foto na entrada

**Atualizar de 0.8:** substitua **Chegada.gs, Operacao.gs e Index.html**, salve e publique uma New version no Deploy. Mantenha Code.gs, Fila.html e o manifesto atuais. Atualize somente quando a fila de solicitações estiver vazia. Não mudam os escopos nem as colunas das abas operacionais existentes.

## Alterações

- “Últimas chegadas” foi retirada da tela. Entrada e saída continuam disponíveis, assim como busca de histórico pelo botão existente.
- A primeira chegada confirmada cadastra o motorista em **Motoristas_v3**, na mesma planilha operacional do país. A aba é criada automaticamente quando necessária; prepararOperacao também a prepara. País, documento, nome, empresa, telefone, instante e última viagem ficam registrados. As próximas visitas atualizam o cadastro, sem duplicar o documento. Reenvio de uma chegada antiga não desfaz dados de visita posterior. Não sobrescreve uma aba legada Motoristas.
- Ao completar o CPF brasileiro (ou sair do campo de documento em outros países), a busca em segundo plano preenche nome e empresa. Campos continuam editáveis. Respostas de outro documento, unidade, país ou sessão são descartadas; dados digitados manualmente durante a busca não são sobrescritos. Empresa que não esteja no catálogo ativo exige seleção manual. A busca não preenche placas, checklist, aprovação ou situação de segurança social a partir de visitas anteriores.
- Unidades autorizadas de um mesmo país compartilham o cadastro desse país. Conta sem autorização para o país/unidade não consulta esse cadastro pela API. Registros históricos anteriores à atualização não são importados automaticamente para o cadastro: novas chegadas confirmadas o alimentam.
- **Coleta no Brasil não mostra nem grava notas na chegada.** Notas da coleta podem ser registradas na saída, como antes.
- “Placa da carreta” não tem mais “se houver”. O botão **+** ao lado cria o campo da segunda carreta no Brasil, com opção de removê-lo. As três colunas existentes (cavalo e até duas carretas) são preservadas; não há expansão ilimitada de placas.
- Foto do lacre saiu da chegada. No módulo de entrada, a presença de pelo menos uma nota/fatura salva na viagem mostra a foto e a torna obrigatória ao confirmar a entrada física. Sem nota, não mostra nem aceita foto. Reter/solicitar aprovação não exige a foto de entrada. No Brasil, a lista de lacres da chegada aparece apenas quando há nota; a confirmação segue conferindo as regras no servidor.
- Foto continua compactada e protegida pela unidade; fotos antigas não são apagadas. Uma foto nova da entrada pode substituir a foto legada da chegada da mesma viagem. A impressão digital da imagem integra a idempotência do evento, sem colocar a imagem inteira no JSON do checklist. Se houver falha parcial após gravar evento/cadastro, repetir a mesma solicitação repara o restante sem duplicar.

A regra da foto usa **notas realmente vinculadas à viagem**, não apenas a finalidade selecionada. Não adiciona obrigatoriedade de nota para finalidades brasileiras que atualmente permitem nota opcional.

**Validação:** 156 testes locais com serviços Google/DOM/armazenamento simulados. Inclui consulta e isolamento por país, atualização sem duplicidade, resposta atrasada de CPF, edição manual durante busca, placa adicional, foto obrigatória/indevida e reparação de falhas parciais. Sem gravação em planilhas reais ou validação visual da câmera/tablet nesta atualização.

---

# Colgate v0.8 — Interface simplificada para portaria e tablet

**Atualização de 0.7 para 0.8:** substitua somente **Index.html** no Apps Script, salve e publique uma New version no Deploy. Code.gs, Chegada.gs, Operacao.gs, Fila.html e o manifesto permanecem os da versão 0.7. Não altera abas, dados ou permissões. Confirme que não há solicitações pendentes antes de atualizar a implantação.

- O ícone ↻ no canto superior direito abre as solicitações em um popup. Quantidade e movimento indicam envios; uma exclamação vermelha indica falha. O indicador considera todas as unidades autorizadas desta conta e país. Reenvio e correção segura continuam disponíveis, e a exportação CSV fica recolhida em “Tempos de desempenho” dentro do popup. A correção de formulário exige estar na unidade correspondente.
- O ícone de tema aparece ao lado: sol no modo claro (branco/vermelho), lua no modo escuro (preto/azul). Preferência salva localmente quando permitido. Controles têm nome acessível, foco visível e área de toque de 48 px; animação respeita redução de movimento.
- Saída apresenta somente caminhões ainda dentro da planta. Concluídos/recusados continuam nas fontes e relatórios, sem lista na tela de saída. Uma view específica para supervisores não faz parte desta atualização.
- IDs técnicos permanecem no processamento e na planilha, mas não aparecem em cartões, histórico ou cabeçalhos de entrada/saída.
- Checklist usa grupos de opções grandes (Conforme/Não conforme/N/A), sem marcar tudo automaticamente. Não conformidade exige causa e recebe destaque. Formulários mostram quantidade de obrigatórios preenchidos, destacam faltantes e focam o primeiro inválido. Campos condicionais entram no contador quando aplicáveis; assinaturas ainda são conferidas separadamente.
- Antes do envio, a interface impede saída com não conformidade/calço não devolvido e entrada divergente sem autorização. O servidor continua validando tudo. Validar no cliente não concede autorização e não substitui a validação real.

A fila, a sessão e as medições de 0.7 continuam funcionando. Não foi alterado o armazenamento Google nem prometida redução da duração real de gravação. Testes locais usam DOM/serviços simulados; o Chromium local não iniciou por restrição do ambiente, portanto esta versão ainda precisa de conferência visual no tablet e na implantação real, especialmente nos dois temas.

---

# Colgate v0.7 — Resposta imediata e medição de desempenho

## Instalação 0.6 → 0.7

Substitua Code.gs, Chegada.gs, Operacao.gs e Index.html. Crie também um arquivo **HTML chamado Fila** e copie Fila.html. Salve e publique em Deploy → Manage deployments → Edit → Version → New version → Deploy; reabra /exec. Não muda escopos, cadastros ou colunas e não precisa executar prepararOperacao novamente.

## Uso

Chegada, entrada e saída guardam a solicitação no IndexedDB do navegador antes de liberar o formulário. Um cartão aparece imediatamente na lista de solicitações do dispositivo, com “Salvando — não confirmado”. Os registros confirmados mantêm seu estado real até o recibo; sua próxima etapa fica bloqueada enquanto houver gravação pendente. Outros caminhões podem ser atendidos sem esperar o Google. Retenção, aprovação e recusa continuam exigindo confirmação síncrona.

Há somente uma gravação em voo por página. Falhas preservam os dados e oferecem reenvio com o mesmo identificador, sem duplicar fonte/evento. Uma rejeição explícita antes de iniciar qualquer escrita, na primeira tentativa, permite corrigir os dados; assinaturas de movimentos devem ser refeitas. Após envio incerto ou recuperação da fila, mantém-se o identificador e não se permite descartar silenciosamente. A fila recupera solicitações ao reabrir no mesmo navegador/perfil/origem e pausa quando a sessão expira. Faça login novamente com a mesma conta. Uma falha exige tocar em Reenviar.

Pendências pertencem à conta, país e unidade autorizados. Fotos e assinaturas necessárias ao reenvio ficam temporariamente no armazenamento local, sendo removidas depois da confirmação. Não limpe os dados do navegador, troque perfil ou atualize a implantação com solicitações pendentes. O armazenamento pode ser bloqueado pelo navegador/política corporativa: nesse caso a solicitação não é aceita e o formulário permanece preenchido. Teste primeiro no tablet utilizado na operação.

## Medições e comparação futura com banco de dados

O botão Exportar tempos (CSV) exporta até 500 confirmações por conta neste dispositivo: tempo até persistência local/liberação lógica da interface, espera na fila, ida e volta da chamada, tempo medido dentro do servidor e etapas (trava, acesso/estrutura, validação/leitura, gravação, relatórios e flush). “Fora do servidor” é a diferença entre ida/volta e execução medida: inclui transporte, inicialização e serialização; não representa somente rede. Tempo da interface não mede pintura física da tela. A hora oficial continua sendo gerada pelo servidor ao processar a operação, portanto uma fila longa altera a distância entre clique e horário registrado.

As métricas não contêm nome, documento, placa, foto ou assinatura. Execuções também registram duração/etapas no log do Apps Script. Erros não entram na série de confirmações bem-sucedidas. A resposta imediata da tela não reduz por si só a duração da gravação Google.

Para apresentar ao coordenador, execute o mesmo conjunto de chegadas/entradas/saídas nas duas versões, mesmo dispositivo/rede e volume de histórico; compare mediana e percentil 95 de confirmação, fila, servidor e tempo da interface. A versão com banco de dados será uma implementação separada. Não há aqui medições reais de latência ou promessa de gravação instantânea.

Testes locais usam serviços, DOM e armazenamento simulados. IndexedDB real, permissões corporativas, comportamento visual no tablet e tempos Google precisam de validação na implantação.

---

# Histórico da implementação até 0.6

# Colgate v0.6 — Chegada, Entrada e Saída

## Gravação incremental — versão 0.6

A gravação anterior reconstruía Chegadas_BR, Entradas_BR e Saidas_BR inteiras em cada chegada, entrada, saída ou aprovação. Essa reconstrução relia o histórico e até as imagens de todos os lacres, além de reescrever linhas de viagens que não tinham mudado.

Agora a movimentação grava a fonte/evento e atualiza somente a linha da viagem em cada uma das três abas. A localização usa o ID da viagem, preservando o funcionamento quando as abas estão ordenadas de formas diferentes. As linhas dos demais motoristas não são reescritas.

O caminho de gravação reaproveita os dados e eventos que já foram lidos. A conferência de existência de foto lê apenas a coluna de IDs; uma foto nova consulta os metadados, e uma repetição consulta o conteúdo somente da foto correspondente. As imagens de outras viagens não são carregadas para atualizar o status de um caminhão.

Permanecem a trava de concorrência, revisão do registro, conferências de etapa/unidade/perfil, identificação da conta e idempotência. A confirmação continua após SpreadsheetApp.flush() e a atualização das três linhas: não há sucesso antecipado nem envio de gravação em segundo plano.

A reconstrução completa de relatórios continua disponível em prepararOperacao, para migração ou reparo administrativo. Se houve falha parcial após gravar um evento, repetir a mesma solicitação repara as linhas daquela viagem sem duplicar o evento. Não altere manualmente os IDs das abas geradas.

**Atualização de 0.5 para 0.6:** substitua Chegada.gs e Operacao.gs, salve e publique uma New version no Deploy. Index.html também contém a identificação 0.6 e pode ser atualizado junto. Não muda nenhuma coluna, cadastro, permissão ou propriedade; não é necessário executar prepararOperacao para instalar esta versão.

Nos testes com vinte viagens prévias, chegada/entrada/saída alteraram somente três linhas de relatório no total, e as demais permaneceram intactas. O teste também verificou que uma movimentação não lê o conteúdo das fotos dos outros lacres. Os testes são simulados e não medem latência do serviço Google real. A chamada ao Apps Script, a leitura de dados operacionais e a confirmação efetiva ainda podem levar algum tempo; esta atualização remove o trabalho repetido identificado no código, sem prometer gravação instantânea.

## Navegação sem espera de leitura — versão 0.5

Corrigida uma segunda causa de demora: a versão anterior ainda buscava o painel a cada troca de aba e desabilitava todos os controles durante a leitura. Agora Chegada, Entrada e Saída abrem com os dados que já estão na memória da página, e o checklist pode ser aberto enquanto uma atualização de leitura está em andamento.

A seleção inicial de uma unidade recebe configuração, últimas chegadas e filas numa única chamada após o login. Reabrir uma unidade durante a mesma sessão aproveita os dados já carregados. Ao navegar com dados de mais de quinze segundos, ou tocar em Atualizar lista, a consulta roda em segundo plano sem bloquear os botões. Não há consulta repetida a cada clique em abas com dados recentes, nem consulta automática periódica enquanto a tela permanece parada.

Um indicador informa quando os registros estão sendo atualizados ou quando a atualização falhou. Em caso de falha de leitura, os dados anteriores continuam visíveis. A gravação física de chegada/entrada/saída continua exigindo confirmação do servidor e impede duplo envio.

Após confirmação de gravação, o recibo atualiza imediatamente as listas locais; uma leitura em segundo plano verifica os demais registros. Respostas antigas de leitura são descartadas se a unidade, sessão ou revisão local mudaram, evitando desfazer visualmente uma operação já confirmada. Ao enviar uma operação, o servidor continua validando a revisão real da viagem para impedir decisões sobre registros alterados por outro dispositivo.

O leitor do painel agora consulta apenas as fontes necessárias e agrupa os eventos por viagem, sem conferir novamente todas as abas de relatório. A gravação e a preparação das abas continuam com suas validações.

**Atualização de 0.4 para 0.5:** substitua Index.html, Operacao.gs e Chegada.gs no Apps Script. Salve e publique uma New version no Deploy. Code.gs e appsscript.json não mudaram; não precisa executar prepararOperacao nem refazer cadastros. Reabra o endereço /exec após atualizar.

Os testes de lógica assíncrona em testes/navegacao.cjs cobrem trinta trocas de aba sem RPC após a carga, uso de checklist durante leitura, descarte de respostas antigas, isolamento de unidade e proteção contra duplo envio. Isso comprova o comportamento da lógica; não é uma medição de latência ou teste visual no Apps Script real. A primeira carga, fotos buscadas no servidor e confirmação de gravações ainda podem levar segundos conforme o Google e a conexão.

## Sessão de quatro horas — alteração da versão 0.4

O login consulta Usuarios, Paises e Unidades, valida status/perfil e guarda uma cópia da autorização no servidor, nas propriedades da própria conta. Por quatro horas as operações usam essa cópia; não consultam bloqueios nem reabrem a planilha de controle para autorização. A troca de unidade e das três telas usa a mesma sessão.

Mudanças em bloqueio, perfil, país, unidades autorizadas e configuração do país passam a valer no próximo login, ao reabrir o aplicativo ou após vencer a sessão. Não há prazo deslizante: usar o sistema não estende as quatro horas. A expiração é conferida no servidor, independentemente do reinício do navegador pela administração. Expirar a sessão do aplicativo não encerra a conta Google no navegador.

As conferências de unidade, ID de viagem, etapa e perfil continuam existindo contra os dados da sessão. As validações de negócio e as leituras/gravações de viagens e catálogos operacionais continuam necessárias. A aprovação gerencial usa o perfil validado no início da sessão.

Ao vencer, o aplicativo pede nova entrada e não reenvia uma gravação automaticamente. Confira a lista antes de repetir uma operação. Não precisa criar propriedades novas: o armazenamento de sessão é automático e não há mudança de escopos.

Quem já instalou a versão 0.3 precisa apenas substituir Code.gs, Chegada.gs, Operacao.gs e Index.html, salvar e publicar uma New version no Deploy. Não é preciso refazer os cadastros ou executar prepararOperacao novamente, pois esta atualização não muda as colunas das planilhas. Para instalações anteriores, siga a preparação abaixo.

O teste de desempenho verificou zero aberturas da planilha de controle em cinquenta conferências de unidade e num ciclo completo de chegada/entrada/saída após o login. Isso elimina essas consultas repetidas; o tempo de resposta final ainda depende dos demais serviços do Apps Script e precisa ser medido na implantação.

Esta atualização mantém os cadastros e as chegadas da versão 0.2. Use o mesmo projeto de TESTE e a mesma planilha de controle.

## 1. Atualização no Apps Script

1. Substitua o conteúdo dos arquivos Code.gs, Chegada.gs e Index.html pelos novos arquivos do pacote.
2. Crie um arquivo Script chamado Operacao e cole o conteúdo de Operacao.gs.
3. Mantenha appsscript.json como está no pacote: os escopos continuam sendo identidade de e-mail e planilhas. Não são adicionadas permissões de Drive ou Gmail.
4. Salve. Não copie os arquivos de referencias/ nem testes/ para o editor.
5. Confira seu perfil ADMINISTRADOR na aba Usuarios e o país correto (BR ou CO).
6. Selecione prepararOperacao e clique em Run. Execute uma vez com uma conta administradora de cada país que receberá a atualização.
7. Deploy → Manage deployments → Edit → Version: New version → Deploy.
8. Reabra /exec no navegador; feche as telas antigas da versão 0.2 para evitar gravações com o código anterior.

Não precisa executar prepararControle nem refazer usuários/unidades/países. Os catálogos existentes são preservados.

## 2. Três telas

| Tela | Momento | Ação |
|---|---|---|
| Chegada | Motorista apresenta os documentos na portaria | Registrar chegada; veículo continua fora da planta |
| Entrada | Vigilante confere e confirma o ingresso físico | Checklist, TAG quando aplicável, calço, divergência e confirmação de entrada |
| Saída | Caminhão deixa a planta | Checklist de saída, destino, NF/lacre se houver, devolução do calço e conclusão |

As telas são alternadas pelos três botões no topo. Botões têm área de toque de pelo menos 48 px, formulários em duas colunas no tablet e uma coluna em telas estreitas, e janelas de checklist com rolagem. O fluxo não é offline; aguarde confirmação do servidor antes de considerar registrada a movimentação. Não há sucesso simulado.

O ID de viagem acompanha todas as etapas. O registro de aprovação não é uma entrada física: a viagem fica liberada, mas só muda para Dentro da planta quando o vigilante confirma a entrada.

## 3. Planilha do Brasil

A preparação cria as três abas abaixo. As três mantêm uma linha por viagem, o mesmo ID e o mesmo status atual, incluindo os campos ainda em branco das etapas futuras. Registros da versão 0.2 são reaproveitados automaticamente, sem apagar a fonte.

### Chegadas_BR — 16 colunas

ID Viagem; Unidade; Status Atual; Data Chegada; Hora Chegada; Finalidade; Transportadora; Nome Motorista; CPF; Placa Cavalo; Placa Carreta; Placa Carreta 2; Agente Chegada; NF Chegada; Lacre Origem; Foto Lacre.

### Entradas_BR — mesmas 16, mais 9

Data Entrada; Hora Entrada; Agente Entrada; N° TAG; Tempo Retenção; Controle Calço; Divergência / Liberação; Autorizado por; Checklist Entrada.

### Saidas_BR — mesmas 25, mais 8

Data Saída; Hora Saída; Agente Saída; Tempo Permanência; Destino; NF Saída; Lacre Saída; Checklist Saída.

Os status distinguem aguardando entrada (fora), pendente de avaliação (fora), aguardando autorização (fora), liberado aguardando entrada física, dentro da planta, concluído e recusado (fora).

As três abas são visualizações geradas pelo sistema: não altere nelas status, horários ou checklists manualmente, pois os valores daquela viagem serão regenerados na próxima movimentação ou numa reconstrução administrativa. Os dados técnicos ficam em Chegadas_v2, Eventos_v3 e Fotos_v3, ocultados no Brasil. Ocultar uma aba organiza a tela; não cria uma nova camada de permissão para quem tem acesso direto à planilha. As demais abas antigas não são removidas.

Se uma atualização de visualização falhar após gravar um evento, o registro do evento é preservado. Repetir exatamente a mesma operação repara as visualizações sem duplicar o evento. Um administrador também pode executar prepararOperacao para reconstruí-las a partir das fontes preservadas.

## 4. Tempos

- Tempo Retenção = chegada na portaria → confirmação de entrada física.
- Tempo Permanência = confirmação de entrada física → confirmação de saída.
- Cálculo feito no servidor com os instantes UTC; exibição no fuso cadastrado do país.

Esses intervalos não isolam o serviço de carregar/descarregar. Para medir somente o serviço seriam necessários eventos adicionais de início e fim. A versão não inventa esses horários.

## 5. Regras brasileiras

NF de chegada, lacre de origem, NF de saída e lacre de saída são opcionais; listas recebem um valor por linha. Transportadora continua vindo do catálogo ativo. Na transferência, a própria unidade não aparece como origem e também é bloqueada no servidor. Outras unidades ativas do mesmo país ficam disponíveis; o cadastro do usuário define onde ele pode operar, não necessariamente todos os locais que podem constar como origem.

O campo TAG aparece somente em unidade brasileira cujo código ou nome cadastrado contém IMIGRANTES. Com o cadastro atual, BR-IMIGRANTES/CD Imigrantes é identificado automaticamente. Uma TAG enviada para outra unidade é rejeitada pelo servidor.

Na entrada, o controle de calço tem Próprio, Emprestado ou Não se aplica. Se emprestado, a saída exige confirmar a devolução. O checklist de entrada não usa a pergunta de calço: o controle fica separado.

A versão inclui uma base de checklist brasileiro (mecânica, fluidos, pneus, estrutura, luzes, espelhos, interior, cobertura e outras condições) e checklist de saída (veículo, carga, lacres), com Conforme, Não conforme e N/A. Os itens precisam ser confirmados pelo responsável operacional antes do uso real, pois podem variar conforme unidade/finalidade. Os checklists específicos do protótipo antigo por finalidade ainda não foram migrados integralmente.

## 6. Divergência e autorização

1. Vigilante preenche o checklist e a causa de cada não conformidade.
2. Informa o motivo da retenção e usa Reter / solicitar autorização. Nenhuma entrada física é registrada.
3. Usuário GERENTE ou ADMINISTRADOR com acesso à mesma unidade vê Autorizar entrada e Recusar entrada.
4. A decisão exige justificativa e grava o nome/e-mail autenticado. Não existe campo para digitar um nome e simular quem autorizou.
5. Após aprovação, o vigilante confirma a entrada física. Mudança do checklist aprovado ou introdução de outra divergência exige nova avaliação.
6. A saída só conclui com checklist sem não conformidades e devolução do calço emprestado confirmada. Não há autorização excepcional de saída nesta versão.

Consultas e gravações conferem país, unidade e perfil contra a sessão de quatro horas, e validam o ID da viagem e a revisão do registro operacional. Se outra pessoa já atualizou a viagem, a tentativa desatualizada é rejeitada: feche a janela, atualize a lista e confira o novo estado.

## 7. Foto do lacre e assinaturas

Na chegada há captura/seleção opcional da foto do lacre, com prévia. O navegador reprocessa a imagem em JPEG e a reduz para até aproximadamente 30 KB para guardar em Fotos_v3. Não é um arquivo original de alta resolução: confira se o número continua legível antes de salvar. O limite de entrada é 20 MB; imagens incompatíveis ou que não podem ser reduzidas são recusadas. Não há upload para o Drive nem mudança de escopo.

Na interface, Ver foto do lacre faz uma consulta autenticada e limitada à unidade da viagem. Nas três abas brasileiras a coluna Foto Lacre recebe um link para o aplicativo, se há URL de implantação disponível. A abertura desse link também exige conta e unidade autorizadas. Um registro da versão anterior sem imagem continua sem imagem.

Na Colômbia, a entrada usa os itens de contêiner, pneus, reserva, portas/ancoragens/soldas e extintor; não mostra controle de calço. Há espaços separados para assinatura do motorista e do guarda com toque/caneta. As assinaturas são PNGs pequenos, preservados nos eventos técnicos, sem envio ao navegador nas listas gerais. Não há fotografia conjunta motorista/caminhão na saída colombiana nesta entrega; isso permanece na lista de requisitos a integrar. As novas abas compactas foram criadas só para o Brasil.

## 8. Teste recomendado

1. Faça uma chegada de teste em BR-JAGUARE, sem NF e sem lacre se não houver.
2. Confira o ID e status na aba Chegadas_BR.
3. Toque em Entrada e selecione o veículo. TAG não deve aparecer em Jaguaré.
4. Preencha checklist e calço; confirme a entrada. Confira que a viagem saiu da fila de entrada e apareceu na tela Saída.
5. Confira o tempo de retenção e os dados do guarda em Entradas_BR.
6. Na Saída, informe destino, checklist e lacre/NF se houver. Se o calço foi emprestado, confirme a devolução.
7. Confirme a saída; o status deve ficar Concluído nas três abas. A lista de concluídos fica abaixo dos caminhões dentro da planta.
8. Teste uma divergência em outra viagem: retenha, autorize com conta gerencial e só então confirme a entrada física.
9. No tablet, teste rolagem da janela de checklist, botões e foto; na Colômbia, teste também as duas assinaturas.

## 9. Preservação e pendências

Os dados do controle, catálogos e Chegadas_v2 não são apagados. A migração não importa automaticamente Registros, Motoristas, Checklists ou filas do sistema original anterior à versão 0.2. Não use a versão nova em paralelo com a antiga como se compartilhassem fila e bloqueios. A consulta de documentação/bloqueios antigos de Motoristas continua sendo uma integração pendente.

Esta versão já registra o ciclo chegada/entrada/saída e a autorização de entrada. Ainda precisam ser concluídos os requisitos específicos restantes por país/unidade, os checklists específicos legados, cadastros prévios de motoristas e a homologação operacional.

## 10. Validação

Relatórios de acesso, chegada e operação estão no pacote, com testes executáveis em testes/. Usam serviços Google simulados; não gravam nas suas planilhas. Incluem ciclo completo, tempos, duplicidades, autorização por conta, isolamento de unidades, migração e reparo de visualizações. Sintaxe dos quatro arquivos e estrutura estática das três telas foram verificadas. O teste visual interativo no navegador/tablet e as gravações reais precisam ser feitos na sua implantação.

Testes adicionais de sessão: testes/sessao.cjs e VALIDACAO-SESSAO.txt. Documentação do armazenamento por conta: https://developers.google.com/apps-script/guides/properties.

Testes adicionais de gravação incremental: testes/gravacao.cjs e VALIDACAO-GRAVACAO.txt.
