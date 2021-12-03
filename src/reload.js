function debug() {
  run();
}

function reloadAll() {
  log("Beginning reload...")
  reloadTransactions();
  reloadFlags();
  log("Reload complete");
}

function reloadTransactions() {
  transactions = {};
  function f(type) {
    var max = getEmptyRow(type.SHEET) - 1;
    var range = type.SHEET.getRange("B1:H" + max);
    var vals = range.getValues();


    for (var row = 5; row <= max; row++) {

      var c = false;
      //skip row if month header
      for (var i = 0; i < 12; i++) {
        if (row == headerRows[type.NAME][i]) {
          c = true;
          break;
        }
      }
      if (c) continue;

      //init transaction
      var uuid = vals[row - 1][0];
      var date = vals[row - 1][1];
      var amount = vals[row - 1][2];
      var description = vals[row - 1][3];
      var commonName = commonNames[type.NAME]['UUID'][vals[row - 1][6]];
      var a1 = "E" + row;
      var t = new TransactionObject(date, amount, description, type, commonName, uuid, a1);
      transactions[uuid] = t;
    }
  }
  reloadHeaderRows();
  reloadCommonNames();
  log("Reloading Transactions");
  f(TransactionType.INCOME);
  f(TransactionType.EXPENSE);

  log("Successfully reloaded Transactions")
  saveTransactionProperties();
  return transactions;
}

function reloadCommonNames() {
  commonNames = {};
  log("Reloading Common Names");
  function f(type) {
    var listByName = {};
    var listByUUID = {};
    commonNames[type.NAME] = { 'NAME': {}, 'UUID': {} };
    sheet = type.CNSHEET;
    if (sheet.getRange("A3").getValue() == "") return;
    var max = getEmptyRow(sheet, "A2:A", 2) - 1;
    var range = sheet.getRange("A3:F" + max);
    var vals = range.getValues();
    for (var i = 0; i < max - 2; i++) {
      var bankName = vals[i][0];
      var commonName = vals[i][1];
      var category = vals[i][2];
      var subcat = vals[i][3];
      var uuid = vals[i][4];
      var transactionUuids = vals[i][5].split(",");
      var cn = new CommonNameObject(bankName, transactionUuids, commonName, category, subcat, uuid);
      listByName[bankName] = cn;
      listByUUID[uuid] = cn;
    }
    commonNames[type.NAME]['NAME'] = listByName;
    commonNames[type.NAME]['UUID'] = listByUUID;
  }
  f(TransactionType.INCOME);
  f(TransactionType.EXPENSE);

  log("Successfully reloaded Common Names")
  saveCommonNameProperties();
  return commonNames;
}

function reloadFlags() {
  flags = {};
  log("Reloading Flags");
  var sheet = spreadsheet.getSheetByName("FlagsList");
  var lastRow = getEmptyRow(sheet, "A1:A", 1) - 1;
  if (lastRow != 1) {
    var vals = sheet.getRange("A2:B" + lastRow).getValues();
    for (var i = 0; i < vals.length; i++) {
      var tList = [];
      var list = vals[i][1].split(",");
      if (!(list.length == 1 && (isEmpty(list[0]) || isBlank(list[0])))) {
        for (var j = 0; j < list.length; j++) {
          tList.push(transactions[list[j]]);
        }
      }
      flags[vals[i][0]] = tList;
    }
  }

  log("Successfully reloaded Flags")
  saveFlagProperties();
  return flags;
}

function reloadHeaderRows() {
  headerRows = {};
  log("Reloading Header Rows");
  function f(sheet) {
    var range = sheet.getRange("A4:A").getValues();
    var end = false;
    var list = [];
    var i = 0;
    while (!end) {
      var cell = range[i][0];
      if (cell != "") {
        list.push(i + 4);
        if (cell.getMonth() == 11) end = true;
      }
      i++;
    }
    return list;
  }
  headerRows[TransactionType.EXPENSE.NAME] = f(TransactionType.EXPENSE.SHEET);
  headerRows[TransactionType.INCOME.NAME] = f(TransactionType.INCOME.SHEET);

  log("Successfully reloaded Header Rows")
  saveHeaderRowProperties();
  return headerRows;
}

function reloadPrivacyTransactions(){
  privacyTransactions = [];
  log("Reloading Privacy Transactions");

  var sheet = spreadsheet.getSheetByName("Privacy.com Data");
  var lastRow = sheet.getLastRow();

  if(lastRow==1) return privacyTransactions;

  //fix the dates format
  var dateRange = sheet.getRange("A2:A"+lastRow)
  var dates = dateRange.getValues();
  dates = dates.map(function(a){
    return [a[0].substring(0,10)];
  });

  //Paste fixed date values and format them
  dateRange.setValues(dates).setNumberFormat("m/d/yy");

  //Create the PrivacyTransactionObject s
  sheet.getRange("A2:C"+lastRow).getValues().map(function(v){
    privacyTransactions.push(new PrivacyTransactionObject(v));
  });

  log("Finished reloading Privacy Transactions");
  return privacyTransactions;
}