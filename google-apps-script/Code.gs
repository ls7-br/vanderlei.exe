/**
 * VANDERLEI.EXE: receptor de inscrições para Google Sheets
 * ---------------------------------------------------------
 * 1. Crie uma planilha no Google Sheets.
 * 2. Extensões > Apps Script > apague o conteúdo e cole este arquivo.
 * 3. Implantar > Nova implantação > Tipo: "App da Web"
 *      - Executar como: Eu
 *      - Quem pode acessar: Qualquer pessoa
 * 4. Autorize, copie a URL que termina em /exec e cole em js/config.js (GOOGLE_SCRIPT_URL).
 */

var SHEET_NAME = 'Inscrições';

var HEADERS = [
  'Data/Hora', 'Nome', 'Idade', 'Instagram', 'Cidade',
  'Q1 Primeiro encontro', 'Q2 Áudio de 7 min', 'Q3 Conta do restaurante',
  'Q4 Sumiço de 3 dias', 'Q5 Talento oculto', 'Q6 Mãe dele', 'Q7 Pet', 'Q8 Red flag tolerada',
  'Mensagem para o Vanderlei', 'Compatibilidade (%)', 'Veredito', 'Navegador'
];

var FIELDS = [
  'timestamp', 'nome', 'idade', 'instagram', 'cidade',
  'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8',
  'mensagem', 'score', 'veredito', 'userAgent'
];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold').setBackground('#ff2e7e').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var p = (e && e.parameter) || {};
    if (e && e.postData && e.postData.type === 'application/json') {
      p = JSON.parse(e.postData.contents);
    }
    var row = FIELDS.map(function (f) {
      var v = p[f] == null ? '' : String(p[f]);
      if (f === 'timestamp' && !v) v = new Date().toISOString();
      // Evita fórmula injetada na planilha (=, +, -, @)
      if (/^[=+\-@]/.test(v)) v = "'" + v;
      return v.slice(0, 1000);
    });
    getSheet_().appendRow(row);
    return json_({ ok: true, msg: 'Inscrição recebida. O Vanderlei vai ignorar com carinho.' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, msg: 'API do amor online. Use POST.' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
