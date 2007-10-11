/* prefereneces.js 
 * Requires JSON
 * Requires AttackStringContainer
 */
//alert('ran js');

function PreferencesController() {
    this.init();
}

PreferencesController.prototype = {
    init: function(){
        getAttackStringCointainer();
        
        var attacks = attackStringContainer.getAttacks();
        if (attacks.length) {
            this.makeUI(attacks);
        }
        else {
            var label = document.getElementById('noattackslbl');
            label.style.visibility = 'visible';
        }
    }
    ,
    makeUI: function(attacks, aWindow){
        var theWindow
        if (typeof(aWindow) === 'undefined' || !aWindow){
            theWindow = window;
        }
        else {
            theWindow = aWindow;
        }
        
        var listbox = theWindow.document.getElementById('existingSQLIstrings');
        
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
    removeAttack: function(){
        var listbox = document.getElementById('existingSQLIstrings');
        var selectedAttacks = listbox.selectedItems;
        getAttackStringCointainer();
        var attacks = attackStringContainer.getAttacks();
        for (var i = 0; i < selectedAttacks.length; i++){
            attacks[selectedAttacks[i].value] = null;
        }
        var n = 0;
        while (n < attacks.length){
            if (attacks[n] === null){
                attacks.splice(n, 1);
            }
            else{
                n++; //only incrememnt if attacks[n]!==null. Otherwise we'll 
                     // strings which are adjacent.
            }
        }
        attackStringContainer.save();
        this.makeUI(attackStringContainer.getAttacks());
    }
    ,
    exportAttacks: function(){
        var exportDoc = document.implementation.createDocument("", "", null);
        var root = exportDoc.createElement('exportedattacks');
        var xmlAttacks = exportDoc.createElement('attacks');
        getAttackStringCointainer();
        var attacks = attackStringContainer.getAttacks();
        for each (var attack in attacks){
            var xmlAttack = exportDoc.createElement('attack');
            var xmlString = exportDoc.createElement('attackString');
            var xmlSig = exportDoc.createElement('signature');
            var txtString = exportDoc.createTextNode(attack.string);
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
        var attackStringContainer = getAttackStringCointainer();
        
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
                    this.makeUI(attackStringContainer.getAttacks(), window); // just in case.
                    return false;
                }
                else{
                    if (sigTag.childNodes.length === 1 && 
                        stringTag.childNodes.length === 1 &&
                        sigTag.firstChild.nodeName === '#text' && 
                        stringTag.firstChild.nodeName === '#text')
                    {
                        
                        attackStringContainer.addAttack(
                            stringTag.firstChild.nodeValue,
                            sigTag.firstChild.nodeValue);
                    }
                    else {
                        alert("Couldn't import attack. attackString or signature tag does not have just one text node. Error while processing the document. ");
                        this.makeUI(attackStringContainer.getAttacks(), window); // just in case.
                        return false;
                    }
                }
            }
        }
        else {
            alert("Couldn't find any attacks. No Attacks imported.");
            return false;            
        }
        this.makeUI(attackStringContainer.getAttacks(), window);
        return true;
    }
    ,
    moveItemUp: function(){
        var listbox = document.getElementById('existingSQILstrings');
        var attackStringContainer = getAttackStringCointainer();

        if (listbox.selectedItems.length != 1){
            alert("sorry, only one item can be moved at a time");
            return false;
        }
        
        if (listbox.selectedItem.value == 0){
            alert("sorry, can't move this item up any further");
            return false;
        }
        
        attackStringContainer.swap(listbox.selectedItem.value, 
            listbox.selectedItem.previousSibling.value);
        attackStringContainer.save();
        this.makeUI(attackStringContainer.getAttacks(), window);
        
        return true;

    }
    ,
    moveItemDown: function(){
        var listbox = document.getElementById('existingSQLIstrings');
        var attackStringContainer = getAttackStringCointainer();

        if (listbox.selectedItems.length != 1){
            alert("sorry, only one item can be moved at a time");
            return false;
        }
        
        if (listbox.selectedItem.value == 
            (attackStringContainer.getAttacks().length - 1) )
        {
            alert("sorry, can't move this item up any further");
            return false;
        }
        
        attackStringContainer.swap(listbox.selectedItem.value, 
            listbox.selectedItem.nextSibling.value);
        attackStringContainer.save();
        this.makeUI(attackStringContainer.getAttacks(), window);
        
        return true;
    }
};

