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
 * AttackRunner.js
 * @requires ResultsManager
 * @requires TabManager
 * @requires AttackHttpResponseObserver
 */

/**
 * @class AttackRunner
 */
function AttackRunner(){

    this.className = "AttackRunner";
    /**
     * uniqueID is important for heuristic tests which need a random string in
     * order to find the char they sent
     */
    this.uniqueID = Math.floor(Date.now() * Math.random());
    
}

AttackRunner.prototype = {
    testData: null
    ,
    submitForm: function(browser, formIndex){
        var forms = browser.webNavigation.document.forms;
        var formFound = false;
        for (var i = 0; i < forms.length && !formFound; i++){
            if (i == formIndex){
                dump('submitting form ... ' + i + ' ' + (i == formIndex) + '\n');
                if (forms[i].target) forms[i].target = null;
                forms[i].submit();
                formFound = true;
            }
            //debug code..
            else {
                dump('this form is not it... ' + i + ' ' + (i == formIndex) + '\n');  
            }
        }
        return formFound;
    }
    ,
    do_test: function(formPanel, formIndex, field, testValue, resultsManager,
            tabIndex)
    {
        var mainBrowser = getMainWindow().getBrowser();
        var currentTab = mainBrowser.selectedTab;
        var wroteTabData = false;
        var tabManager = new TabManager();
        var self = this; //make sure we always have a reference to this object
        var browser = mainBrowser.getBrowserAtIndex(tabIndex);
             
        this.testValue = testValue;
        this.formIndex = formIndex;
        this.fieldIndex = field.index;
        this.field = field;
        browser.webNavigation.stop(Components.interfaces.nsIWebNavigation.STOP_ALL);

        tabManager.readTabData(currentTab);
        setTimeout(function() {afterWorkTabStopped()}, 10);
        
        function afterWorkTabStopped(){
            browser.addEventListener('pageshow',
                    afterWorkTabHasLoaded, false);
            
            //this also moves worktab to the same page as the currentTab
            var count = currentTab.linkedBrowser.sessionHistory.count;
            if (count) {
                var currentEntry = currentTab.linkedBrowser.sessionHistory.getEntryAtIndex((count-1), false);
                var postData = null;
                if (currentEntry.postData) {
                    var postDataStream = Components.classes["@mozilla.org/scriptableinputstream;1"].
                            createInstance(Components.interfaces.nsIScriptableInputStream);
                    
                    postDataStream.init(currentEntry.postData);
                    
                    while (true) {
                        var foo = postDataStream.read(512);
                        if (foo) {
                            postData += foo;
                        }
                        else {
                            break;
                        }
                    }
                }
                
                browser.webNavigation.loadURI(currentEntry.URI.spec, 0, (currentEntry.referrerURI?currentEntry.referrerURI:null), postData, null); 
            }
            else {
                browser.webNavigation.loadURI(currentTab.linkedBrowser.webNavigation.currentURI.spec, 0, null, null, null);
            }
            
        }
        
        function afterWorkTabHasLoaded(event) {
            dump('start afterWorkTabHasLoaded\n');
            var formData = null;
            browser.removeEventListener('pageshow', 
                    afterWorkTabHasLoaded, false);
            
            var loadSuccessful = compareContentDocuments(currentTab.linkedBrowser.contentDocument, browser.contentDocument)
            
            if (loadSuccessful === false) {
                getTestManager().cannotRunTests();
                return
            }

            //this will copy all the form data...
            try { 
                if (field)
                {
                    tabManager.writeTabForms(browser.contentDocument.
                            forms,  formIndex, field.index, testValue);
                    formData = tabManager.getFormDataForURL(browser.
                            contentDocument.forms,  formIndex, field.index, 
                            testValue);
                }
                else 
                {
                    tabManager.writeTabForms(browser.contentDocument.
                            forms,  formIndex, null, null);
                    formData = tabManager.getFormDataForURL(browser.
                            contentDocument.forms,  formIndex, null, null);
                }
            }
            catch(e) {
                Components.utils.reportError(e + " " + (browser.webNavigation.currentURI?browser.webNavigation.currentURI.spec:"null"))
            }
            dump('AttackRunner::afterWorkTabHasLoaded  testValue===' + testValue + '\n');


            self.testData = tabManager.getTabData(browser.
                    contentDocument.forms,  formIndex, field.index);
            dump('attackRunner::testData == ' + this.testData + '\n');
            dump('tab data should be written now\n');
            
            if (window.navigator.platform.match("win", "i")) {
                browser.addEventListener('pageshow', 
                        afterWorkTabHasSubmittedAndLoaded, false);
            }
            else {
                setTimeout(function(){browser.addEventListener('pageshow', 
                        afterWorkTabHasSubmittedAndLoaded, false)}, 1);
            }
                    
            if (resultsManager)
            {
                browser.addEventListener('pageshow', 
                        afterWorkTabHasSubmittedAndLoaded, false); 
                           
                var observerService = Components.
                        classes['@mozilla.org/observer-service;1'].
                        getService(Components.interfaces.nsIObserverService);

                var attackHttpResponseObserver = 
                        new AttackHttpResponseObserver(self, resultsManager);

                resultsManager.addObserver(attackHttpResponseObserver);
                observerService.addObserver(attackHttpResponseObserver, 
                        AttackHttpResponseObserver_topic, false);
                
            }
            var formGotSubmitted = self.submitForm(
                    browser, formIndex);
            dump('end afterWorkTabHasLoaded '+ formGotSubmitted +'\n');
     
        }
        
        //this should fire only *after* the form has been sumbitted and the new
        //page has loaded.
        function afterWorkTabHasSubmittedAndLoaded(event){
            browser.removeEventListener('pageshow', afterWorkTabHasSubmittedAndLoaded, false);
            //var foo = "event = {";
            //for (var key in event) {
            //    foo += key + "=>" + event[key] + ";"
            //} 
            //foo += "}"
            
            var results = resultsManager.evaluate(event.currentTarget, self);
            for each (result in results){
                tabManager.addFieldData(result);
            }
            getTestRunnerContainer().freeTab(tabIndex);
            
        }
        
    }
    
}