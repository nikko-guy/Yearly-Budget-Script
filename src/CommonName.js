function debug() {
  run();
}

/**
 * @constructor
 * @param {String} bankName description provided by the bank
 * @param {String} commonName description that will be represented in Detail Sheets
 * @param {String} category category name
 * @param {String} subcat subcategory name
 * @param {String} uuid ID of common name, automatically generates ID if none provided
 * @param {[String]} transactionUuids array of transaction UUIDs associated with this common name
 */
const CommonNameObject = function (bankName, transactionUuids, commonName = null, category = null, subcat = null, uuid = generateUUID()) {
  this.bankName = bankName;
  this.transactionUuids = transactionUuids;
  this.commonName = commonName;
  this.category = category;
  this.subcat = subcat;
  this.uuid = uuid;
  this.toString = function () {
    return [bankName, transactionUuids != [] ? transactionUuids.join(splitters.TRANASCTIONUUIDLIST) : "", commonName, category, subcat, uuid].join(splitters.COMMONNAME);
  }
}

/**
 * @param {String} phrase Phrase to parse to common name
 * @return {CommonNameObject}
 */
function toCommonName(phrase) {
  var list = phrase.split(splitters.COMMONNAME);
  var ts = list[1];
  list[1] = !(ts.length == 1 && (isEmpty(ts[0]) || isBlank(ts[0]))) ? list[1].split(splitters.TRANASCTIONUUIDLIST) : [];
  return new CommonNameObject(list[0], list[1], list[2], list[3], list[4], list[5])
}

/**
 * @param {Number} row row of CommonName to get
 * @param {TransactionType} type either income or expense
 * @return {CommonNameObject}
 */
function getCommonName(row, type) {
  var sheet = type.CNSHEET;
  var vals = sheet.getRange("A" + row + ":F" + row).getValues();
  var bankName = vals[0][0];
  var commonName = vals[0][1];
  var category = vals[0][2];
  var subcat = vals[0][3];
  var uuid = vals[0][4];
  var transactionUuids = vals[0][5].split(",");
  return new CommonNameObject(bankName, transactionUuids, commonName, category, subcat, uuid);
}

function commonNameInteract() {
  ui = SpreadsheetApp.getUi();
  var sheet = spreadsheet.getActiveSheet();

  //Make sure sheet is either "Income Sheet" or "Expense Sheet"
  var sheetName = sheet.getName() == "Income Sheet" ? "Income" : sheet.getName() == "Expense Sheet" ? "Expense" : null;
  if (sheetName == null) {
    log("Current sheet is not a valid sheet (Income or Expense Sheet)");
    ui.alert("This can only be used in the Income or Expense Sheets, please select one of the two and try again");
    return;
  }
  var type = sheet.getName() == "Income Sheet" ? TransactionType.INCOME : TransactionType.EXPENSE;
  log("Verified current sheet is valid");

  //Make sure the cell is part of a transaction row
  var cell = sheet.getActiveCell();
  if (cell == null || cell.isPartOfMerge()) {
    log("Selected cell is not part of a transaction row");
    ui.alert("Please select a valid row");
    return;
  }
  log("Verified selected cell is part of a transaction row");

  //Get values of transaction
  var row = cell.getRow();
  var vals = sheet.getRange("E" + row + ":H" + row).getValues();
  var description = vals[0][0];
  var category = vals[0][1];
  var subcategory = vals[0][2];
  var cnUUID = vals[0][3];
  log("Transaction values: " + vals);

  //Make sure transaction has categories set
  if (subcategory == "") {
    log("Selected transaction doesn't have a subcategory");
    ui.alert("Please add a category and subcategory to the selected transaction then try again");
    return false;
  }
  log("Verified transaction has subcategory");

  //Prompt to choose common name
  var commonName = ui.prompt("Please enter a common name you'd like to use for\n " + description + "\n" + category + "-" + subcategory + "\nLeave the entry blank if you would not like to use a different name", ui.ButtonSet.OK).getResponseText();
  log("User's common name input: \"" + commonName + "\"");
  //User can choose no common name
  if (isBlank(commonName) || isEmpty(commonName)) {
    commonName = description;
    log("User opted for no common name");
  }
  //Set description
  sheet.getRange("E" + row).setValue(commonName);
  log("Set transaction description to \"" + commonName + "\"");
  //User can choose to not remember this commonName (don't change CommonNameObject and just remove red background)
  var remember = ui.alert("Would you like this common name to be remembered?", ui.ButtonSet.YES_NO) == ui.Button.YES;
  log(remember);
  if (remember) {
    commonName = updateCommonName(type, cnUUID, commonName, category, subcategory);
    log("User chose to remember given common name");
  }
  else {
    log("User opted to not remember common name");
  }
  log(commonName);
  //set background of transaction to transparent
  sheet.getRange("C" + row + ":G" + row).setBackground(null);
  log("Set transaction background to transparent");
  //return if user chose to not remember
  if (!remember) return;

  //User can choose to update all transactions of this type with the chosen common name
  updateCommonNameTransactionsInteract(commonName, type);
}

/**
 * Adds a common name for a transaction, does not check if common name exists
 * @param {TransactionObject} transaction transaction which needs common name generated
 * @return {CommonNameObject}
 */
function addCommonName(transaction) {
  var t = transaction.type;
  var sheet = t.CNSHEET;
  var commonName = new CommonNameObject(simplifyBankName(transaction.description), [transaction.uuid]);
  commonNames[t.NAME]['NAME'][commonName.bankName] = commonName;
  commonNames[t.NAME]['UUID'][commonName.uuid] = commonName;
  var row = getEmptyRow(sheet, "A2:A", 2);
  sheet.getRange("A" + row).setValue(commonName.bankName);
  sheet.getRange("E" + row).setValue(commonName.uuid);
  sheet.getRange("F" + row).setValue(transaction.uuid);
  return commonName;
}

