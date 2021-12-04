var commonNames = {};
var transactions = {};
var headerRows = {};
var flags = {};
var originalNames = {};
var privacyTransactions = [];

const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
const spreadsheetID = spreadsheet.getId();
const properties = PropertiesService.getDocumentProperties().getProperties();

var normalText = SpreadsheetApp.newTextStyle().setBold(false).setFontFamily("Lato").setFontSize(11).setForegroundColor("#576475")
  .setItalic(false).setStrikethrough(false).setUnderline(false).setBold(false).build();

function run() {
  importData();
  debugger;
}

function test() {

}