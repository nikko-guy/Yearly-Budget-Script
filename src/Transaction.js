function debug() {
  run();
}

/** 
 * @constructor
 * @param {Date} date date of transaction
 * @param {Number} amount positive float
 * @param {String} description description of transaction
 * @param {TransactionType} type either income or expense
 * @param {CommonNameObject} commonName Common Name associated with transaction, default null
 * @param {String} uuid ID of transaction, automatically generates ID if none provided
 * @param {String} a1 a1Range of the transaction's description cell
*/
const TransactionObject = function (date, amount, description, type, commonName = new CommonNameObject(simplifyBankName(description), []), uuid = generateUUID(type), a1 = null) {
  this.date = date;
  this.amount = amount;
  this.description = description;
  this.type = type;
  this.commonName = commonName;
  this.uuid = uuid;
  this.a1 = a1;
  this.toString = function () {
    return [date, amount, description, type.NAME, commonName.toString(), uuid, a1].join(splitters.TRANSACTION);
  }
}

/**
 * @param {String} phrase Phrase to parse to transaction
 * @return {TransactionObject}
 */
function toTransaction(phrase) {
  var list = phrase.split(splitters.TRANSACTION);
  list[4] = toCommonName(list[4]);
  list[3] = list[3] == "Income" ? TransactionType.INCOME : TransactionType.EXPENSE;
  list[0] = new Date(list[0]);
  list[1] = Number.parseFloat(list[1]);
  return new TransactionObject(list[0], list[1], list[2], list[3], list[4], list[5], list[6]);
}

/**
 * @param {String} NAME
 * @param {SpreadSheetApp.Sheet} SHEET
 * @param {SpreadSheetApp.Sheet} CNSHEET
 */
const TransactionType = {
  INCOME: {
    NAME: "Income",
    SHEET: spreadsheet.getSheetByName("Income Sheet"),
    CNSHEET: spreadsheet.getSheetByName("Income Common Names"),
    CATSHEET: spreadsheet.getSheetByName("Income Categories")
  },
  EXPENSE: {
    NAME: "Expense",
    SHEET: spreadsheet.getSheetByName("Expense Sheet"),
    CNSHEET: spreadsheet.getSheetByName("Expense Common Names"),
    CATSHEET: spreadsheet.getSheetByName("Expense Categories")
  }
}

/**
 * @param {TransactionType} type
 * @param {Number} row row to get transaction of
 */
function getTransaction(type, row) {
  var sheet = type.SHEET;
  var range = sheet.getRange("B" + row + ":H" + row).getValues();
  var date = range[0][1];
  var amount = range[0][2];
  var description = range[0][3];
  var commonName = commonNames[type.NAME]['UUID'][range[0][6]];
  var uuid = range[0][0];
  return new TransactionObject(date, amount, description, type, commonName, uuid);
}

/**
 * @param {TransactionType} type either income or expesne
 * @param {Number} month month of transactions - 0-indexed
 * @param {TransactionObject[]} transactionList array of transactions
 */
