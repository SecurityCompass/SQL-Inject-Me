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
 * Based around a poor man's semphore concept.
 */
function TestRunnerContainer(currentNumTabs){
    this.testRunners = new Array(); //All these arrays are parallell
    this.formPanels = new Array();
    this.formIndexes = new Array();
    this.fields = new Array();
    this.testValues = new Array();
    this.resultsManagers = new Array();
    this.baseNumTabs = currentNumTabs;
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
        dump('TestRunnerContainer::start(): tabBrowser.mTabs.length < ' +
                '(this.baseNumTabs+numTabsToUse) && this.testRunners.' +
                'length !== 0 ====== ' + tabBrowser.mTabs.length + '< (' +
                this.baseNumTabs + '+' + numTabsToUse + ') && ' + 
                this.testRunners.length + '!== 0 ======== ' + (tabBrowser.mTabs.length < (this.baseNumTabs+numTabsToUse) &&
                this.testRunners.length !== 0) + '\n');
        if (tabBrowser.mTabs.length < (this.baseNumTabs+numTabsToUse) &&
            this.testRunners.length !== 0)
        {
            var testRunner = this.testRunners.pop();
            var formPanel = this.formPanels.pop();
            var formIndex = this.formIndexes.pop();
            var field = this.fields.pop();
            var testValue = this.testValues.pop();
            var resultsManager = this.resultsManagers.pop();
            
            testRunner.do_test(formPanel, formIndex, field, testValue, 
                    resultsManager);
            
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
    keepChecking: true
};

/**
 * If currentNumTabs is provided, the container is cleared.
 */
function getTestRunnerContainer(currentNumTabs){
    
    if (typeof(xssme__testrunnercontainer__) == 'undefined' || 
            !xssme__testrunnercontainer__ )
    {
        xssme__testrunnercontainer__ = new TestRunnerContainer(currentNumTabs);
        xssme__testrunnercontainer__.start();
    }
    
    if (currentNumTabs) {
        xssme__testrunnercontainer__.baseNumTabs = currentNumTabs;
        xssme__testrunnercontainer__.testRunners.splice(0, 
                xssme__testrunnercontainer__.testRunners.length);
        xssme__testrunnercontainer__.formPanels.splice(0, 
                xssme__testrunnercontainer__.formPanels.length);
        xssme__testrunnercontainer__.formIndexes.splice(0,
                xssme__testrunnercontainer__.formPanels.length);
        xssme__testrunnercontainer__.fields.splice(0,
                xssme__testrunnercontainer__.formPanels.length);
        xssme__testrunnercontainer__.testValues.splice(0,
                xssme__testrunnercontainer__.formPanels.length);
        xssme__testrunnercontainer__.resultsManagers.splice(0,
                xssme__testrunnercontainer__.formPanels.length);
 
    }
    
    return xssme__testrunnercontainer__;
    
}
