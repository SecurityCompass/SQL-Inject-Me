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
     * a reference to the nsIHttpChannel being used by this
     */
    this.channel = null;
    
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
    do_test: function(formPanel, formIndex, field, testData, resultsManager,
            tabIndex)
    {
        var mainBrowser = getMainWindow().getBrowser();
        var currentTab = mainBrowser.selectedTab;
        var wroteTabData = false;
        var tabManager = new TabManager();
        var self = this; //make sure we always have a reference to this object
        var formData = null;
        
        //var browser = mainBrowser.getBrowserAtIndex(tabIndex);
             
        this.formIndex = formIndex;
        this.fieldIndex = field.index;
        this.field = field;
        this.tabIndex = tabIndex;
        
        tabManager.readTabData(currentTab);
        
        if (field)
        {
            formData = tabManager.getFormDataForURL(mainBrowser.
                    contentDocument.forms,  formIndex, field.index, 
                    testData.string);
        }
        else 
        {
            formData = tabManager.getFormDataForURL(mainBrowser.
                    contentDocument.forms,  formIndex, null, testData.string);
        }
        this.testData = tabManager.getTabData(mainBrowser.
                    contentDocument.forms,  formIndex, field.index, testData.string);
        dump('\ndoing source test...');
        this.do_source_test(formIndex, formIndex, field, testData,
                resultsManager, mainBrowser,formData);
        
    }
    ,
    do_source_test:function(formPanel, formIndex, field, testData, resultsManager, 
            browser, formData) {
        var streamListener = new StreamListener(this, resultsManager);
        resultsManager.addSourceListener(streamListener);

        // the IO service
        var ioService = Components.classes['@mozilla.org/network/io-service;1']
                .getService(Components.interfaces.nsIIOService);
        var formURL = browser.contentDocument.URL;
        var form = browser.contentDocument.forms[formIndex];
        var formAction = form.action ? form.action : browser.contentDocument.
                location.toString();
                
        dump('AttackRunner::do_source_test  formAction=== '+formAction+'\n');
        if (form.method.toLowerCase() != 'post'){
            formAction += formAction.indexOf('?') === -1 ? '?' : '&';
            formAction += formData;
        } 
        
        dump('attackrunner::do_source_test::formAction == ' + formAction + '\n');
        dump('attackrunner::do_source_test::formData == ' + formData + '\n');
        
        var uri = ioService.newURI(formAction, null, null);
        var referingURI = ioService.newURI(formURL, null, null);
        this.channel = ioService.newChannelFromURI(uri);
        this.channel.QueryInterface(Components.interfaces.nsIHttpChannel).
                referrer = referingURI;
        
        if (form.method.toLowerCase() == 'post'){
            var inputStream = Components.
                    classes['@mozilla.org/io/string-input-stream;1'].
                    createInstance(Components.interfaces.nsIStringInputStream);
            inputStream.setData(formData, formData.length);
           this.channel.QueryInterface(Components.interfaces.nsIUploadChannel).
                    setUploadStream(inputStream, 
                    'application/x-www-form-urlencoded', -1);
           this.channel.QueryInterface(Components.interfaces.nsIHttpChannel).
                    requestMethod = 'POST';
        }
        
        var streamListener = new StreamListener(this, resultsManager);
        streamListener.testData = this.testData;
       this.channel.asyncOpen(streamListener, null);
    }
}

function callEvaluate(browser, attackRunner, resultsManager) {
    var results = resultsManager.evaluate(browser, attackRunner);
    for each (result in results){
        tabManager.addFieldData(result);
    }
    getTestRunnerContainer().freeTab(attackRunner.tabIndex);
}