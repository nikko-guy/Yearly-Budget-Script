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
  var fileBlob = response.getBlob();
  var folderID = getInvoiceFolderID();
  var folder = DriveApp.getFolderById(folderID);
  var result = folder.createFile(fileBlob);
}

/**
 * @param {TransactionObject[]} transactionList
 */
function generateInvoice(transactionList) {

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

var invoice = {
  'logo': "http://invoiced.com/img/logo-invoice.png",
  'from': "Invoiced\n701 Brazos St\nAustin, TX 78748",
  'to': "Johnny Appleseed",
  'currency': "usd",
  'number': "INV-0001",
  'items': [
    {
      'name': "Subscription to Starter",
      'unit_cost': '50',
      "description": "The best gizmos there are around."
    }
  ],
  "custom_fields": [
    {
      "name": "Gizmo",
      "value": "PO-1234"
    },
    {
      "name": "Account Number",
      "value": "CUST-456"
    }
  ],
  'notes': "Thanks for being an awesome customer!",
}