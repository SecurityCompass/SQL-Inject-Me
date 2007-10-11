/**
 * AttackStringContainer.js
 * requires preferenceStringContainer.js
 */

/**
 *this object is responsible for dealing with the Attack Strings.
 */
function AttackStringContainer() {
    this.strings = Array();
    this.prefBranch = null;
    this.init();
}
AttackStringContainer.prototype = new PreferenceStringContainer();
dump('creating... AttackStringContainer object\n');
AttackStringContainer.prototype.init = function (){    
        
        var attackStrings;
        
        this.prefBranch = this.prefService.getBranch('extensions.sqlime.');
        attackStrings = this.prefBranch.getCharPref('attacks');
        this.strings = JSON.fromString(attackStrings);

    };
    AttackStringContainer.prototype.save = function() {
        this.prefBranch.setCharPref('attacks', JSON.toString(this.strings));
        
    }
    

function getAttackStringCointainer(){
    if (typeof(attackStringContainer) === 'undefined' || !attackStringContainer){
        attackStringContainer = new AttackStringContainer();
    }
    return attackStringContainer;
}
