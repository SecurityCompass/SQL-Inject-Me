/** 
 * AttackRunner.js
 * @requires ResultsManager
 * @requires TabManager
 * @requires AttackHttpResponseObserver
 */

/**
 * \class AttackRunner
 */
function AttackRunner(){

    this.className = "AttackRunner";
    
}

AttackRunner.prototype = {
    testData: null
    ,
    submitForm: function(tab, formIndex){
        dump('going to submit form in tab: ' + tab.nodeName + '\n');
        dump('the forms are: ' + tab.linkedBrowser.contentDocument.forms + 
                ' ' + tab.linkedBrowser.contentDocument.forms  + '\n');
        dump('dorons question: ' + 
                tab.linkedBrowser.contentDocument.getElementsByTagName('form').
                length + '\n');
        dump('tab.linkedBrowser.contentDocument.location.href == ' + 
                tab.linkedBrowser.contentDocument.location.href +
                '\n');
        var forms = tab.linkedBrowser.contentDocument.forms;
        var formFound = false;
        for (var i = 0; i < forms.length && !formFound; i++){
            if (i == formIndex){
                dump('submitting form ... ' + i + ' ' + (i == formIndex) + '\n');
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
    do_test: function(formPanel, formIndex, field, testValue, resultsManager){
        var mainBrowser = getMainWindow().getBrowser();
        var currentTab = mainBrowser.selectedTab;
        var workTab = null;
        var wroteTabData = false;
        var tabManager = new TabManager();
        var self = this; //make sure we always have a reference to this object
        
        dump('do_test::curentTab:' + currentTab + '\n');
        tabManager.readTabData(currentTab);
        dump('do_test... tabManager: ' + tabManager + '\n');
        workTab = mainBrowser.addTab('about:blank');
        workTab.linkedBrowser.webNavigation.stop(STOP_ALL);
        mainBrowser.selectedTab = currentTab; //make sure that the stab stays.
        
        setTimeout(afterWorkTabStopped, 10);
            
        function afterWorkTabStopped(event){
            dump('start afterWorkTabStopped\n');
            
            workTab.linkedBrowser.addEventListener('pageshow', 
                    afterWorkTabHasLoaded, false);            
            
            //this also moves worktab to the same page as the currentTab
            tabManager.writeTabHistory(workTab.linkedBrowser.webNavigation);
            
            dump('end afterWorkTabStopped\n');
        }
        
        function afterWorkTabHasLoaded(event) {
            dump('start afterWorkTabHasLoaded\n');
            
            //this will copy all the form data...
            if (field){
                tabManager.writeTabForms(workTab.linkedBrowser.contentDocument.
                        forms,  formIndex, field.index, testValue);
                
            }
            else {
                tabManager.writeTabForms(workTab.linkedBrowser.contentDocument.
                        forms,  formIndex, null, null);
                
            }
            self.testData = tabManager.getTabData(workTab.linkedBrowser.
                    contentDocument.forms,  formIndex, field.index);
            dump('attackRunner::testData == ' + this.testData + '\n');
            dump('tab data should be written now\n');
            
            workTab.linkedBrowser.removeEventListener('pageshow', 
                    afterWorkTabHasLoaded, false);
                    
            if (resultsManager)
            {
                workTab.linkedBrowser.addEventListener('pageshow', 
                        afterWorkTabHasSubmittedAndLoaded, false); 
                           
                //var observerService = Components.
                //        classes['@mozilla.org/observer-service;1'].
                //        getService(Components.interfaces.nsIObserverService);
                //
                //var attackHttpResponseObserver = 
                //        new AttackHttpResponseObserver(self, resultsManager);
                //
                //resultsManager.addObserver(self, attackHttpResponseObserver);
                //observerService.addObserver(attackHttpResponseObserver, 
                //        'http-on-examine-response', false);
                
            }
            var formGotSubmitted = self.submitForm(
                    workTab, formIndex);
            dump('end afterWorkTabHasLoaded '+ formGotSubmitted +'\n');
     
        }
        
        //this should fire only *after* the form has been sumbitted and the new
        //page has loaded.
        function afterWorkTabHasSubmittedAndLoaded(event){
            resultsManager.evaluate(workTab.linkedBrowser, self);
            mainBrowser.removeTab(workTab);
        }
        
    }
    
}