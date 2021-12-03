var privacyTransactions = [];
var ptNameList = [];

var PrivacyTransactionObject = function(date,amount,description){
  this.date = date;
  this.amount = amount;
  this.description = description;
}

/**
 * returns list of names for each transaction
 * @param {TransactionObject[]} transactionList
 * @return {String[]}
 */
function getPrivacyNames(transactionList){
  //quick and dirty assumption
  var pt1,pt2,t1,t2;
  pt1 = privacyTransactions[0];
  pt2 = privacyTransactions[privacyTransactions.length-1];
  t1 = transactionList[0];
  t2 = transactionList[transactionList.length-1];

  if(privacyTransactions.length==transactionList.length&&ptIsT(pt1,t1)&&ptIsT(pt2,t2)){
    return ptNameList;
  }
}

/**
 * checks if transaction and privacy transaction are similar
 * @param {PrivacyTransactionObject} privacyTransaction
 * @param {TransactionObject} transaction
 * @return {Boolean}
 */
function ptIsT(privacyTransaction,transaction){
  var pt = privacyTransaction;
  var t = transaction;

  var MILLIS_PER_DAY = 1000 * 60 * 60 * 24;

  var dateLow = pt.date.getTime();
  var dateHigh = new Date(dateLow + 3 * MILLIS_PER_DAY).getTime();

  return (t.date.getTime()>=dateLow&&t.date.getTime()<=dateHigh)&&(pt.amount==t.amount);
}