/**
 * Bulk adds common names for an array of transactions, will check if common name exists for transaction
 * @param {TransactionType} typ either income or expense
 * @param {TransactionObject[]} transactionList List of transactions to add common names for
 */
function addCommonNames(type, transactionList) {
  var sheet = type.CNSHEET;


  for (var i = 0; i < transactionList.length; i++) {
    var transaction = transactionList[i];
    //check if Common Name exists
    var commonName = commonNames[type.NAME]['NAME'][simplifyBankName(transaction.description)]
    if (typeof commonName == "undefined") {
      //Create new CommonName if it doesn't exist

      if(transaction.description.toLowerCase().indexOf("zelle")!=-1){
        var name = simplifyBankName(transactionList[i].description);
        if(type.NAME=="Income") commonName = new CommonNameObject(name, [transactionList[i].uuid],name,"Banking","Friends Payment");
        else commonName = new CommonNameObject(name, [transactionList[i].uuid],name,"Banking","Friends Payment");
      }

      else commonName = new CommonNameObject(simplifyBankName(transactionList[i].description), [transactionList[i].uuid]);
      commonNames[type.NAME]['NAME'][commonName.bankName] = commonName;
      commonNames[type.NAME]['UUID'][commonName.uuid] = commonName;
    }
    else {
      //Add transaction to list for CommonName
      commonName.transactionUuids.push(transaction.uuid);
      commonNames[type.NAME]['NAME'][commonName.bankName] = commonName;
      commonNames[type.NAME]['UUID'][commonName.uuid] = commonName;
    }
    transaction.commonName = commonName;
    transactions[transaction.uuid] = transaction;
  }
  //Generate Array for entire CNList
  var valsToAdd = [];
  for (const key in commonNames[type.NAME]['NAME']) {
    var obj = commonNames[type.NAME]['NAME'][key];
    var list = [obj.bankName, obj.commonName, obj.category, obj.subcat, obj.uuid, obj.transactionUuids.join(",")];
    valsToAdd.push(list);
  }
  //Reload ENTIRE CNSheet
  var range = sheet.getRange("A3" + ":F" + (2 + valsToAdd.length));
  range.setValues(valsToAdd);
}

/**
 * Updates common name, category, and subcategory of given CN UUID
 * @param {TransactionType} type either income or expense
 * @param {String} uuid uuid of CommonNameObject to update
 * @param {String} commonName Common name to set CommonNameObject
 * @param {String} category category of CommonNameObject
 * @param {String} subcategory subcategory of CommonNameObject
 * @return {CommonNameObject}
 */
function updateCommonName(type, uuid, commonName, category, subcategory) {
  var sheet = type.CNSHEET;

  //get row of CommonName
  var lastRow = getEmptyRow(sheet, "E3:E", 3) - 1;
  log("Last Row in Common Name Sheet: " + type.NAME + ": " + lastRow);
  var cnUUIDList = sheet.getRange("E1:E" + lastRow).getValues();
  log("List: " + cnUUIDList);
  var row;
  for (var i = 0; i < cnUUIDList.length; i++) {
    if (cnUUIDList[i] == uuid) row = i + 1;
  }
  log("row of common name to update: " + row);
  //update cells
  sheet.getRange("B" + row).setValue(commonName);
  sheet.getRange("C" + row).setValue(category);
  sheet.getRange("D" + row).setValue(subcategory);
  log("updated common name");

  //create CommonName Object
  var bankName = sheet.getRange("A" + row).getValue();
  var transactionUuids = sheet.getRange("F" + row).getValue().split(",");
  var cn = new CommonNameObject(bankName, transactionUuids, commonName, category, subcategory, uuid);

  return cn;
}

/**
 * Interacts with user, prompts whether or not to update all transactions sharing common name
 * @param {CommonNameObject} CommonName common name to update all transactions
 * @param {TransactionType} type either income or expense
 * @return {Boolean}
 */
function updateCommonNameTransactionsInteract(CommonName, type) {
  var updateAll = ui.alert("Would you like all transactions with this name to be updated?", ui.ButtonSet.YES_NO) == ui.Button.YES;
  if (updateAll) {
    log("User opted to update all transactions related to the CommonName");
    updateCommonNameTransactions(CommonName, type);
    log("Updated all transactions with this CommonName");
    return true;
  }
  else log("User opted to only update this transaction");
  return false;
}

/**
 * Updates all transactions sharing CommonName
 * @param {CommonNameObject} CommonName common name to update all transactions
 * @param {TransactionType} type either income or expense
 */
function updateCommonNameTransactions(CommonName, type) {
  var sheet = type.SHEET;
  var transactionUUIDs = CommonName.transactionUuids;

  log("renaming all transactions with CommonName UUID " + CommonName.uuid);
  //get list of UUIDS to check for
  var transactionUUIDList = sheet.getRange("B:B").getValues();
  log("List of all transactions: " + transactionUUIDList);
  log("List of transactions to update: " + transactionUUIDs);

  //update each transaction in list from commonName
  for (var i = 0; i < transactionUUIDs.length; i++) {
    var uuid = transactionUUIDs[i];
    var row = null;

    //find row of transaction to update
    for (var j = 0; j < transactionUUIDList.length; j++) {
      if (transactionUUIDList[j] == uuid) {
        row = j + 1;
      }
    }
    log("row of transaction to update: " + row);
    //update cells
    var tArray = [[CommonName.commonName, CommonName.category, CommonName.subcat]]
    sheet.getRange("E" + row + ":G" + row).setValues(tArray);
    sheet.getRange("C" + row + ":G" + row).setBackground(null);
    log("updated transaction at row " + row);
  }
}