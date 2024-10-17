/**
 * 
 * @param {String} name Name of category
 * @param {TransactionType} type either income or expense
 * @param {String[]} subcategories Array of subcategories
 */
const Category = function (name, type, subcategories = ["Other"]) {
    this.name = name;
    this.type = type;
    this.subcategories = subcategories;
    this.toString = function () {
        return [name, type.NAME, subcategories != [] ? subcategories.join(splitters.SUBCATEGORY) : ""].join(splitters.CATEGORY);
    }
}

/**
 * Converts string to Category object
 * @param {String} string 
 * @returns {Category}
 */
function toCategory(string) {
    var list = string.split(splitters.CATEGORY);
    list[1] = list[1] == "Income" ? TransactionType.INCOME : TransactionType.EXPENSE;
    var subcats = list[2];
    list[2] = !(subcats.length == 1 && (isEmpty(subcats[0]) || isBlank(subcats[0]))) ? list[2].split(splitters.SUBCATEGORY) : [];
    return new Category(list[0], list[1], list[2]);
}

/**
 * handles button press for createCategory
 * @todo write function
 */
function createCategoryInteract() {

}

/**
 * creates a new category in the spreadsheet
 * @todo finish function
 * @param {String} name 
 * @param {TransactionType} type either Income or Expense
 */
function createCategory(name, type) {
    //add category to global var
    var category = new Category(name,type);
    categories[type.NAME].push(category);

    //reload entire category list in spreadsheet in alphabetical order
    updateCategorySheet(type);
}

/**
 * handles button press for addSubcategory
 * @todo write function
 * @todo create the possibility to add multiple subcategories
 */
function addSubcategoryInteract() {

}

/**
 * adds a subcategory to the given category in the spreadsheet
 * @todo write function
 * @param {String} categoryName 
 * @param {TransactionType} type either Income or Expense
 * @param {String} name 
 */
function addSubcategory(categoryName, type, name) {


    //reload entire category list in spreadsheet in alphabetical order
    updateCategorySheet(type);
}

/**
 * Sets appropriate spreadsheet to category values
 * @param {TransactionType} type either Income or Expense
 */
function updateCategorySheet(type){

    var sheet = type.CATSHEET;
    var cats = categories[type.NAME];
    var length = cats.length;
    var vals = [];
    //prepare array to add to sheet
    for(var cat in cats){
        var subcats = cat.subcategories;
        vals.push([cat.name,subcats.join(',')]);
    }
    //clear sheet
    sheet.getRange("A2:B").clear();
    //set and sort values
    addRows(sheet,length).setValues(vals).sort(1);

    //TODO
    //Update Summary Sheet
    sheet = spreadsheet.getSheetByName(type.NAME + " Summary");

    
}