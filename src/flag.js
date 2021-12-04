function debug() {
  run();
}

/**
 * Shows transactions with flag on "Flagged Transactions" sheet
 * @param {String} flag flag to search
 */
function showTransactionsWithFlag(flag) {
  log("Flags: " + flags);
  log("Showing Transactions with flag: " + flag);
  var sheet = spreadsheet.getSheetByName("Flagged Transactions");
  var emptyRow = getEmptyRow(sheet, "C5:C", 5);
  var transactionList = flags[flag];

  //Clear existing transactions on page
  log("Empty Row: " + emptyRow);
  log("Clearing Flagged Transactions Page");
  var range = sheet.getRange("A5:C");
  range.clearContent();

  if (transactionList.length == 0) {
    log("There are no transactions with this flag!");
    return;
  }
  log("# of Transactions with flag: " + transactionList.length);

  //Create Array of values to paste
  var dateArray = [];
  var amountArray = []
  var descriptionArray = [];
  var formatArray = [];

  var richTextArray = [];

  for (var i = 0; i < transactionList.length; i++) {
    var t = transactionList[i];

    var date = t.date;
    //date = SpreadsheetApp.newRichTextValue().setText(date).setTextStyle(normalText).build();
    dateArray.push([date])

    var amount = t.type == TransactionType.INCOME ? t.amount : (-1 * t.amount);
    //amount = SpreadsheetApp.newRichTextValue().setText(amount).setTextStyle(normalText).build();
    amountArray.push([amount]);

    var description = t.commonName.bankName;
    description = SpreadsheetApp.newRichTextValue().setText(description).setTextStyle(normalText)
      .setLinkUrl(getLinkToRange(t.type.SHEET.getRange(t.a1))).build();
    descriptionArray.push([description]);

    //richTextArray.push([date,amount,description]);
    formatArray.push(["m/d/yy", "$0.00", ""])
  }

  //Add/Delete Rows
  var lastRow = sheet.getMaxRows();
  var endRow = 4 + descriptionArray.length;

  if (lastRow < endRow) sheet.insertRowsAfter(lastRow, endRow - lastRow);
  else if (lastRow > endRow) sheet.deleteRows(endRow + 1, lastRow - endRow);

  //Paste Values and format cells

  var range;

  range = sheet.getRange("A5:A" + endRow);
  range.setValues(dateArray);

  range = sheet.getRange("B5:B" + endRow);
  range.setValues(amountArray);

  range = sheet.getRange("C5:C" + endRow);
  range.setRichTextValues(descriptionArray);

  range = sheet.getRange("A5:C" + endRow);
  //range.setRichTextValues(richTextArray)
  range.setNumberFormats(formatArray)
    .setTextStyle(normalText);

  log("Pasted values into sheet");
}

/**
 * Handles button press for addToFlag
 * @param {String} flag Flag to add transaction(s) to
 */
function addToFlagInteract(flag) {
  reloadAll();
  ui = SpreadsheetApp.getUi();
  var sheet = spreadsheet.getActiveSheet();
  var transactionList = [];

  //Make sure sheet is Valid
  var sheetName = sheet.getName() == "Income Sheet" ? "Income" : sheet.getName() == "Expense Sheet" ? "Expense" : sheet.getName() == "Flagged Transactions" ? "Flagged" : null;
  if (sheetName == null) {
    log("Current sheet is not a valid sheet (Income/Expense Sheet)");
    ui.alert("This can only be used in the Income/Expense Sheet, please select a valid sheet and try again");
    return;
  }
  log("Verified current sheet is valid");

  //Iterate through all selected ranges
  var uuidList = [];
  var ranges = sheet.getActiveRangeList().getRanges();
  log("Number of ranges selected: " + ranges.length);
  for (var i = 0; i < ranges.length; i++) {
    var range = ranges[i];
    log("Current range: " + range.getA1Notation());

    //Convert range to complete rows
    var vals = getRangeAsRows(sheet, range).getValues();

    //Iterate through each row in range
    log("Number of rows in range: " + vals.length);
    log("values of range: " + vals);
    for (var j = 0; j < vals.length; j++) {
      var entry = vals[j];
      log(j + ": " + entry);

      //Make sure row is transaction row
      if (entry[1] == "") {
        log("Selected transactions contain a non-transaction row");
        ui.alert("One or more of the selected rows are not a Transaction row. Please only select Transaction rows and try again.");
        return;
      }
      //Add uuid to list
      uuidList.push(entry[1]);
    }
  }

  //Get transaction for each uuid
  var transactionList = [];
  for (var i = 0; i < uuidList.length; i++) {
    var uuid = uuidList[i];
    transactionList.push(transactions[uuid]);
  }

  addToFlag(flag, transactionList);

}

