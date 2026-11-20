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
