/*
Copyright 2007 Security Compass

This file is part of SQL Inject Me.

SQL Inject Me is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

SQL Inject Me is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with SQL Inject Me.  If not, see <http://www.gnu.org/licenses/>.

If you have any questions regarding SQL Inject Me please contact
tools@securitycompass.com
*/

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
                if (elem.nodeName.toLowerCase() == 'submit' || elem.nodeName.toLowerCase() == 'reset' || elem.nodeName.toLowerCase() == 'image' || elem.nodeName.toLowerCase() == 'button')
                {
                    //this just keeps all the arrays parallell
                    this.tabForms[i].push(null);
                }
                else if (elem.nodeName.toLowerCase() == 'checkbox' || elem.nodeName.toLowerCase() == 'radio')
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
    writeTabForms: function(forms, testFormIndex, testFieldIndex, testData){
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
                    testData !== null
                   ) 
                {
                    dump('going to force element ' +element.name  +' ('+ elementIndex
                            +') to have value ' + testData+ '\n');
                    if(element.nodeName.toLowerCase() === 'select') {
                        var newOption = forms[formIndex].ownerDocument.createElement('option');
                        newOption.setAttribute('value', testData.string);
                        newOption.innerHTML = testData.string;
                        element.options[element.options.length] = newOption;
                        element.selectedIndex = element.options.length - 1;
                    }
                    else {
                        element.value = testData.string;
                    }
                    dump('element[' + elementIndex + '] has value' + 
                            element.value + ' \n');
                }
                else if (element.nodeName.toLowerCase() == 'submit' || 
                         element.nodeName.toLowerCase() == 'reset' || 
                         element.nodeName.toLowerCase() == 'image' || 
                         element.nodeName.toLowerCase() == 'button')
                {
                    // don't care, this is here just to make sure the elements 
                    // are parallel.
                } 
                else if (element.nodeName.toLowerCase() == 'checkbox' || 
                         element.nodeName.toLowerCase() == 'radio') 
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
    getTabData: function(forms, testFormIndex, testFieldIndex, testString){
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
            fieldInfo.data = (elementIndex == testFieldIndex && testString)?testString:element.value;
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
            testData)
    {
        var formIndex = testFormIndex;
        var rv = '';
        for (var elementIndex = 0; 
            elementIndex < forms[testFormIndex].elements.length; 
            elementIndex++)
        {
            var element = forms[testFormIndex].elements[elementIndex];
            if (elementIndex == testFieldIndex) {
                if (rv.length != 0){
                    rv+='&';
                }                
                rv += element.name +'='+testData;
            }
            if (element.value) {
                if (rv.length != 0){
                    rv+='&';
                }                
                rv += element.name +'='+element.value;
            }
        }
        return rv;
        
    }
};