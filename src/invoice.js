function debug() {
  run();
}

const folderName = 'Invoices Test'

function saveInvoicePDF(invoice) {
  var postData = JSON.stringify(invoice);
  var options = {
    'method': 'POST',
    'contentType': "application/json",
    'payload': postData,
  };

  // Make a POST request with a JSON payload.
  var response = UrlFetchApp.fetch('https://invoice-generator.com', options);
  var fileBlob = response.getBlob().setName("Invoice "+invoice.number);
  var folderID = getInvoiceFolderID();
  var folder = DriveApp.getFolderById(folderID);
  var result = folder.createFile(fileBlob);
}

/**
 * @param {TransactionObject[]} transactionList
 */
function generateInvoice(transactionList) {
  var invoice = {
    'logo': "https://i.imgur.com/Oj4T5Il.png",
    'from': "Nikko Gajowniczek",
    'to': "Magdalena Gajowniczek",
    'currency': "usd",
    'number': "INV-0001",
    'notes': "Thanks for being an awesome customer!",
    'unit_cost_header': "Price",
  }

  //TODO
  //get first and last dates in transactionList
  var beginningDate = "01/01/2021";
  var endDate = "12/31/2021";

  invoice.custom_fields = [
    {
      "name": "Beginning Date",
      "value": beginningDate
    },
    {
      "name": "End Date",
      "value": endDate
    }
  ]

  //create Items
  var items = [];
  for (var i in transactionList) {
    /** @type {TransactionObject} */
    var t = transactionList[i];
    var item = {};
    item.name = t.description;
    item.unit_cost = t.type == TransactionType.INCOME ? -1 * t.amount : t.amount;
    item.description = Utilities.formatDate(t.date, "GMT", "MM/dd/yyyy");

    items.push(item)
  }

  invoice.items = items;

  return invoice;

}

/**
 * @return String
 */
function getInvoiceFolderID() {
  var id;

  var folders = DriveApp.getFoldersByName(folderName);
  if (!folders.hasNext()) {
    DriveApp.createFolder(folderName).getId();
  }
  else {
    id = folders.next().getId()
  }
  return id;
}