function addTransactionsByMonth(type, month, transactionList) {
  if (transactionList.length == 0) {
    log("No transactions to add for month: " + month + ", type: " + type.NAME);
    return;
  }
  else log("Adding transactions for month: " + month + ", type: " + type.NAME)
  var sheet = type.SHEET;
  var topRow = headerRows[type.NAME][month];

  //Generate array of values to add
  var valsArray = [];
  var rangesToHighlight = [];
  for (var i = 0; i < transactionList.length; i++) {
    var row = topRow + 1 + i;
    var transaction = transactionList[i];
    var uuid = transaction.uuid;
    var date = Utilities.formatDate(transaction.date,"GMT","MM/dd/yyyy");
    var amount = transaction.amount;
    var description = transaction.description;
    var category = "";
    var subcategory = "";
    var cnuuid = transaction.commonName.uuid;
    if (transaction.commonName.commonName != "" && transaction.commonName.commonName != null) {
      description = transaction.commonName.commonName;
      category = transaction.commonName.category;
      subcategory = transaction.commonName.subcat;
    }
    else {
      rangesToHighlight.push("C" + row + ":G" + row);
    }

    valsArray[i] = [uuid, date, amount, description, category, subcategory, cnuuid];
  }

  sheet.insertRowsAfter(topRow, transactionList.length);
  incrementHeaderRows(type, month, transactionList.length);
  var lastRow = topRow + transactionList.length;
  topRow++;

  if (type == TransactionType.INCOME) templateSheetName = "IncomeList";
  else templateSheetName = "ExpenseList";

  spreadsheet.getSheetByName(templateSheetName).getRange("D22:L22").copyTo(sheet.getRange(topRow + ":" + lastRow));
  sheet.getRange("B" + topRow + ":B" + lastRow).setFontColor("white");
  sheet.getRange("H" + topRow + ":H" + lastRow).setFontColor("white");
  sheet.getRange("C" + topRow + ":G" + lastRow).setBorder(true, false, true, false, false, false, "#cccccc", SpreadsheetApp.BorderStyle.DOTTED);

  var range = sheet.getRange("B" + topRow + ":H" + lastRow);
  range.setValues(valsArray);
  range = sheet.getRange(topRow + ":" + lastRow);
  range.sort([3, 4]);

  try {
    sheet.getRangeList(rangesToHighlight).setBackground("red");
  }
  catch (error) {
    log("There were no ranges to highlight red");
  }
}

/**
 * @param {TransactionObject[]} transactionList Array of Transactions to save to Original Names
 * @return {TransactionObject[]}
 */
function addOriginalNames(transactionList) {
  //TODO
  //Remove duplicate transactions from list

  //Create Array with uuid and description
  var vals = [];
  for (var key in transactionList) {
    var t = transactionList[key];
    var uuid = normalRichText(t.uuid);
    var description = normalRichText(t.description);
    vals.push([uuid, description]);
  }

  //Add values to sheet
  var sheet = spreadsheet.getSheetByName("Original Names");
  var range = addRows(sheet, vals.length);
  range.setRichTextValues(vals);
}

/**
 * @param {TransactionObject} transaction the transaction
 */
function addTransaction(transaction) {
  var t = transaction.type;
  transactions[transaction.uuid] = transaction;
  var date = Utilities.formatDate(transaction.date,"GMT","MM/dd/yyyy");
  var month = date.getMonth();
  var row = headerRows[t.NAME][month] + 1;
  var sheet = t.SHEET;
  sheet.insertRowBefore(row);
  incrementHeaderRows(t, month + 1);
  var templateSheetName;
  if (t == TransactionType.INCOME) templateSheetName = "IncomeList";
  else templateSheetName = "ExpenseList";
  spreadsheet.getSheetByName(templateSheetName).getRange("D22:L22").copyTo(sheet.getRange(row + ":" + row));
  sheet.getRange("B" + row).setFontColor("white");
  sheet.getRange("H" + row).setFontColor("white");
  sheet.getRange("C" + row + ":G" + row).setBorder(true, false, true, false, false, false, "#cccccc", SpreadsheetApp.BorderStyle.DOTTED);
  sheet.getRange("B" + row).setValue(transaction.uuid);
  sheet.getRange("C" + row).setValue(transaction.date);
  sheet.getRange("D" + row).setValue(transaction.amount);
  sheet.getRange("E" + row).setValue(transaction.description);
  sheet.getRange("H" + row).setValue(transaction.commonName.uuid);
  if (transaction.commonName.commonName != "" && transaction.commonName.commonName != null) {
    sheet.getRange("E" + row).setValue(transaction.commonName.commonName);
    sheet.getRange("F" + row).setValue(transaction.commonName.category);
    sheet.getRange("G" + row).setValue(transaction.commonName.subcat);
  }
  else {
    sheet.getRange("C" + row + ":G" + row).setBackground("red");
  }
  var range = sheet.getRange(row + ":" + headerRows[t.NAME][month + 1]);
  range.sort([3, 4]);
}