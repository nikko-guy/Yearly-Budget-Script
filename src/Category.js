/**
 * 
 * @param {String} name Name of category
 * @param {TransactionType} type either income or expense
 * @param {String[]} subcategories Array of subcategories
 */
const Category = function(name, type, subcategories = []){
    this.name = name;
    this.type = type;
    this.subcategories = subcategories;
    this.toString = function(){
        return [name,type,subcategories!=[]?subcategories.join(splitters.SUBCATEGORY):""].join(splitters.CATEGORY);
    }
}

/**
 * Converts string to Category object
 * @param {String} string 
 * @returns {Category}
 */
function toCategory(string){
    var list = string.split(splitters.CATEGORY);
    var subcats = list[2];
    list[2] = !(subcats.length == 1 && (isEmpty(subcats[0]) || isBlank(subcats[0]))) ? list[2].split(splitters.SUBCATEGORY) : [];
    return new Category(list[0], list[1], list[2]);
}

/**
 * handles button press for createCategory
 * @todo write function
 */
function createCategoryInteract(){

}

/**
 * creates a new category in the spreadsheet
 * @todo write function
 * @param {String} name 
 */
function createCategory(name){

}

/**
 * handles button press for addSubcategory
 * @todo write function
 * @todo create the possibility to add multiple subcategories
 */
function addSubcategoryInteract(){

}

/**
 * adds a subcategory to the given category in the spreadsheet
 * @todo write function
 * @param {String} categoryName 
 * @param {String} name 
 */
function addSubcategory(categoryName,name){

}