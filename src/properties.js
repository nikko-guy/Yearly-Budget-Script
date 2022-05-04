function debug() {
  run();
}

const property = {
  COMMONNAME: {
    INCOME: {
      KEY: "incomeKeysList",
      VALUE: "incomeValuesList"
    },
    EXPENSE: {
      KEY: "expenseKeysList",
      VALUE: "expenseValuesList"
    }
  },
  HEADERROW: {
    KEY: "headerRowKeysList",
    VALUE: "headerRowValuesList"
  },
  TRANSACTION: {
    KEY: "transactionKeysList",
    VALUE: "transactionValuesList"
  },
  FLAG: {
    KEY: "flagKeysList",
    VALUE: "flagValuesList"
  },
  CATEGORY: {
    INCOME: {
      VALUE: "incomeCategoryValuesList"
    },
    EXPENSE: {
      VALUE: "expenseCategoryValuesList"
    }
  }
}

const splitters = {
  PROPERTY: '°',
  SUBPROPERTY: '¡',
  TRANSACTION: 'º',
  COMMONNAME: '®',
  TRANASCTIONUUIDLIST: '©',
  CATEGORY: 'Ω',
  SUBCATEGORY: 'Λ'
}

function loadServices() {
  log("Beginning load from PropertiesService...");

  headerRows = getHeaderRowProperties();
  commonNames = getCommonNameProperties();
  transactions = getTransactionProperties();
  flags = getFlagProperties();

  log("Load complete");
}

/**
 * @return {}
 */
function getServices() {
  log("Beginning load from PropertiesService...");
  var headerRows = getHeaderRowProperties();
  var commonNames = getCommonNameProperties();
  var transactions = getTransactionProperties();
  var flags = getFlagProperties();
  var categories = getCategoryProperties();
  log("Load complete");
  return { "headerRows": headerRows, "commonNames": commonNames, "transactions": transactions, "flags": flags };
}

function saveServices() {
  reloadAll();
  log("Beginning save to PropertiesService...")
  saveHeaderRowProperties();
  saveCommonNameProperties();
  saveTransactionProperties();
  saveFlagProperties();
  saveCategoryProperties();
  log("Save complete");
}

/**
 * 
 */
function saveCommonNameProperties() {
  log("Saving Common Names to PropertiesService");
  function f(type) {
    var keysList = [];
    var valuesList = [];
    for (var key in commonNames[type.NAME]['UUID']) {
      keysList.push(key);
      valuesList.push(commonNames[type.NAME]['UUID'][key]);
    }
    return [keysList.join(splitters.PROPERTY), valuesList.join(splitters.PROPERTY)];
  }
  var incomeStrings = f(TransactionType.INCOME);
  var expenseStrings = f(TransactionType.EXPENSE);
  PropertiesService.getDocumentProperties().setProperty(property.COMMONNAME.INCOME.KEY, incomeStrings[0]);
  PropertiesService.getDocumentProperties().setProperty(property.COMMONNAME.INCOME.VALUE, incomeStrings[1]);
  PropertiesService.getDocumentProperties().setProperty(property.COMMONNAME.EXPENSE.KEY, expenseStrings[0]);
  PropertiesService.getDocumentProperties().setProperty(property.COMMONNAME.EXPENSE.VALUE, expenseStrings[1]);
  log("Saved CommonNames to PropertiesService");
}

/**
 * @return {}
 */
function getCommonNameProperties() {
  log("Loading CommonNames from PropertiesService");
  var final = {};
  try {
    var incomeStrings = [properties[property.COMMONNAME.INCOME.KEY].split(splitters.PROPERTY), properties[property.COMMONNAME.INCOME.VALUE].split(splitters.PROPERTY)];
    var expenseStrings = [properties[property.COMMONNAME.EXPENSE.KEY].split(splitters.PROPERTY), properties[property.COMMONNAME.EXPENSE.VALUE].split(splitters.PROPERTY)];

    final[TransactionType.INCOME.NAME] = { 'NAME': {}, 'UUID': {} };
    final[TransactionType.EXPENSE.NAME] = { 'NAME': {}, 'UUID': {} };
    for (var i = 0; i < incomeStrings[0].length; i++) {
      var key = incomeStrings[0][i];
      var value = toCommonName(incomeStrings[1][i]);

      final[TransactionType.INCOME.NAME]['UUID'][key] = value;
      final[TransactionType.INCOME.NAME]['NAME'][value.bankName] = value;
    }

    for (var i = 0; i < expenseStrings[0].length; i++) {
      var key = expenseStrings[0][i];
      var value = toCommonName(expenseStrings[1][i]);

      final[TransactionType.EXPENSE.NAME]['NAME'][key] = value;
      final[TransactionType.EXPENSE.NAME]['UUID'][value.uuid] = value;
    }

    log("Loaded CommonNames from PropertiesService");
  }
  catch (e) {
    log("Failed to load CommonNames from PropertiesService", true);
    log(e.stack, true);
  }
  return final;
}

/**
 * 
 */
function saveTransactionProperties() {
  log("Saving Transactions to PropertiesService");
  var keysList = [];
  var valuesList = [];

  for (var uuid in transactions) {
    keysList.push(uuid);
    valuesList.push(transactions[uuid]);
  }

  PropertiesService.getDocumentProperties().setProperty(property.TRANSACTION.KEY, keysList.join(splitters.PROPERTY));
  PropertiesService.getDocumentProperties().setProperty(property.TRANSACTION.VALUE, valuesList.join(splitters.PROPERTY));

  log("Saved Transactions to PropertiesService");
}

