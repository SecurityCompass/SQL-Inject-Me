/* this object is responsible for dealing with the Attack Strings.*/
function AttackStringContainer() {
    this.strings = Array();
    this.prefBranch = null;
    this.init();
}

AttackStringContainer.prototype = {
    init: function (){
        var prefService = Components.
                classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefService);
        var attackStrings;
        
        this.prefBranch = prefService.getBranch('extensions.xssme.');
        attackStrings = this.prefBranch.getCharPref('attacks');
        this.strings = JSON.fromString(attackStrings);

    }
    ,
    getAttacks: function(force){
        if (typeof(force) !== "undefined" && force === true){
            this.init();
        }
        return this.strings;
    }
    ,
    addAttack: function(attackString, signature) {
        dump('adding attack: ' + attackString + " " + signature + "\n");
        if (!attackString) {
            return false;
        }
        
        var attack = new Object();
        attack.string = attackString;
        attack.sig = signature;
        if (this.strings.every(checkUnique, attack)){
            this.strings.push(attack);
            this.save();
            return true;
        }
        else {
            return false;
        }
    }
    ,
    save: function() {
        this.prefBranch.setCharPref('attacks', JSON.toString(this.strings));
        
    }
    ,
    swap: function (index1, index2){
        if (typeof(this.strings[index1]) === "undefined" || 
            this.strings[index1] === null || 
            typeof(this.strings[index2]) === "undefined" || 
            this.strings[index2] === null)
        {
            return false;
        }
        
        [this.strings[index2], this.strings[index1]] = 
            [this.strings[index1], this.strings[index2]]
            
        this.save();
        
        return true;
    }
};

/* used by addAttack to ensure that a given (in this.string) is not in the 
 * container
 */
function checkUnique(element, index, array){
    dump("checkunique: " + (this.string) + " " + (element.string) + " \n");
    dump("checkunique: " + (this.string != element.string) + " \n");
    return this.string != element.string;
}

function getAttackStringCointainer(){
    if (typeof(attackStringContainer) === 'undefined' || !attackStringContainer){
        attackStringContainer = new AttackStringContainer();
    }
    return attackStringContainer;
}
