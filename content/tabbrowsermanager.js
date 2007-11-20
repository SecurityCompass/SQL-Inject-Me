/** 
 * tabbrowsermanager.js
 * Much of this system relies on working with the tab browser. This file 
 * encapsulates all that functionality.
 */
 
function TabManager(){
    this.tabForms = null;
    this.tabHistory = null;
    this.index = 10;
}

TabManager.prototype = {
    readTabData: function(tab){
        this.tabForms = new Array();
        
        this.readTabHistory(tab.linkedBrowser.webNavigation.sessionHistory);
        this.readTabForms(tab.linkedBrowser.docShell.document.forms);
        this.index = tab.linkedBrowser.webNavigation.sessionHistory.index;
        dump('got an history index of : ' + this.index + '\n');
    }
    ,
    readTabHistory: function(sessionHistory){
        this.tabHistory = new Array();
        for (var i = 0; i < sessionHistory.count; i++){
            dump('copying history: ' + sessionHistory.getEntryAtIndex(i, false).URI + '  ' + sessionHistory.getEntryAtIndex(i, false).title + '\n');
            this.tabHistory.push(sessionHistory.getEntryAtIndex(i, false));
        }
    }
    ,
    readTabForms: function(forms){
        this.tabForms = Array();
           
        for (var i = 0; i < forms.length; i++)
        {
            this.tabForms[i] = new Array();
            for (var j = 0; j < forms[i].elements.length; j++)
            {
                var elem = forms[i].elements[j];
                if (elem.nodeType == 'submit' || elem.nodeType == 'reset' || elem.nodeType == 'image' || elem.nodeType == 'button')
                {
                    //this just keeps all the arrays parallell
                    this.tabForms[i].push(null);
                }
                else if (elem.nodeType == 'checkbox' || elem.nodeType == 'radio')
                {
                    this.tabForms[i].push(elem.checked);
                }
                else
                {
                    this.tabForms[i].push(elem.value);
                }
            }
        }
    }
    ,
    hasTabData: function (){
        return ( (this.tabForms !== null && this.tabHistory !== null) &&
                 (this.tabForms.length !== 0 || this.tabHistory.length !== 0) )
    }
    ,
    writeTabHistory: function(webNavigation){
        dump('starting tabbrowsermanager::writeTabHistory\n');
        var sessionHistory = webNavigation.sessionHistory;
        if (this.tabHistory && this.tabHistory.length > 0){
            sessionHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);
            if (sessionHistory.count > 0){
                sessionHistory.PurgeHistory(sessionHistory.count);
            }
            for each(var historyItem in this.tabHistory){
                dump('copying history: ' + historyItem.URI + '  ' + historyItem.title + '\n;');
                sessionHistory.addEntry(historyItem, true);
            }
            try {
                webNavigation.gotoIndex(this.index);
            }
            catch(err){
                dump('failed a go to index ' + err + '\n');   
            }
        }
        dump('stopping tabbrowsermanager::writeTabHistory\n');
    }
    ,
    writeTabForms: function(forms, testFormIndex, testFieldIndex, testValue){
        dump('-=-=-=-writeTabForms::forms ' + forms[0]); 
        if (forms[testFormIndex] === undefined){
            dump('got an undefined\n');   
        }
        dump('&& and the test form is : '+forms[testFormIndex]+ ' with '+
                forms[testFormIndex].elements.length+'elements\n');
        for (var formIndex = 0;
             formIndex < forms.length;
             formIndex++)
        {
            for (var elementIndex = 0; 
                 elementIndex < forms[formIndex].elements.length; 
                 elementIndex++)
            {
                var element = forms[formIndex].elements[elementIndex];
                dump('checking whether this field ('+formIndex + ',' +elementIndex +')should be loaded with an evil value: ' + (formIndex === testFormIndex && elementIndex === testFieldIndex) + '\n');
                if (formIndex !== null && 
                    formIndex === testFormIndex && 
                    elementIndex === testFieldIndex &&
                    testValue !== null
                   ) 
                {
                    dump('going to force element ' +element.name  +' ('+ elementIndex
                            +') to have value ' + testValue+ '\n');
                    element.value = testValue.string;
                    dump('element[' + elementIndex + '] has value' + 
                            element.value + ' \n');
                }
                else if (element.nodeType == 'submit' || 
                         element.nodeType == 'reset' || 
                         element.nodeType == 'image' || 
                         element.nodeType == 'button')
                {
                    // don't care, this is here just to make sure the elements 
                    // are parallel.
                } 
                else if (element.nodeType == 'checkbox' || 
                         element.nodeType == 'radio') 
                {
                    element.checked = this.tabForms[formIndex][elementIndex];
                }
                else {
                    element.value = this.tabForms[formIndex][elementIndex];
                }
            }
        }
    }
    ,
    getTabData: function(forms, testFormIndex, testFieldIndex){
        dump('writeTabForms::forms ' + forms[0] + '\n');
        var rv = new Array();
        var formIndex = testFormIndex;
    
        for (var elementIndex = 0; 
            elementIndex < forms[formIndex].elements.length; 
            elementIndex++)
        {
            var element = forms[formIndex].elements[elementIndex];
            var fieldInfo = new Object();
            fieldInfo.name = element.name;
            fieldInfo.data = element.value;
            fieldInfo.tested = (elementIndex == testFieldIndex);
            rv.push(fieldInfo);
        }
        return rv;
    }
    ,
    writeTabData: function(tab){
        this.writeTabHistory(tab.linkedBrowser.webNavigation);
        dump('writting tab data... tab.linkedBrowser.webNavigation  == ' + tab.linkedBrowser.webNavigation + '\n');
        dump('tab.linkedBrowser.docShell.document.forms == ' + tab.linkedBrowser.contentDocument.forms + '\n');
        
        this.writeTabForms(tab.linkedBrowser.contentDocument.forms );
       
    }
    ,
    /**
     * This returns the data in a form 
     */
    getFormDataForURL: function(forms, testFormIndex, testFieldIndex, 
            testValue)
    {
        dump('getFormDataForURL::forms forms['+testFormIndex|']==' + forms[testFormIndex] + '\n');
        var formIndex = testFormIndex;
        var rv = '';
        for (var elementIndex = 0; 
            elementIndex < forms[testFormIndex].elements.length; 
            elementIndex++)
        {
            var element = forms[testFormIndex].elements[elementIndex];
            if (element.value) {
                if (rv.length != 0){
                    rv+='&';
                }                
                rv += element.name +'='+element.value;
            }
        }
        dump('tabbrowsermanager::getFormDataForURL returns: ' + rv + '\n');
        return rv;
        
    }
};