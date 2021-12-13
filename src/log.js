var debugSheet = spreadsheet.getSheetByName("Debug");
var emptyRowCell = debugSheet.getRange("D19");
var debugEnabledCell = debugSheet.getRange("D17");
var logEmptyRow = parseInt(emptyRowCell.getValue());
var debugEnabled = debugEnabledCell.getValue() == spreadsheet.getSheetByName("ExpenseList").getRange("G25").getValue() ? true : false;
var debugInConsole = true;

function debug() {
  run();
}

function log() {
  var args = arguments;
  var caller = log.caller.name;
  var write = true;
  var message = caller + "():" + args[0];

  if (debugInConsole) console.log(message);
  //log if debugEnabled==true or override is enabled
  var override = false;
  if (args.length > 1) override = args[1];
  if (!override) write = debugEnabled;
  else write = true;
  if (!write) return;

  console.log(message);
  message = override ? "OVERRIDE: " : "" + caller + "(): " + args[0];
  debugSheet.getRange("A" + logEmptyRow).setValue(Utilities.formatDate(new Date(),GMT,"H:m:ss.SSS")+" GMT");
  debugSheet.getRange("B" + logEmptyRow).setValue(caller);
  debugSheet.getRange("C" + logEmptyRow).setValue(args[0]);
  logEmptyRow++;
  emptyRowCell.setValue(logEmptyRow);
  return args[0];
}

function clearDebugLog() {
  var range = debugSheet.getRange("A2:C");
  range.setBackground(null);
  range.setValue("");
  emptyRowCell.setValue(2);
}

function toggleDebug() {
  debugEnabled = !debugEnabled;
  debugEnabledCell.setValue(debugEnabled);
}