/**
 * Handles button press for removeFromFlag
 * @param {String} flag Flag to remove transaction(s) from
 */
function removeFromFlagInteract(flag) {
  ui = SpreadsheetApp.getUi();
  var sheet = spreadsheet.getActiveSheet();

  //Make sure sheet is Valid
  var sheetName = sheet.getName() == "Income Sheet" ? "Income" : sheet.getName() == "Expense Sheet" ? "Expense" : sheet.getName() == "Flagged Transactions" ? "Flagged" : null;
  if (sheetName == null) {
    log("Current sheet is not a valid sheet (Income/Expense Sheet, or Flags Page)");
    ui.alert("This can only be used in the Income/Expense Sheet or Flags Page, please select a valid sheet and try again");
    return;
  }
  log("Verified current sheet is valid");

  //Make sure the cell is part of a transaction row
  var cell = sheet.getActiveCell();
  if (cell == null || cell.isPartOfMerge()) {
    log("Selected cell is not part of a transaction row");
    ui.alert("Please select a valid row");
    return;
  }
  log("Verified selected cell is part of a transaction row");
}

/**
 * Adds transactions to flag
 * @param {String} flag Flag to add transaction(s) to
 * @param {Number} row Row of flag in spreadsheet to edit
 * @param {TransactionObject[]} transactionList List of transactions to add
 */
function addToFlag(flag, transactionList) {
  log("Adding transaction(s) to flag " + flag);
  var sheet = spreadsheet.getSheetByName("FlagsList");
  var lastRow = getEmptyRow(sheet, "A1:A", 1) - 1;

  //Find row of flag
  var row;
  var vals = sheet.getRange("A2:B" + lastRow).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (vals[i][0] == flag) row = i + 2;
  }
  log("row of flag " + flag + ": " + row);

  //Add transactions to flag object
  for (var i = 0; i < transactionList.length; i++) {
    //TODO
    //check if transaction already exists in flag

    flags[flag].push(transactionList[i]);
  }

  //Generate list of UUIDs for sheet
  var uuidList = [];
  for (var i = 0; i < flags[flag].length; i++) {
    uuidList.push(flags[flag][i].uuid)
  }

  //Add transactions to flag in sheet
  var list = uuidList.join(',');
  sheet.getRange("B" + row).setValue(list);
  log("Added transaction(s) to flag " + flag);

  return flags[flag];
}

function reloadFlagMenu() {
  var ui = SpreadsheetApp.getUi();

  var flagMenu = ui.createMenu('Flag');
  var addToFlagSubMenu = ui.createMenu('Add to Flag');
  var removeFromFlagSubMenu = ui.createMenu("Remove From Flag");

  generateFlagFunctions();

  Object.keys(flags).forEach(function (flag) {
    addToFlagSubMenu.addItem(flag, "add"+flag);
    removeFromFlagSubMenu.addItem(flag,"remove"+flag)
  });

  if (Object.keys(flags).length > 0) {
    flagMenu.addSubMenu(addToFlagSubMenu)
      .addSubMenu(removeFromFlagSubMenu)
      .addSeparator()
  }

  flagMenu.addItem("Reload Flags", "reloadFlagMenu")
    .addItem("Create Flag","createFlagInteract")
    .addItem("Delete Flag","deleteFlagInteract")
  flagMenu.addToUi();
}

function generateFlagFunctions() {
  Object.keys(flags).forEach(function (flag) {
    this["add"+flag] = function () {
      try {
        addToFlagInteract(flag);
      }
      catch (e) {
        log(e);
      }
    }
    this["remove"+flag] = function () {
      try {
        removeFromFlagInteract(flag);
      }
      catch (e) {
        log(e);
      }
    }
  });
}