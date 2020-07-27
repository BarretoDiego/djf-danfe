const handlebars = require('handlebars')
const NFe = require('djf-nfe')

/**
 * Retorna <valor> especificado com máscara do CPF.
 *
 * @param      {string}  valor
 * @return     {string}
 */
function mascaraCPF (valor) {
  var retorno
  var grupo01 = valor.substring(0, 3)
  retorno = grupo01
  var grupo02 = valor.substring(3, 6)
  if (grupo02 !== '') {
    retorno += '.' + grupo02
  }
  var grupo03 = valor.substring(6, 9)
  if (grupo03 !== '') {
    retorno += '.' + grupo03
  }
  var grupo04 = valor.substring(9)
  if (grupo04 !== '') {
    retorno += '-' + grupo04
  }
  return retorno
}

/**
 * Retorna <valor> especificado com máscara do CNPJ.
 *
 * @param      {string}  valor
 * @return     {string}
 */
function mascaraCNPJ (valor) {
  var retorno
  var grupo01 = valor.substring(0, 2)
  retorno = grupo01
  var grupo02 = valor.substring(2, 5)
  if (grupo02 !== '') {
    retorno += '.' + grupo02
  }
  var grupo03 = valor.substring(5, 8)
  if (grupo03 !== '') {
    retorno += '.' + grupo03
  }
  var grupo04 = valor.substring(8, 12)
  if (grupo04 !== '') {
    retorno += '/' + grupo04
  }
  var grupo05 = valor.substring(12)
  if (grupo05 !== '') {
    retorno += '-' + grupo05
  }
  return retorno
}

/**
 * Retorna <numero> especificado formatado de acordo com seu tipo (cpf ou cnpj).
 *
 * @param      {string}  numero
 * @return     {string}
 */
function formataInscricaoNacional (numero) {
  if (numero) {
    if (numero.length === 11) {
      return mascaraCPF(numero)
    }
    if (numero.length === 14) {
      return mascaraCNPJ(numero)
    }
  }
  return numero
}

/**
 * Formata data de acordo com <dt> esoecificado.
 * <dt> é no formato UTC, YYYY-MM-DDThh:mm:ssTZD (https://www.w3.org/TR/NOTE-datetime)
 *
 * @param      {string}  dt
 * @return     {string}
 */
function formataData (dt) {
  dt = dt ? dt.toString() : ''
  if (!dt) { return '' }

  if (dt && dt.length === 10) {
    dt += 'T00:00:00+00:00'
  }

  var [data, hora] = dt.split('T')
  var [hora, utc] = hora.split(/[-+]/)
  var [ano, mes, dia] = data.split('-')
  var [hora, min, seg] = hora.split(':')
  var [utchora, utcmin] = utc ? utc.split(':') : ['', '']
  return dia.padStart(2, '0') + '/' + mes.toString().padStart(2, '0') + '/' + ano
}

function formataHora (dt) {
  if (dt) {
    var data = new Date(dt)
    return data.getHours().toString().padStart(2, '0') + ':' + (data.getMinutes().toString().padStart(2, '0')) + ':' + data.getSeconds().toString().padStart(2, '0')
  }
  return ''
}

/**
 * Retorna o valor formatado em moeda de acordo com  <numero>  e <decimais> especificados.
 *
 * @param      {number}   numero
 * @param      {number}  decimais
 * @return     {string}
 */
function formataMoeda (numero, decimais) {
  decimais = decimais || 4
  var symbol = ''
  var decimal = ','
  var thousand = '.'
  var negative = numero < 0 ? '-' : ''
  var i = parseInt(numero = Math.abs(+numero || 0).toFixed(decimais), 10) + ''
  var j = 0

  decimais = !isNaN(decimais = Math.abs(decimais)) ? decimais : 2
  symbol = symbol !== undefined ? symbol : '$'
  thousand = thousand || ','
  decimal = decimal || '.'
  j = (j = i.length) > 3 ? j % 3 : 0
  return symbol + negative + (j ? i.substr(0, j) + thousand : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousand) + (decimais ? decimal + Math.abs(numero - i).toFixed(decimais).slice(2) : '')
};

