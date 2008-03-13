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
 * TestRunnerContainer.js
 */

/**
 * Based around a poor man's semaphore concept.
 */
function TestRunnerContainer(currentNumTabs){
    this.testRunners = new Array(); //All these arrays are parallell
    this.formPanels = new Array();
    this.formIndexes = new Array();
    this.fields = new Array();
    this.testValues = new Array();
    this.resultsManagers = new Array();
    this.baseNumTabs = currentNumTabs;
    this.testManager = null;
    this.keepChecking = true;
    this.tabs = null;
    
}

TestRunnerContainer.prototype = {
    addTestRunner: function(testRunner, formPanel, formIndex, field, 
            testValue, resultsManager)
    {
        this.testRunners.push(testRunner);
        this.formPanels.push(formPanel);
        this.formIndexes.push(formIndex);
        this.fields.push(field);
        this.testValues.push(testValue);
        this.resultsManagers.push(resultsManager);
    }
    ,
    start: function(){
        var self = this;
        var mainWindow = getMainWindow();
        var tabBrowser = mainWindow.document.getElementById('content');
        var numTabsToUse = this.getNumWorkTabs();
        var firstEmptyIndex = 0;
        var hasEmptyIndex = false;
        for (var index in this.tabs) {
                if (this.tabs[index] === null) {
                    hasEmptyIndex= true;
                    firstEmptyIndex = parseInt(index);
                    this.tabs[index] = true;
                    break;
                }
        }
        if (hasEmptyIndex === true && this.testRunners.length !== 0) {
            var testRunner = this.testRunners.pop();
            var formPanel = this.formPanels.pop();
            var formIndex = this.formIndexes.pop();
            var field = this.fields.pop();
            var testValue = this.testValues.pop();
            var resultsManager = this.resultsManagers.pop();
            
            testRunner.do_test(formPanel, formIndex, field, testValue, 
                    resultsManager, firstEmptyIndex+this.baseNumTabs);
            
        }
        else if (this.testRunners.length === 0) {
            this.keepChecking = false;
            this.testManager.doneTesting();
            
        }
        
        function doAgain(){
            self.start();
        }
        if (this.keepChecking === true) {
            setTimeout(doAgain, 1);
        }
    }
    ,
    numWorkTabs: 6
    ,
    getNumWorkTabs: function(){
        var prefService = Components.classes['@mozilla.org/preferences-service;1'].
                getService(Components.interfaces.nsIPrefService);
        var branch = prefService.getBranch('extensions.sqlime.');
        if (branch.prefHasUserValue('numtabstouse') ){
            return branch.getIntPref('numtabstouse');
        }
        else {
            return this.numWorkTabs;
        }
    }
    ,
    clear: function (){
        this.testRunners.splice(0, this.testRunners.length);
        this.formPanels.splice(0, this.formPanels.length);
        this.formIndexes.splice(0, this.formPanels.length);
        this.fields.splice(0, this.formPanels.length);
        this.testValues.splice(0, this.formPanels.length);
        this.resultsManagers.splice(0, this.formPanels.length);
    }
    ,
    setup: function(currentNumTabs, testManager) {
        this.baseNumTabs = currentNumTabs
        this.testManager = testManager;
        this.tabs = null;
        this.tabs = new Array();
        for (var i = 0; i < this.getNumWorkTabs(); i++){
            this.tabs[i] = null;
            getMainWindow().document.getElementById('content').addTab('about:blank');
        }
    }
    ,
    freeTab: function(tabIndex) {
        this.tabs[tabIndex-this.baseNumTabs] = null;
    }
    ,
    clearWorkTabs: function () {
        var oldIndex = getMainWindow().gBrowser.mTabContainer.selectedIndex;
        
        for (var i = this.getNumWorkTabs(); i > 0; i--) {
            var tab = getMainWindow().gBrowser.mTabs.item(this.baseNumTabs);
            getMainWindow().gBrowser.removeTab(tab);
            
        }
        
        getMainWindow().gBrowser.mTabContainer.selectedIndex = oldIndex;
    }
    ,
    /**
     * Stops the running of tests in the TestRunnerContainer.
     */
    stop: function(){
        this.keepChecking = false;
        this.clear();
    }
};

/**
 * If currentNumTabs is provided, the container is cleared.
 */
function getTestRunnerContainer(currentNumTabs, testManager){
    
    if (typeof(xssme__testrunnercontainer__) == 'undefined' || 
            !xssme__testrunnercontainer__ )
    {
        xssme__testrunnercontainer__ = new TestRunnerContainer(currentNumTabs);
    }
    
    if (currentNumTabs && testManager) {
        xssme__testrunnercontainer__.setup(currentNumTabs, testManager);
 
    }
    
    return xssme__testrunnercontainer__;
    
}
