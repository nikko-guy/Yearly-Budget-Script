function debug(){
  run();
}

function onEdit() {
  const sheet = spreadsheet.getActiveSheet()
  const cell = sheet.getActiveCell()

  const expenseCategorySheet = spreadsheet.getSheetByName("ExpenseList")
  const incomeCategorySheet = spreadsheet.getSheetByName("IncomeList")

  log("User edited cell " + cell.getA1Notation() + " to: " + cell.getValue());

  //category selection magic don't touch
  if (cell.getColumn() == 6 && (sheet.getName() == "Income Sheet" || sheet.getName() == "Expense Sheet")) {
    const choice = cell.getValue()
    var list
    if (sheet.getName() == "Income Sheet") list = incomeCategorySheet
    else list = expenseCategorySheet
    list.getRange("B22").setValue(choice)

    sheet.getRange("G:G").clearDataValidations()

    var point = cell.offset(0, 1)
    var items = list.getRange("A22:A40")
    var rule = SpreadsheetApp.newDataValidation().requireValueInRange(items, true).build()
    if (choice != "") point.setDataValidation(rule)
  }

  if (sheet.getName() == "Flagged Transactions") {
    if (cell.getColumn() == 1) {
      const choice = cell.getValue();
      if (cell.getA1Notation() == "A2") {
        var point = cell.offset(-1, 1);
        point.setValue("Flag to Show");
        point = point.offset(1, 0);
        var s = spreadsheet.getSheetByName("FlagsList");
        var row = getEmptyRow(s, "A1:A", 1) - 1;
        var items = row > 1 ? s.getRange("A2:A" + row).getValues() : [];
        var rule = SpreadsheetApp.newDataValidation().requireValueInList(items, true).build();
        point.setDataValidation(rule);
      }
      else {
        var point = cell.offset(-1, 1);
        point.setValue("");
        point = point.offset(1, 0);
        point.clearDataValidations();
        point.clear();
      }
    }
    if (cell.getA1Notation() == "B2") {
      const choice = cell.getValue();
      var offset = cell.offset(0, -1);
      log(offset.getA1Notation());
      if (offset.getValue() != "One Flag") {
        log("Flag name exists when choice mode is not set to \"One Flag\"");
        return;
      }
      showTransactionsWithFlag(choice);
    }
  }

}


function onOpen() {
  //add a button to add common name to row
  var entries =
    [
      { name: "Set up common name for selected row", functionName: "commonNameInteract" },
      { name: "Test", functionName: "test" }
    ];
  spreadsheet.addMenu("Common Name", entries);
  spreadsheet.addMenu("Flag", [{ name: "Reload Flags", functionName: "reloadFlagMenu" }]);
  reloadFlagMenu();
}

function importData() {
  const importSheet = spreadsheet.getSheetByName("Import Data");

  var eR = getEmptyRow(importSheet, "A7:A", 7);
  log("Empty row in import sheet is " + eR);
  reloadAll();
  reloadPrivacyTransactions();
  var vals = importSheet.getRange("A7:D" + (eR - 1)).getValues();

  var rawTArray = [];
  var rawValArray = [];
  
  var privacyList = {"i":[],"t":[]};

  //create list of income and expense transactions
  for (var i = 0; i < vals.length; i++) {
    //get data for transaction
    var date = vals[i][0];
    var amount = vals[i][2];
    var description = vals[i][1];

    var type = amount > 0 ? TransactionType.INCOME : TransactionType.EXPENSE;
    amount = Math.abs(amount);

    //create transaction object
    var t = new TransactionObject(date, amount, description, type);

    //Handle privacy.com transactions
    if(description.toLowerCase().indexOf("privacy")!=-1){
      privacyList["i"].push(i);
      privacyList["t"].push(t);
    }

    rawTArray[i] = t;
    rawValArray[i] = [date, description, amount, t.uuid]
  }

  //Apply privacy.com names to transactions
  var privacyNames = getPrivacyNames(privacyList["t"]);

  for(var j=0;j<privacyNames.length;j++){
    var description = privacyNames[j];
    var i = privacyList["i"][j];
    var t = rawTArray[i];
    var v = rawValArray[i];

    t.description = description;
    v[1] = description;

    rawTArray[i] = t;
    rawValArray[i] = v;
  }

  var tList = { 'Income': [], 'Expense': [] };
  var valsList = { 'Income': [], 'Expense': [] };

  //Sort transactions into type
  for(var i=0;i<rawTArray.length;i++){
    var t = rawTArray[i];

    var date = t.date;
    var description = t.description;
    var amount = t.amount;
    var type = t.type;

    tList[type.NAME].push(t);
    valsList[type.NAME].push([date, description, amount, t.uuid]);
  }

  //Add Original Names and check for duplicates


  //TODO
  //Set Data to list without duplicates

  //Make sure commonName exists for each transaction
  addCommonNames(TransactionType.INCOME, tList[TransactionType.INCOME.NAME]);
  addCommonNames(TransactionType.EXPENSE, tList[TransactionType.EXPENSE.NAME]);

  //put transactions in income and expense sections in the import sheet
  function pasteValues(type, firstRow) {
    var range = importSheet.getRange("A" + firstRow + ":D" + (firstRow - 1 + valsList[type.NAME].length));
    var list = valsList[type.NAME];
    range.setValues(list);
    return [range.getLastRow(), range];
  }

  var a = pasteValues(TransactionType.EXPENSE, 7);
  var b = pasteValues(TransactionType.INCOME, a[0] + 1);

  ranges = [a[1], b[1]];

  //sort transactions
  ranges[0].sort([1, { column: 3, ascending: false }]);
  ranges[1].sort([1, { column: 3, ascending: false }]);

  //add entire month of transactions under correct header
  //create empty array for transactions
  var transactionsByMonth = { 'Income': [], 'Expense': [] }
  for (var i = 0; i < 12; i++) {
    transactionsByMonth['Income'][i] = [];
    transactionsByMonth['Expense'][i] = [];
  }
  vals = importSheet.getRange("A7:D" + (eR - 1)).getValues();
  //put transactions into array
  for (var i = 0; i < vals.length; i++) {
    //get data for transaction
    var date = vals[i][0];
    var month = Number.parseInt(Utilities.formatDate(date,"GMT","M"))-1;
    var amount = vals[i][2];
    var description = vals[i][1];
    var uuid = vals[i][3];
    var type = transactions[uuid].type;
    var commonName = commonNames[type.NAME]['NAME'][simplifyBankName(description)];

    //create transaction object
    var t = new TransactionObject(date, amount, description, type, commonName, uuid);

    //add transaction to appropriate section in array
    transactionsByMonth[type.NAME][month].push(t);

  }
  //Add set of transactions to correct month header
  for (var i = 0; i < 12; i++) {
    addTransactionsByMonth(TransactionType.INCOME, i, transactionsByMonth[TransactionType.INCOME.NAME][i]);
    addTransactionsByMonth(TransactionType.EXPENSE, i, transactionsByMonth[TransactionType.EXPENSE.NAME][i]);
  }

  //TODO
  //Clear transactions from Import Sheet
  ranges[0].clear();
  ranges[1].clear();

  //reload and save Transactions
  reloadTransactions();
}