/**
 * Retorna objeto representando os dados da <entidade> especificada.
 *
 * @param      {Object}  entidade  djf-nfe
 * @return     {Object}
 */
function dadosEntidade (entidade) {
  if (entidade) {
    return {
      nome: entidade.nome(),
      fantasia: entidade.fantasia(),
      ie: entidade.inscricaoEstadual(),
      ie_st: entidade.inscricaoEstadualST(),
      inscricao_municipal: entidade.inscricaoMunicipal(),
      inscricao_nacional: formataInscricaoNacional(entidade.inscricaoNacional()),
      telefone: entidade.telefone()
    }
  }
  return {}
}

/**
 * Retorna objeto representando os dados do <endereco> especificado.
 *
 * @param      {Object}  endereco   djf-nfe
 * @return     {Object}
 */
function endereco (endereco) {
  if (endereco) {
    return {
      endereco: endereco.logradouro(),
      numero: endereco.numero(),
      complemento: endereco.complemento(),
      bairro: endereco.bairro(),
      municipio: endereco.municipio(),
      cep: endereco.cep(),
      uf: endereco.uf()
    }
  }
  return {}
}

/**
 * Retorna a <cahve> da NFE formata.
 * Formatação: grupos de 4 números separados por espaço.
 * @param      {string}  chave
 * @return     {string}
 */
function formataChave (chave) {
  var out = ''
  if (chave && chave.length === 44) {
    for (var i = 0; i < chave.split('').length; i++) {
      if (i % 4 === 0) {
        out += ' ' + chave.charAt(i)
      } else {
        out += chave.charAt(i)
      }
    }
    return out
  }
  return chave
}

/**
 * Retorna array de objetos com os dados dos itens de acordo com <nfe> especificado.
 *
 * @param      {<object>}  nfe     djf-nfe
 * @return     {array}
 */
function itens (nfe) {
  var itens = []
  var nrItens = nfe.nrItens()
  for (var i = 1; i <= nrItens; i++) {
    var row = nfe.item(i)
    var item = {
      codigo: row.codigo(),
      descricao: row.descricao(),
      ncm: row.ncm(),
      cst: row.origem() + '' + row.cst(),
      cfop: row.cfop(),
      unidade: row.unidadeComercial(),
      quantidade: formataMoeda(row.quantidadeComercial()),
      valor: formataMoeda(row.valorUnitario()),
      desconto: formataMoeda(row.valorDesconto()),
      total: formataMoeda(row.valorProdutos()),
      base_calculo: formataMoeda(row.baseCalculoIcms()),
      icms: formataMoeda(row.valorIcms()),
      ipi: formataMoeda(row.valorIPI()),
      porcentagem_icms: formataMoeda(row.porcetagemIcms(), 2),
      porcentagem_ipi: formataMoeda(row.porcentagemIPI(), 2)
    }
    itens.push(item)
  }

  return itens
}

/**
 * Retorna array de objetos com os dados das duplicatas de acordo com <nfe> especificado
 *
 * @param      {object}  nfe     djf-nfe
 * @return     {array}
 */
function duplicatas (nfe) {
  var dups = []
  if (nfe.cobranca() && nfe.cobranca().nrDuplicatas() > 0) {
    var quant = nfe.cobranca().nrDuplicatas()
    for (var i = 1; i <= quant; i++) {
      var dup = nfe.cobranca().duplicata(i)
      dups.push({
        numero: dup.numeroDuplicata(),
        vencimento: formataData(dup.vencimentoDuplicata()),
        valor: formataMoeda(dup.valorDuplicata(), 2)
      })
    }
  }

  return dups
}

/**
 * Retorna os dados da observação de acordo com <nfe> especificado.
 *
 * @param      {object}  nfe     djf-nfe
 * @return     {string}
 */
function observacoes (nfe) {
  var quant = nfe.nrObservacoes()
  var result = ''
  for (var i = 1; i <= quant; i++) {
    result += '\n' + nfe.observacao(i).texto()
  }

  return result
}

/**
 * Retorna o template html do Danfe preenchido com os dados em <data> especificado.
 * Retorna vazio se não gerado.
 * @param      {object}  data
 * @return     {string}
 */
function renderHtml (data) {
  if (!data) {
    return ''
  }
  return handlebars.compile(HANDLEBARS_TEMPLATE)(data)
}

