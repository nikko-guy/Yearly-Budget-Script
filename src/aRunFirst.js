var commonNames = {};
var transactions = {};
var headerRows = {};
var flags = {};
var originalNames = {};
var privacyTransactions = [];
var categories = {};

const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
const spreadsheetID = spreadsheet.getId();
const properties = PropertiesService.getDocumentProperties().getProperties();

var normalText = SpreadsheetApp.newTextStyle().setBold(false).setFontFamily("Lato").setFontSize(11).setForegroundColor("#576475")
  .setItalic(false).setStrikethrough(false).setUnderline(false).setBold(false).build();

function run() {
  function f(type){
    categories[type.NAME] = [];

    var sheet = spreadsheet.getSheetByName(type.NAME+"List");
    var lastColumn = sheet.getLastColumn();
    var lastRow = sheet.getLastRow();

    var vals = sheet.getRange(1,1,lastRow-1,lastColumn-1).getValues();
    debugger;
  }
  f(TransactionType.INCOME)
  debugger;
}

function test() {

}