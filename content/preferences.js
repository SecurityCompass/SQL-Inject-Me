/* prefereneces.js 
 * @requires JSON
 * @requires AttackStringContainer
 * @requires util.js
 */

function PreferencesController() {
    this.init();
}

PreferencesController.prototype = {
    init: function(){
//         getErrorStringContainer();
        
        var attacks = getAttackStringContainer().getStrings();
        var errorStrings = getErrorStringContainer().getStrings();
        
        if (attacks.length) {
            this.makeUI(attacks, null, 'existingSQLIstrings');
        }
        else {
            var label = document.getElementById('noattackslbl');
            label.style.visibility = 'visible';
        }
        
        if (errorStrings.length){
            this.makeUI(errorStrings, null, 'existingSQLIerrStrings');   
        }
        else {
            var label = document.getElementById('noerrorslbl');
            label.style.visibility = 'visible';
        }
    }
    ,
    makeUI: function(attacks, aWindow, listboxID){
        var theWindow
        if (typeof(aWindow) === 'undefined' || aWindow === null || !aWindow){
            theWindow = window;
        }
        else {
            theWindow = aWindow;
        }
        
        var listbox = theWindow.document.getElementById(listboxID);
        
        while(listbox.hasChildNodes()){
            listbox.removeChild(listbox.firstChild);
        }
        
        for(var i = 0; i < attacks.length; i++){
                var listitem = document.createElement('listitem');
                listitem.setAttribute('label', attacks[i].string);
                listitem.setAttribute('value', i);
                listbox.appendChild(listitem);
        }
    }
    ,
    removeError: function(){
        this.removeItem(getErrorStringContainer(), 'existingSQLIerrStrings');    
    }
    ,
    removeAttack: function(){
        this.removeItem(getAttackStringContainer(), 'existingSQLIstrings');
    }
    ,
    removeItem: function(container, listboxID){
        var listbox = document.getElementById(listboxID);
        var selectedAttacks = listbox.selectedItems;
        var strings = container.getStrings();
        var n = 0;
        for (var i = 0; i < selectedAttacks.length; i++){
            strings[selectedAttacks[i].value] = null;
        }
        while (n < strings.length){
            if (strings[n] === null){
                strings.splice(n, 1);
            }
            else{
                n++; //only incrememnt if attacks[n]!==null. Otherwise we'll 
                     // strings which are adjacent.
            }
        }
        container.save();
        this.makeUI(container.getStrings(), window, listboxID);
    }
    ,
    exportAttacks: function(){
        var exportDoc = document.implementation.createDocument("", "", null);
        var root = exportDoc.createElement('exportedattacks');
        var xmlAttacks = exportDoc.createElement('attacks');
        getAttackStringContainer();
        var attacks = attackStringContainer.getStrings();
        for each (var attack in attacks){
            var xmlAttack = exportDoc.createElement('attack');
            var xmlString = exportDoc.createElement('attackString');
            var xmlSig = exportDoc.createElement('signature');
            var txtString = exportDoc.createCDATASection(
                    encodeXML(attack.string));
            var txtSig = exportDoc.createTextNode(attack.sig);
            xmlString.appendChild(txtString);
            xmlSig.appendChild(txtSig);
            xmlAttack.appendChild(xmlString);
            xmlAttack.appendChild(xmlSig);
            xmlAttacks.appendChild(xmlAttack);
        }
        root.appendChild(xmlAttacks);
        exportDoc.appendChild(root);
        var serializer = new XMLSerializer();
        var xml = serializer.serializeToString(exportDoc);
        dump(xml);dump('\n');

        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var picker = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
        picker.init(window, "Select File To Export To", nsIFilePicker.modeSave);
        var resultOfPicker = picker.show();
        if (resultOfPicker == nsIFilePicker.returnCancel){
            return false;
        }
        var exportFile = picker.file;

        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                .createInstance(Components.interfaces.nsIFileOutputStream);

        foStream.init(exportFile, 0x02 | 0x08 | 0x20, 0666, 0); // write, create, truncate
        foStream.write(xml, xml.length);
        foStream.close();
        return true;

    }
    ,
    importAttacks: function(){
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var picker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        picker.init(window, "Select File To Import From", nsIFilePicker.modeOpen);
        var resultOfPicker = picker.show();
        if (resultOfPicker == nsIFilePicker.returnCancel){
            return false;
        }
        var importFile = picker.file;
        
        var fileContents = FileIO.read(importFile);
        var domParser = new DOMParser();
        var dom = domParser.parseFromString(fileContents, "text/xml");

        if(dom.documentElement.nodeName == "parsererror"){
            alert("error while parsing document, ensure that the document is complete and uncorrupted.");
            return false;
        }
        
        var attacksTags = dom.getElementsByTagName("attacks");
        if (attacksTags.length != 1){
            alert("couldn't find attacks tag. Error while processing document.");
            return false;
        }
        
        var attacksTag = attacksTags[0];
        var attackTags = new Array();
        var attackStringContainer = getAttackStringContainer();
        
        for (var i = 0; i < attacksTag.childNodes.length; i++){
            
//             alert("'" + (attackTag.firstChild.firstChild.nodeName  == '#text')+"'");
            dump("::importAttacks()... (" + attacksTag + "== attacksTag) attacksTag[" + i + "] == " + attacksTag.childNodes[i] + "\n");
            if ("attack" === attacksTag.childNodes[i].nodeName){
                attackTags.push(attacksTag.childNodes[i]);
            }
        }
        if (attackTags.length){
            for each(var attackTag in attackTags){
                var stringTag = null;
                var sigTag = null;
                for each(var tag in attackTag.childNodes){
                    dump("::importAttacks()... (looking for attackString and sig) " + tag.nodeName +  "\n");
                    if (tag.nodeName === "attackString"){
                        dump("got attackString\n");
                        stringTag = tag;
                    }
                    else if (tag.nodeName === "signature"){
                        dump("got sigString\n");
                        sigTag = tag;   
                    }
                }
                if (stringTag === null || sigTag === null){
                    alert("Couldn't import attack. Couldn't find stringAttack or signature tags. Error while processing the document. ");
                    this.makeUI(attackStringContainer.getStrings(), window); // just in case.
                    return false;
                }
                else{
                    if (stringTag.childNodes.length !== 0)
                    {
                        
                        attackStringContainer.addString(
                            decodeXML(stringTag.textContent),
                            sigTag.firstChild.nodeValue);
                    }
                    else {
                        alert("Couldn't import attack. attackString is empty. Error while processing the document. ");
                        this.makeUI(attackStringContainer.getStrings(), window); // just in case.
                        return false;
                    }
                }
            }
        }
        else {
            alert("Couldn't find any attacks. No Attacks imported.");
            return false;            
        }
        this.makeUI(getAttackStringContainer().getStrings(), window, 'existingSQLIstrings');
        this.makeUI(getErrorStringContainer().getStrings(), window, 'existingSQLIerrStrings');
        return true;
    }
    ,
    moveAttackStringUp: function(){
        this.moveItemUp(getAttackStringContainer(), 'existingSQLIstrings');   
    }
    ,
    moveErrorStringUp: function(){
        this.moveItemUp(getErrorStringContainer(), 'existingSQLIerrStrings');   
    }
    ,
    moveItemUp: function(container, listboxID){
        var listbox = document.getElementById(listboxID);
        

        if (listbox.selectedItems.length != 1){
            alert("sorry, only one item can be moved at a time");
            return false;
        }
        
        if (listbox.selectedItem.value == 0){
            alert("sorry, can't move this item up any further");
            return false;
        }
        
        container.swap(listbox.selectedItem.value, 
            listbox.selectedItem.previousSibling.value);
        container.save();
        this.makeUI(container.getStrings(), window, listboxID);
        
        return true;

    }
    ,
    moveAttackStringDown: function(){
        this.moveItemDown(getAttackStringContainer(), 'existingSQLIstrings');   
    }
    ,
    moveErrorStringDown: function(){
        this.moveItemDown(getErrorStringContainer(), 'existingSQLIerrStrings');
    }
    ,
    moveItemDown: function(container, listboxID){
        var listbox = document.getElementById(listboxID);

        if (listbox.selectedItems.length != 1){
            alert("sorry, only one item can be moved at a time");
            return false;
        }
        
        if (listbox.selectedItem.value == 
            (attackStringContainer.getStrings().length - 1) )
        {
            alert("sorry, can't move this item up any further");
            return false;
        }
        
        container.swap(listbox.selectedItem.value, 
                listbox.selectedItem.nextSibling.value);
        container.save();
        this.makeUI(container.getStrings(), window, listboxID);
        
        return true;
    }
};

