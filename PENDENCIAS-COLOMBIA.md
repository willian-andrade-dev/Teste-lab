# Atualização v0.23 — carretas e tablet nos dois países

| Pedido | Situação | Evidência / limite |
|---|---|---|
| Placas antigas e Mercosul no Brasil | Concluído | Validação cliente/servidor normaliza ambos. Colômbia mantém seu formato próprio. |
| Sem carreta não pergunta carregado/descarregado | Concluído | Usa NA explícito, rejeitado se houver carreta de saída; destino e foto conjunta CO preservados. |
| Cronômetros de espera e permanência | Concluído | Instantes persistidos + relógio do servidor; atualização local sem RPC por cronômetro. Não mede etapas não registradas de carga/descarga. |
| + único ao lado de nota/lacre | Concluído | Também em remitos CO, rótulos acessíveis em três idiomas e remoção individual. Testes DOM simulados. |
| HUD com placa/tempo e ↻ | Concluído | Derivado do estoque físico, unidade atual; confirmação de entrada/saída atualiza HUD. |
| Gestor adiciona carreta manualmente | Concluído | GERENTE/ADMINISTRADOR autorizado, placa e motivo, autor real e hora no evento; idempotência e lock; não cria chegada. Tempo começa na inclusão. |
| Segunda carreta de saída sob demanda | Concluído | Apenas após primeira + toque em +; limpar primeira limpa segunda; duplicidade sinalizada no campo. |
| Visual tablet retrato/paisagem | Implementado; validação externa | CSS responsivo e DOM simulado; tentativa Playwright bloqueada por ausência do binário Chromium, sem renderização real. |

**Atualizar:** Chegada.gs, Operacao.gs, Patio.gs e Index.html; salvar e publicar New version. Nenhuma migração ou execução administrativa nova em BR/CO já preparado. Inclusão manual pelo aplicativo com GERENTE/ADMINISTRADOR. 279 testes locais simulados aprovados. Consulte o roteiro da v0.23 no README.

O formulário original completo de saída, a configuração/planilha real e a homologação física continuam dependências externas, conforme a matriz anterior abaixo.

---

# Organização da planilha — v0.22

Control_CO passa a ser o relatório operacional consolidado, com status calculado dos eventos e links das fotos por finalidade. Fontes técnicas são preservadas e ocultadas por prepararOperacao. A conferência da planilha real continua dependendo de executar a preparação na conta autorizada e validar as viagens existentes.

As pendências externas do checklist original de saída e da configuração real não foram consideradas encerradas por essa alteração.

---

# Colômbia — situação da versão 0.19

Implementação baseada na versão 0.18 do repositório. Esta matriz distingue implementação de validação externa; testes locais não comprovam dados da planilha real.

| Requisito | Situação | Evidência / limite |
|---|---|---|
| Isolamento país/unidade e sessão de 4h | Já existente e validado | Testes de acesso, sessão, cadastro e foto. Nenhuma nova consulta central por operação. |
| Oito finalidades e campos de chegada | Concluído | Reciclagem aceita empresa/pessoa livre; listas de faturas, remitos e lacres com botões; importação limita a uma fatura. |
| Lacre de contêiner vazio sem fatura | Concluído | Exportação preserva lacre e exige foto na entrada. |
| Motoristas: cadastro, consulta e atualização | Concluído | Pré-cadastro no botão Cadastros, telefone, histórico append e fila persistente. |
| Veículos: cadastro e histórico independente | Concluído | Veiculos_CO_v1, consulta por placa, histórico de viagens no pré-cadastro, sem vínculo permanente com motorista. |
| Observações anteriores automáticas | Concluído | Consulta ao sair dos campos documento/placa; últimos 20 registros com notas nas unidades autorizadas. Não representa bloqueio automático. |
| Checklist de entrada ampliado | Concluído | CO-2: 16 itens confirmados, sem calço, incluindo condições anteriores e EPI; N/A somente em itens configurados. |
| Causas selecionáveis | Concluído | Pneus/contêiner, múltipla escolha, Outro com descrição; servidor valida códigos. |
| Retenção, aprovação e entrada | Já existente e validado / complementado | Preserva versão, causas e vistoria aprovada; mudança real exige nova avaliação; segurança não decide. |
| Checklist completo de saída | Dependência externa | O projeto e os requisitos fornecidos não contêm as perguntas originais completas. Mantidos veículo, carga e lacres, versão CO-SAIDA-CONFIRMADO-1. Não foi inventado formulário. System Liberation não está presente. Precisamos do formulário colombiano original de saída, com itens e regras N/A. |
| Foto motorista + caminhão | Concluído | Obrigatória em novas saídas CO, arquivo separado da foto de lacre; prévia, remoção, câmera/arquivo. |
| Fotos do lacre e Drive | Concluído | Obrigatoriedade por lacre CO, links privados, nomes por finalidade, reenvio idempotente; falha em foto CO não conclui nova movimentação. |
| Estoque e troca de carreta | Já existente e validado | Teste CO de troca e tentativa de retirar carreta indisponível. |
| Bogotá e três idiomas | Concluído | Fuso fixado no servidor; preferência de idioma salva por conta; espanhol padrão CO sem preferência; causas traduzidas. |
| Tablet / acessibilidade | Implementado; validação externa | Mantido layout responsivo e botões de toque. Testes DOM simulados; Playwright instalado, mas sem executável de navegador. Não houve revisão visual real. |
| CO30, CO20, CP39 e endereços | Dependência externa | Executar verificarConfiguracaoColombia como administrador CO e comparar com tabela abaixo. Não houve acesso à configuração real nesta entrega. |
| Produtos e transportadoras reais | Dependência externa | Diagnóstico retorna quantidade de ativos; validar códigos/nomes com a operação. |

## Conferência das unidades reais

| Código | Endereço esperado informado pelo solicitante |
|---|---|
| CO30 | Lote La Magdalena, vía Cencar Aeropuerto, Calzada Izquierda KM 10 +578, Palmira |
| CO20 | Carrera 1 #40-108, Manzanares, Cali |
| CP39 | Calle 39 #1-35, Manzanares, Cali |

O diagnóstico é somente leitura. Não cria unidades nem altera permissões de usuários.

## Migração e compatibilidade

1. Instalar todos os arquivos indicados no README.
2. Como ADMINISTRADOR vinculado ao país CO, executar prepararOperacao.
3. Executar migrarCadastrosColombia; repetir retorna zero importados. Preserva edições manuais.
4. Executar verificarConfiguracaoColombia e conferir os resultados com a tabela acima.
5. Publicar New version e validar na Colômbia.

Não altera colunas das fontes antigas. Novas abas: Cadastros_CO_v1 (histórico dos comandos de cadastro), Veiculos_CO_v1 e Fotos_Conjunto_CO_v1. Motoristas_v3 continua sendo o cadastro atual dos motoristas. A migração não inventa tipos de veículo: antigos entram como NA até conferência.

Checklists novos usam CO-2. Reenvios de eventos já gravados conservam o contrato antigo, assim como entradas com uma vistoria antiga já aprovada. Solicitações antigas de uma vistoria ainda não gravada devem ser revistas: se necessário, cancelar a solicitação pelo painel, aguardar a confirmação do cancelamento e preencher o checklist novo. Não limpar o navegador nem apagar a fila.