/**
 * @return {}
 */
function getTransactionProperties() {
  log("Loading Transactions from PropertiesService");
  var final = {};
  try {
    var keys = properties[property.TRANSACTION.KEY].split(splitters.PROPERTY);
    var values = properties[property.TRANSACTION.VALUE].split(splitters.PROPERTY);

    for (var i = 0; i < keys.length; i++) {
      var uuid = keys[i];
      var t = toTransaction(values[i]);
      final[uuid] = t;
    }
    log("Successfully loaded Transactions from PropertiesService");
  }
  catch (e) {
    log("Failed to load Transactions from PropertiesService", true);
    log(e.stack, true);
  }
  return final;
}

/**
 * 
 */
function saveCategoryProperties() {
  log("Saving Categories to PropertiesService");
  function f(type) {
    var valuesList = [];
    for (var i in categories[type.NAME]) {
      valuesList.push(categories[type.NAME][i]);
    }
    return valuesList.join(splitters.PROPERTY);
  }
  var incomeStrings = f(TransactionType.INCOME);
  var expenseStrings = f(TransactionType.EXPENSE);
  PropertiesService.getDocumentProperties().setProperty(property.CATEGORY.INCOME.VALUE, incomeStrings);
  PropertiesService.getDocumentProperties().setProperty(property.CATEGORY.EXPENSE.VALUE, expenseStrings);
  log("Saved Categories to PropertiesService");
}

/**
 * @return {}
 */
function getCategoryProperties() {
  log("Loading Categories from PropertiesService");
  var final = {};
  try {
    var incomeStrings = properties[property.CATEGORY.INCOME.VALUE].split(splitters.PROPERTY);
    var expenseStrings = properties[property.CATEGORY.EXPENSE.VALUE].split(splitters.PROPERTY);

    final[TransactionType.INCOME.NAME] = [];
    final[TransactionType.EXPENSE.NAME] = [];
    for (var i = 0; i < incomeStrings.length; i++) {
      var value = toCategory(incomeStrings[i]);

      final[TransactionType.INCOME.NAME].push(value);
    }
    for (var i = 0; i < expenseStrings.length; i++) {
      var value = toCategory(expenseStrings[i]);

      final[TransactionType.EXPENSE.NAME].push(value);
    }

    log("Loaded Categories from PropertiesService");
  }
  catch (e) {
    log("Failed to load Categories from PropertiesService", true);
    log(e.stack, true);
  }
  return final;
}

/**
 * @return []
 */
function saveFlagProperties() {
  log("Saving Flags to PropertiesService");
  var keysList = [];
  var valuesList = [];
  for (var flag in flags) {
    keysList.push(flag);
    valuesList.push(flags[flag].join(splitters.SUBPROPERTY));
  }
  var keyString = keysList.join(splitters.PROPERTY);
  var valueString = valuesList.join(splitters.PROPERTY);
  PropertiesService.getDocumentProperties().setProperty(property.FLAG.KEY, keyString);
  PropertiesService.getDocumentProperties().setProperty(property.FLAG.VALUE, valueString);
  log("Saved Flags to PropertiesService");
  return [keyString, valueString];
}

/**
 * @return {}
 */
function getFlagProperties() {
  log("Loading Flags from PropertiesService");
  var final = {};
  try {
    var keys = properties[property.FLAG.KEY].split(splitters.PROPERTY);
    var values = properties[property.FLAG.VALUE].split(splitters.PROPERTY);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var transactionPhraseList = values[i].split(splitters.SUBPROPERTY);
      transactionPhraseList = !(transactionPhraseList.length == 1 && (isEmpty(transactionPhraseList[0]) || isBlank(transactionPhraseList[0]))) ? transactionPhraseList : [];
      var transactionList = [];

      for (var j = 0; j < transactionPhraseList.length; j++) {
        var t = transactionPhraseList[j];
        if (isEmpty(t) || isBlank(t)) continue;
        transactionList.push(toTransaction(t));
      }

      final[key] = transactionList;
    }

    log("Successfully loaded Flags from PropertiesService");
  }
  catch (e) {
    log("Failed to load Flags from PropertiesService", true);
    log(e.stack, true);
  }
  return final;
}

/**
 * 
 */
function saveHeaderRowProperties() {
  log("Saving Header Rows to PropertiesService");
  var keysList = [];
  var valuesList = [];
  for (var key in headerRows) {
    keysList.push(key);
    valuesList.push(headerRows[key].join(splitters.SUBPROPERTY));
  }

  PropertiesService.getDocumentProperties().setProperty(property.HEADERROW.KEY, keysList.join(splitters.PROPERTY));
  PropertiesService.getDocumentProperties().setProperty(property.HEADERROW.VALUE, valuesList.join(splitters.PROPERTY));
  log("Saved Header Rows to PropertiesService");
}

/**
 * @return {}
 */
function getHeaderRowProperties() {
  var final = {};
  log("Loading Header Rows from PropertiesService");
  try {
    var keys = properties[property.HEADERROW.KEY].split(splitters.PROPERTY);
    var values = properties[property.HEADERROW.VALUE].split(splitters.PROPERTY);

    for (var i = 0; i < keys.length; i++) {
      var type = keys[i];
      var rows = values[i].split(splitters.SUBPROPERTY).map(function (val) {
        return Number.parseInt(val);
      });
      final[type] = rows;
    }
    log("Successfully loaded Header Rows from PropertiesService");
  }
  catch (e) {
    log("Failed to load Header Rows from PropertiesService", true);
    log(e.stack, true);
  }
  return final;
}