/**
 * Retorna objeto com os dados do template de acordo com <nfe> especificado.
 *
 * @param      {object}  nfe     djf-nfe
 * @return     {object}
 */
function getTemplateData (nfe) {
  if (!nfe) {
    return null
  }

  var data = {
    operacao: nfe.tipoOperacao(),
    natureza: nfe.naturezaOperacao(),
    numero: nfe.nrNota(),
    serie: nfe.serie(),
    chave: formataChave(nfe.chave()),
    protocolo: nfe.protocolo(),
    data_protocolo: formataData(nfe.dataHoraRecebimento()) + ' ' + formataHora(nfe.dataHoraRecebimento()),
    destinatario: Object.assign(dadosEntidade(nfe.destinatario()), endereco(nfe.destinatario())),
    emitente: Object.assign(dadosEntidade(nfe.emitente()), endereco(nfe.emitente())),
    data_emissao: formataData(nfe.dataEmissao()),
    data_saida: formataData(nfe.dataEntradaSaida()),
    base_calculo_icms: formataMoeda(nfe.total().baseCalculoIcms(), 2),
    imposto_icms: formataMoeda(nfe.total().valorIcms(), 2),
    base_calculo_icms_st: formataMoeda(nfe.total().baseCalculoIcmsST(), 2),
    imposto_icms_st: formataMoeda(nfe.total().valorIcmsST(), 2),
    imposto_tributos: formataMoeda(nfe.total().valorTotalTributos(), 2),
    total_produtos: formataMoeda(nfe.total().valorProdutos(), 2),
    total_frete: formataMoeda(nfe.total().valorFrete(), 2),
    total_seguro: formataMoeda(nfe.total().valorSeguro(), 2),
    total_desconto: formataMoeda(nfe.total().valorDesconto(), 2),
    total_despesas: formataMoeda(nfe.total().valorOutrasDespesas(), 2),
    total_ipi: formataMoeda(nfe.total().valorIPI(), 2),
    total_nota: formataMoeda(nfe.total().valorNota(), 2),
    transportador: Object.assign(dadosEntidade(nfe.transportador()), endereco(nfe.transportador())),
    informacoes_fisco: nfe.informacoesFisco(),
    informacoes_complementares: nfe.informacoesComplementares(),
    observacao: observacoes(nfe),
    modalidade_frete: nfe.modalidadeFrete(),
    modalidade_frete_texto: nfe.modalidadeFreteTexto(),
    itens: itens(nfe),
    duplicatas: duplicatas(nfe)
  }

  if (nfe.transporte().volume()) {
    let volume = nfe.transporte().volume()
    data.volume_quantidade = formataMoeda(volume.quantidadeVolumes())
    data.volume_especie = volume.especie()
    data.volume_marca = volume.marca()
    data.volume_numeracao = volume.numeracao()
    data.volume_pesoBruto = formataMoeda(volume.pesoBruto())
    data.volume_pesoLiquido = formataMoeda(volume.pesoLiquido())
  }

  if (nfe.transporte().veiculo()) {
    data.veiculo_placa = nfe.transporte().veiculo().placa()
    data.veiculo_placa_uf = nfe.transporte().veiculo().uf()
    data.veiculo_antt = nfe.transporte().veiculo().antt()
  }

  if (nfe.servico()) {
    data.total_servico = formataMoeda(nfe.servico().valorTotalServicoNaoIncidente())
    data.total_issqn = formataMoeda(nfe.servico().valorTotalISS())
    data.base_calculo_issqn = formataMoeda(nfe.servico().baseCalculo())
  }

  return data
}

/**
 * Retorna modelo Danfe de acordo com objeto <nfe> especificado.
 *
 * @param      {<type>}  nfe     djf-nfe
 * @return     {Object}  { description_of_the_return_value }
 */
function model (nfe) {
  return {
    toHtml: () => renderHtml(getTemplateData(nfe))
  }
}

/**
 * Retorna modelo Danfe de acordo com objeto  <nfe> especificado.
 *
 * @param      {object}  nfe    djf-nfe
 * @return     {<object>}
 */
module.exports.fromNFe = function (nfe) {
  if (!nfe || typeof nfe.nrNota !== 'function') {
    return model(null)
  }
  return model(nfe)
}

