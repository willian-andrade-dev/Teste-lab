# Colgate v0.4 — Chegada, Entrada e Saída

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

As três abas são visualizações geradas pelo sistema: não altere nelas status, horários ou checklists manualmente, pois os valores serão regenerados na próxima operação. Os dados técnicos ficam em Chegadas_v2, Eventos_v3 e Fotos_v3, ocultados no Brasil. Ocultar uma aba organiza a tela; não cria uma nova camada de permissão para quem tem acesso direto à planilha. As demais abas antigas não são removidas.

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
