/**
 * ErrorStringContainer.js
 * @requires PreferenceStringContainer.js
 */
 
function ErrorStringContainer(){
    this.init();
}
ErrorStringContainer.prototype = new PreferenceStringContainer();
dump('creating... ErrorStringContainer object\n');
ErrorStringContainer.prototype.init = function (){    
        
    var attackStrings;
        
    this.prefBranch = this.prefService.getBranch('extensions.sqlime.');
    attackStrings = this.prefBranch.getCharPref('errorstrings');
    this.strings = JSON.fromString(attackStrings);
};

ErrorStringContainer.prototype.save = function() {
        this.prefBranch.setCharPref('errorstrings', JSON.toString(this.strings));
}
    

function getErrorStringContainer(){
    
    if (typeof(errorStringContainer) === 'undefined' || !errorStringContainer) {
        errorStringContainer = new ErrorStringContainer();
    }
    
    return errorStringContainer;
}