/**
 * Retorna modelo Danfe de acordo com <xml> especificado.
 *
 * @param      {string}  xml
 * @return     {<object>}
 */
module.exports.fromXML = function (xml) {
  if (!xml || typeof xml !== 'string') {
    return model(null)
  }
  return model(NFe(xml))
}

const HANDLEBARS_TEMPLATE = `<!DOCTYPE html>
<html lang="pt-br">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DANFE</title>
</head>
<style>
.container {
  margin: 0 auto;
  position: relative;
  max-width: 960px;
}

.columns {
  display: flex; //margin-left: -0.75rem;
  //margin-right: -0.75rem;
  margin-top: -0.75rem;
}

.column {
  display: block;
  -ms-flex-preferred-size: 0;
  flex-basis: 0;
  -webkit-box-flex: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
  -ms-flex-negative: 1;
  flex-shrink: 1;
}

.columns:not(:last-child) {
  margin-bottom: calc(1.5rem - 0.75rem);
}

.is-pulled-right {
  float: right !important;
}

.is-pulled-left {
  float: left !important;
}

.column.is-1 {
  -webkit-box-flex: 0;
  -ms-flex: none;
  flex: none;
  width: 8.33333%;
}

table {
  border-collapse: collapse;
  border-spacing: 0;
}

td,
th {
  padding: 0;
  text-align: left;
}

.content.is-small {
  font-size: 0.75rem;
}

.content.is-medium {
  font-size: 1.25rem;
}

.content.is-large {
  font-size: 1.5rem;
}
</style>
<style>

.area {
  width: 778px !important;
}

.quadro_codigo_barra {
  padding: 0px !important;
}

.codigo_barra {
  height: 56px;
}

.chave {
  height: 33px;
  font-size: 82%;
  font-weight: bold;
  text-align: center;
}

.protocolo,
.consulta,
.chave {
  padding: 2px;
}

.protocolo {
  flex: 0 0 296px;
}

.codigo_barra,
.chave {
  border-bottom: 1px solid black;
}

.consulta {
  font-size: 10px;
  text-align: center;
}

.quadro_danfe {
  flex: 0 0 96px;
  line-height: 1.1;
}

.quadro_identificacao {
  flex: 0 0 378px;
  font-weight: bold;
  font-size: 13px
}

.quadro_cabecalho {
  height: 149px !important;
}

div.quadro div.columns:nth-child(2) {
  border-top: 1px solid black;
}

div.quadro div.columns:first-child div.column {
  padding: 0px;
}

.linha div.column:first-child {
  border-left: 1px solid black;
}

.quadro .linha div.column {
  border-bottom: 1px solid black;
  border-right: 1px solid black;
}

.conteudo_campo {
  padding: 0 0 0 2px;
}

.quadro.imposto div.linha div.column div:nth-child(2),
.direita {
  text-align: right;
}

.quadro div.columns:first-child div.column {
  margin-top: 5px;
}

.grupo .quadro .linha {
  height: 33px;
}

.grupo {
  margin-top: 5px;
}

.tcampo {
  font-weight: bold;
  font-size: 8px;
  padding-bottom: 2px;
  padding-left: 2px;
  text-align: left;
}

.texto_recibo {
  font-weight: bold;
  font-size: 9px;
  text-align: left;
}

.center {
  text-align: center;
}

.bold {
  font-weight: bold;
}

.operacao {
  font-size: 14px;
  border: 1px solid black;
  padding: 2px;
}

.numero,
.canhoto_nr {
  font-size: 11px;
  font-weight: bold;
}

.danfe {
  font-size: 13px;
  font-weight: bold;
}

.itens {
  font-size: 10px;
}


.data {
  flex: 0 0 100px;
  text-align: center;
}

.uf {
  flex: 0 0 30px;
}

.placa {
  flex: 0 0 70px;
}

.nome {
  flex: 0 0 300px;
}

.fisco {
  flex: 0 0 284px;
}

.complemento {
  height: 114px !important;
}

.complemento {
  font-size: 10px;
}

.canhoto_nr {
  flex: 0 0 171px;
}

.area_canhoto_nr {
  height: 65px;
  border-left: 0px !important;
  line-height: 1.5;
  padding-left: 3px !important;
}

.canhoto_assinatura {
  flex: 0 0 458px;
}

.duplicatas .duplicata {
  font-size: 0.9rem;
  text-align: center;
  padding-right: 3px;
  padding-left: 3px;

  border-right: 1px solid gray;
}

.duplicatas .duplicata div {
  margin-top: 2px;
}

.duplicatas .tcampo {
  font-size: 0.8rem;
  margin-top: 1px;
}

table td,
table th {
  border: 1px solid black !important;
  border-top: 0px solid black !important;
  padding: 2px !important;
  color: black !important;
}

table {
  margin-bottom: 1px !important;
  width: 100%;
}
</style>

<body>
  <div class="container area">
    <!-- Canhoto  -->
    <div class="columns grupo">
      <div class="column ">
        <div class="quadro">
          <div class="columns">
            <div class="column ">
            </div>
          </div>
          <div class="columns linha">
            <div class="column campo">
              <div class="texto_recibo conteudo_campo">
                RECEBEMOS DE '{{emitente.nome}}' OS PRODUTOS E/OU SERVIÇOS CONSTANTES DA NOTA FISCAL ELETRÔNICA INDICADA ABAIXO. EMISSÃO: {{data_emissao}} - VALOR TOTAL: {{total_nota}} - DESTINATÁRIO: {{destinatario.nome}} - ENDEREÇO: {{destinatario.endereco}}, {{destinatario.numero}}, {{destinatario.bairro}} - {{destinatario.municipio}}/{{destinatario.uf}}
              </div>
            </div>
          </div>
          <div class="columns linha">
            <div class="column">
              <div class="tcampo">DATA DE RECEBIMENTO</div>
            </div>
            <div class="column canhoto_assinatura">
              <div class="tcampo">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</div>
            </div>
          </div>
        </div>
      </div>
      <div class="column canhoto_nr">
        <div class="quadro">
          <div class="columns">
            <div class="column ">
            </div>
          </div>
          <div class="columns  linha">
            <div class="column  area_canhoto_nr">
              <div class="center">NF-e</div>
              <div class="">Nº {{numero}}</div>
              <div class="">SÉRIE: {{serie}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Cabeçalho  -->
    <div class="columns grupo">
      <div class="column ">
        <div class="quadro">
          <div class="columns">
            <div class="column ">
            </div>
          </div>
          <div class="columns linha quadro_cabecalho">
            <div class="column  quadro_identificacao">
              <div class="conteudo_campo">{{emitente.nome}}</div>
              <div class="conteudo_campo">{{emitente.fantasia}}</div>
              <div class="conteudo_campo">{{emitente.endereco}}, {{emitente.numero}}</div>
              <div class="conteudo_campo">{{emitente.complemento}}</div>
              <div class="conteudo_campo">{{emitente.bairro}} - {{emitente.municipio}} / {{emitente.uf}}</div>
              <div class="conteudo_campo">CEP:{{emitente.cep}} - Fone: {{emitente.telefone}}</div>
            </div>
            <div class="column quadro_danfe">
              <div class="center danfe">DANFE</div>
              <div class="center">DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA</div>
              <br>
              <span class="numero center">
                <div class="center is-pulled-right operacao">{{operacao}}</div>
                <div>0- ENTRADA</div>
                <div>1- SAÍDA</div>
                <br>
                <div>Nº {{numero}}</div>
                <div>SÉRIE {{serie}}</div>
                <div>FOLHA ?/?</div>
              </span>
            </div>
            <div class="column quadro_codigo_barra ">
              <div class="codigo_barra">barra</div>
              <div class="chave">
                <div class="tcampo">CHAVE DE ACESSO</div>
                {{chave}}
              </div>
              <div class="consulta">
                <br> Consulta de autenticidade no portal nacional da NF-e
                <span style="text-decoration: underline">www.nfe.fazenda.gov.br/portal</span> ou no site da Sefaz Autorizadora
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="columns grupo">
      <div class="column ">
        <div class="quadro">
          <div class="columns">
            <div class="column ">
            </div>
          </div>
          <div class="columns linha">
            <div class="column campo">
              <div class="tcampo">NATUREZA DA OPERAÇÃO</div>
              <span class="conteudo_campo">{{natureza}}</span>
            </div>
            <div class="column protocolo center">
              <div class="tcampo">PROTOCOLO DE AUTORIZACAO DE USO </div>
              <span class="conteudo_campo">{{protocolo}} - {{data_protocolo}}</span>
            </div>
          </div>
          <div class="columns linha">
            <div class="column">
              <div class="tcampo">INSCRIÇÃO ESTADUAL</div>
              <span class="conteudo_campo">{{emitente.ie}}</span>
            </div>
            <div class="column">
              <div class="tcampo">INSCRIÇÃO ESTADUAL DO SUBST. TRIB.</div>
              <span class="conteudo_campo">{{emitente.ie_st}}</span>
            </div>
            <div class="column">
              <div class="tcampo">C.N.P.J.</div>
              <span class="conteudo_campo">{{emitente.inscricao_nacional}}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- DEstinatário / remetente -->
    <div class="columns grupo">
      <div class="column ">
        <div class="quadro">
          <div class="columns">
            <div class="column bold">
              DESTINATÁRIO/REMETENTE
            </div>
          </div>
          <div class="columns linha">
            <div class="column ">
              <div class="tcampo">NOME/RAZÃO SOCIAL</div>
              <span class="conteudo_campo">{{destinatario.nome}}</span>
            </div>
            <div class="column ">
              <div class="tcampo">C.N.P.J./C.P.F.</div>
              <span class="conteudo_campo">{{destinatario.inscricao_nacional}}</span>
            </div>
            <div class="column data">
              <div class="tcampo">DATA DA EMISSÃO</div>
              <span class="conteudo_campo">{{data_emissao}}</span>
            </div>
          </div>
          <div class="columns linha">
            <div class="column">
              <div class="tcampo">ENDEREÇO</div>
              <span class="conteudo_campo">{{destinatario.endereco}}, {{destinatario.numero}}</span>
            </div>
            <div class="column ">
              <div class="tcampo ">BAIRRO/DISTRITO</div>
              <span class="conteudo_campo">{{destinatario.bairro}}</span>
            </div>
            <div class="column ">
              <div class="tcampo">CEP</div>
              <span class="conteudo_campo">{{destinatario.cep}}</span>
            </div>
            <div class="column data">
              <div class="tcampo">DATA SAÍDA/ENTRADA</div>
              <span class="conteudo_campo">{{data_saida}}</span>
            </div>
          </div>
          <div class="columns linha">
            <div class="column">
              <div class="tcampo">MUNICÍPIO</div>
              <span class="conteudo_campo">{{destinatario.municipio}}</span>
            </div>
            <div class="column">
              <div class="tcampo">FONE/FAX</div>
              <span class="conteudo_campo">{{destinatario.telefone}}</span>
            </div>
            <div class="column uf">
              <div class="tcampo">UF</div>
              <span class="conteudo_campo">{{destinatario.uf}}</span>
            </div>
            <div class="column">
              <div class="tcampo">INSCRIÇÃO ESTADUAL</div>
              <span class="conteudo_campo">{{destinatario.ie}}</span>
            </div>
            <div class="column data">
              <div class="tcampo">HORA DA SAÍDA</div>
              <span class="conteudo_campo">{{hora_saida}}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Faturas  -->
    {{#if duplicatas}}
    <div class="columns grupo">
      <div class="column ">
        <div class="quadro duplicatas">
          <div class="columns">
            <div class="column bold">
              FATURA/DUPLICATAS
            </div>
          </div>
          <div class="columns linha">
            <div class="column is-1">
              <div class="tcampo">NÚMERO</div>
              <div class="tcampo">VENCIMENTO</div>
              <div class="tcampo">VALOR</div>
            </div>
            <div class="column">
              {{#each duplicatas}}
              <div class=" duplicata is-pulled-left">
                <div>{{this.numero}}</div>
                <div>{{this.vencimento}}</div>
                <div>{{this.valor}}</div>
              </div>
              {{/each}}
            </div>
          </div>
        </div>
      </div>
    </div>
    {{/if}}
    <!-- Impostos  -->
    <div class="columns grupo">
      <div class="column ">
        <div class="quadro imposto">
          <div class="columns">
            <div class="column bold">
              CÁLCULO DO IMPOSTO
            </div>
          </div>
          <div class="columns linha">
            <div class="column">
              <div class="tcampo">BASE DE CÁLCULO DO ICMS</div>
              <div>{{base_calculo_icms}}</div>
            </div>
            <div class="column">
              <div class="tcampo">VALOR DO ICMS</div>
              <div>{{imposto_icms}}</div>
            </div>
            <div class="column">
              <div class="tcampo">BASE DE CÁLCULO DO ICMS ST</div>
              <div>{{base_calculo_icms_st}}</div>
            </div>
            <div class="column">
              <div class="tcampo">VALOR DO ICMS ST</div>
              <div>{{imposto_icms_st}}</div>
            </div>
            <div class="column">
              <div class="tcampo">VALOR TOTAL APROX. TRIB.</div>
              <div>{{imposto_tributos}}</div>
            </div>
            <div class="column">
              <div class="tcampo">VALOR TOTAL DOS PRODUTOS</div>
              <div>{{total_produtos}}</div>
            </div>
          </div>
          <div class="columns linha">
            <div class="column">
              <div class="tcampo">VALOR DO FRETE</div>
              <div>{{total_frete}}</div>
            </div>
            <div class="column">
              <div class="tcampo">VALOR DO SEGURO</div>
              <div>{{total_seguro}}</div>
            </div>
            <div class="column">
              <div class="tcampo">DESCONTO</div>
              <div>{{total_desconto}}</div>
            </div>
            <div class="column">
              <div class="tcampo">OUTRAS DESPESAS ACESSÓRIAS</div>
              <div>{{total_despesas}}</div>
            </div>
            <div class="column">
              <div class="tcampo">VALOR DO IPI</div>
              <div>{{total_ipi}}</div>
            </div>
            <div class="column">
              <div class="tcampo">VALOR TOTAL DA NOTA</div>
              <div>{{total_nota}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- transportadora -->
    <div class="columns grupo">
      <div class="column ">
        <div class="quadro">
          <div class="columns">
            <div class="column bold">
              TRANSPORTADOR/VOLUMES TRANSPORTADOS
            </div>
          </div>
          <div class="columns linha">
            <div class="column nome">
              <div class="tcampo">RAZÃO SOCIAL</div>
              <span class="conteudo_campo">{{transportador.nome}}</span>
            </div>
            <div class="column">
              <div class="tcampo">FRETE POR CONTA DO</div>
              <span class="conteudo_campo">{{modalidade_frete}} - {{modalidade_frete_texto}}</span>
            </div>
            <div class="column">
              <div class="tcampo">CÓDIGO ANTT</div>
              <span class="conteudo_campo">{{veiculo_antt}}</span>
            </div>
            <div class="column placa">
              <div class="tcampo">PLACA DO VEÍCULO</div>
              <span class="conteudo_campo">{{veiculo_placa}}</span>
            </div>
            <div class="column uf">
              <div class="tcampo">UF</div>
              <span class="conteudo_campo">{{veiculo_placa_uf}}</span>
            </div>
            <div class="column">
              <div class="tcampo">C.N.P.J./C.P.F.</div>
              <span class="conteudo_campo">{{transportador.inscricao_nacional}}</span>
            </div>
          </div>
          <div class="columns linha">
            <div class="column">
              <div class="tcampo">ENDEREÇO</div>
              <span class="conteudo_campo">{{transportador.endereco}}, {{transportador.numero}}</span>
            </div>
            <div class="column">
              <div class="tcampo">MUNICÍPIO</div>
              <span class="conteudo_campo">{{transportador.municipio}}</span>
            </div>
            <div class="column uf">
              <div class="tcampo">UF</div>
              <span class="conteudo_campo">{{transportador.uf}}</span>
            </div>
            <div class="column">
              <div class="tcampo">INSCRIÇÃO ESTADUAL</div>
              <span class="conteudo_campo">{{transportador.ie}}</span>
            </div>
          </div>
          <div class="columns linha">
            <div class="column direita">
              <div class="tcampo">QUANTIDADE</div>
              <span class="conteudo_campo">{{volume_quantidade}}</span>
            </div>
            <div class="column">
              <div class="tcampo">ESPÉCIE</div>
              <span class="conteudo_campo">{{volume_especie}}</span>
            </div>
            <div class="column">
              <div class="tcampo">MARCA</div>
              <span class="conteudo_campo">{{volume_marca}}</span>
            </div>
            <div class="column">
              <div class="tcampo">NUMERAÇÃO</div>
              <span class="conteudo_campo">{{volume_numeracao}}</span>
            </div>
            <div class="column direita">
              <div class="tcampo">PESO BRUTO</div>
              <span class="conteudo_campo">{{volume_pesoBruto}}</span>
            </div>
            <div class="column direita">
              <div class="tcampo">PESO LÍQUIDO</div>
              <span class="conteudo_campo">{{volume_pesoLiquido}}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Itens  -->
    <div class="columns grupo">
      <div class="column ">
        <div class="quadro">
          <div class="columns">
            <div class="column bold">
              DADOS DOS PRODUTOS/SERVIÇOS
            </div>
          </div>
          <div class="columns">
            <table class="table is-bordered itens">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>DESCRIÇÃO</th>
                  <th>NCM/SH</th>
                  <th>CST</th>
                  <th>CFOP</th>
                  <th>UN.</th>
                  <th>QUANT.</th>
                  <th>V.UNIT.</th>
                  <th>V.DESC.</th>
                  <th>V.TOTAL</th>
                  <th>BC.ICMS</th>
                  <th>V.ICMS</th>
                  <th>V.IPI</th>
                  <th>%ICMS</th>
                  <th>%IPI</th>
                </tr>
              </thead>
              <tbody>
                {{#each itens}}
                <tr>
                  <td>{{this.codigo}}</td>
                  <td>{{this.descricao}}</td>
                  <td>{{this.ncm}}</td>
                  <td>{{this.cst}}</td>
                  <td>{{this.cfop}}</td>
                  <td>{{this.unidade}}</td>
                  <td class="direita">{{this.quantidade}}</td>
                  <td class="direita">{{this.valor}}</td>
                  <td class="direita">{{this.desconto}}</td>
                  <td class="direita">{{this.total}}</td>
                  <td class="direita">{{this.base_calculo}}</td>
                  <td class="direita">{{this.icms}}</td>
                  <td class="direita">{{this.ipi}}</td>
                  <td class="direita">{{this.porcentagem_icms}}</td>
                  <td class="direita">{{this.porcentagem_ipi}}</td>
                </tr>
                {{/each}}

              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <!-- Serviço  -->
    {{#if total_servico}}
    <div class="columns grupo">
      <div class="column ">
        <div class="quadro">
          <div class="columns">
            <div class="column bold">
              CÁLCULO DO ISSQN
            </div>
          </div>
          <div class="columns linha">
            <div class="column">
              <div class="tcampo">INSCRIÇÃO MUNICIPAL</div>
              <span class="conteudo_campo">{{inscricao_municipal}}</span>
            </div>
            <div class="column">
              <div class="tcampo">VALOR TOTAL DOS SERVIÇOS</div>
              <div class="conteudo_campo direita">{{total_servico}}</div>
            </div>
            <div class="column">
              <div class="tcampo">BASE DE CÁLCULO DO ISSQN</div>
              <div class="conteudo_campo direita">{{base_calculo_issqn}}</div>
            </div>
            <div class="column">
              <div class="tcampo">VALOR DO ISSQN</div>
              <div class="conteudo_campo direita">{{total_issqn}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {{/if}}
    <!-- Dados adicionais  -->
    <div class="columns grupo">
      <div class="column ">
        <div class="quadro">
          <div class="columns">
            <div class="column bold">
              DADOS ADICIONAIS
            </div>
          </div>
          <div class="columns linha complemento">
            <div class="column">
              <div class="tcampo">INFORMAÇÕES COMPLEMENTARES</div>
              <span class="conteudo_campo">{{informacoes_fisco}}</span>
              <span class="conteudo_campo">{{informacoes_complementares}}</span>
              <span class="conteudo_campo">{{observacao}}</span>
            </div>
            <div class="column fisco">
              <div class="tcampo">RESERVADO AO FISCO</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>

</html>`
