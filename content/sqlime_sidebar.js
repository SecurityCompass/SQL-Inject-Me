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
 * Sidebar.js
 * @requires AttackRunner.js
 */

/**
 * These constants are used as ids for the types of test we can run.
 */
const TestType_AllTestsForForm = 1;
const TestType_PrefNumTestsForForm = 2;
const TestType_OneTestForForm = 3;
const TestType_AllTestsForAllForms = 4;

const STOP_ALL = Components.interfaces.nsIWebNavigation.STOP_ALL;
 
/**
 * get a reference to the main firefox window
 */
function getMainWindow(){
    var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIWebNavigation)
            .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
            .rootTreeItem
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindow);
    return mainWindow;
}

/**
 * get a reference to the document object of the page that is being viewed now
 */
function getMainHTMLDoc(){
    var mainWindow = getMainWindow();
    var elTabBrowser = mainWindow.document.getElementById('content');
    var currentDocument = elTabBrowser.contentDocument;
    return currentDocument;
}
 
function extension(){
    //do nothing right now...
    this.plistener = null;
    this.warningDialog = null;
    this.typeAheadSound = true; //default for 
}

extension.prototype = {
    getTestType: function(){
        var tabbox = document.getElementById('sidebarformtabbox');
        // id="type" is not document unique, but it is unique in a panel.
        var typeOfTest = tabbox.selectedPanel.
                getElementsByAttribute('class', 'TestType').item(0).
                selectedItem.value;
        dump('getting the type of test: ' + typeOfTest + '\n');
        var rv = -1;
        var testTypeInfo = new Object();
        testTypeInfo.type = typeOfTest;
        if (typeOfTest == TestType_AllTestsForForm) {
            testTypeInfo.count = getAttackStringContainer().getStrings().length;
        }
        else if (typeOfTest == TestType_PrefNumTestsForForm) {
            var numAttacks = getAttackStringContainer().getStrings().length;
            var preferedNumAttacks = this.getPreferredNumberOfAttacks();
            
            testTypeInfo.count = (preferedNumAttacks > numAttacks) ? numAttacks : preferedNumAttacks;
        }
        else if (typeOfTest == TestType_OneTestForForm) { 
            testTypeInfo.count = 1;
        }
        return testTypeInfo;
        
    }
    ,
    getFieldsToTest:function(formPanel, all) {
        var fieldUIs = formPanel.getElementsByAttribute('class', 'nolabel');
        var fieldsToTest = new Array();
        
        for(var i =0; i < fieldUIs.length; i++){
            if (fieldUIs[i].checked || all === true){
                var fieldToTest = new Object();
                fieldToTest.index = parseInt(fieldUIs[i].getAttribute('formElementIndex'));
                fieldsToTest.push(fieldToTest);
            }
        }
        return fieldsToTest;
    }
    ,
    run_tests: function(event){
        
        var canRunTests = this.preTest();
        
        if (canRunTests == false) {
            alert('Could not run tests because tests are already running.');
            return ;
        }
        
        var buttonClicked = event.explicitOriginalTarget;
        dump('have button (' + buttonClicked + ') with className ' + 
                buttonClicked.className + ' and id ' + buttonClicked.id + '\n');
        
        var resultsManager = new ResultsManager(this);
        resultsManager.addEvaluator(checkForErrorString);
        
        if (buttonClicked.className && buttonClicked.className === 'run_form_test'){
            var testType = this.getTestType();
            var formPanel = document.getElementById('sidebarformtabbox').
                    selectedPanel;
            var formIndex = document.getElementById('sidebarformtabbox').
                    selectedIndex;
            var fieldsToTest = this.getFieldsToTest(formPanel);
            
            dump('going to test ' + testType.count + ' fields of ' + 
                    fieldsToTest + '\n');
            if (testType.type == TestType_AllTestsForForm || 
                testType.type == TestType_PrefNumTestsForForm)
            
            {
                if (testType.count > 0){
                    for each (var field in fieldsToTest) {
                        for (var testIndex = 0; 
                             testIndex < testType.count; 
                             testIndex++)
                        {
                            
                            var testValue = getAttackStringContainer().
                                    getStrings()[testIndex];
                            var testRunner = new AttackRunner();
                            
                            
                            dump('running test on field ' + field.index + 
                                    ' with value ' + testValue + '\n');
                            
                            resultsManager.registerAttack(testRunner);
                            
                            getTestRunnerContainer().addTestRunner(testRunner,
                                    formPanel, formIndex, field, testValue, 
                                    resultsManager);
                            
                        }
                    }
                    resultsManager.showResults();
                }
            }
        }
        else if (buttonClicked.id === 'test_all_forms_with_all_attacks') {
                var tabbox = document.getElementById('sidebarformtabbox');
                var htmlDoc = getMainHTMLDoc();
                var numberOfForms = htmlDoc.forms.length;
                var numberOfTests = getAttackStringContainer().getStrings().
                        length;
                
                for (var formIndex = 0; formIndex < numberOfForms; formIndex++){
                    tabbox.selectedIndex = formIndex;
                                        
                    dump('test_all_forms_with_all_attacks: going to test ' + numberOfTests + '\n');
                    var fieldsToTest = this.getFieldsToTest(tabbox.selectedPanel, true);
                    
                    for each(var field in fieldsToTest)
                    {
                        
                        for (var testIndex = 0; 
                            testIndex < numberOfTests; 
                            testIndex++)
                        {
                            
                            var testValue = getAttackStringContainer().
                                    getStrings()[testIndex];
                            var testRunner = new AttackRunner();
                            
                            dump('running test on field ' + field.index 
                                    + ' with value ' + testValue + '\n');
                            
                            resultsManager.registerAttack(testRunner);
                            
                            getTestRunnerContainer().addTestRunner(testRunner,
                                    tabbox.selectedPanel, formIndex, field, testValue, 
                                    resultsManager);
                            
                        }
                    }
                    
                }
                
                resultsManager.showResults();
                
        }
        else if (buttonClicked.id === 'test_all_forms_with_top_attacks') {
                var tabbox = document.getElementById('sidebarformtabbox');
                var htmlDoc = getMainHTMLDoc();
                var numberOfForms = htmlDoc.forms.length;
                var numberOfTests = this.getPreferredNumberOfAttacks();
                
                for (var formIndex = 0; formIndex < numberOfForms; formIndex++){
                    tabbox.selectedIndex = formIndex;
//                     var fieldsToTest = this.getFieldsToTest(tabbox.selectedPanel);
                    
                    dump('test_all_forms_with_top_attacks: going to test ' + numberOfTests + '\n');
//                     dump('fields of ' + typeof(fieldsToTest)+ '\'\n');
                    dump('test_all_forms_with_top_attacks: htmlDoc.forms[formIndex].elements.length = ' + htmlDoc.forms[formIndex].elements.length + '\n');
                    var fieldsToTest = this.getFieldsToTest(
                            tabbox.selectedPanel, true);
                    for each (var field in fieldsToTest) {
                        
                        dump('test_all_forms_with_top_attacks: numberOfTests == ' + numberOfTests + '\n');
                        
                        for (var testIndex = 0; 
                        testIndex < numberOfTests; 
                        testIndex++)
                        {
                            
                            var testValue = getAttackStringContainer().
                                    getStrings()[testIndex];
                            var testRunner = new AttackRunner();
                            
                            dump('running test on field ' + field.index + ' with value ' + testValue + '\n');
                            
                            resultsManager.registerAttack(testRunner);
                            
                            getTestRunnerContainer().addTestRunner(testRunner,
                                    formPanel, formIndex, field, testValue, 
                                    resultsManager);

                        }
                    }
                    
                }
                
                resultsManager.showResults();

        }
        dump('do we have results?' + resultsManager.hasResults()+'\n');
//         if (resultsManager.hasResults()){
//             resultsManager.showResults();
//         }
    }
    ,
    createActionUI: function() {
        var box = document.createElement('hbox');
        var menulist = document.createElement('menulist');
        var menupopup = document.createElement('menupopup');
        var runTests_mi = document.createElement('menuitem');
        var runTopTests_mi = document.createElement('menuitem');
        var submitThisForm_mi = document.createElement('menuitem');
        var button = document.createElement('button');
        var rv = new Object();
     
        rv.menuitems = [];
     
        runTests_mi.setAttribute('label', "Run all tests");
        runTests_mi.setAttribute('value', TestType_AllTestsForForm);
        runTopTests_mi.setAttribute('label', "Run top " + this.
                getPreferredNumberOfAttacks() + " tests");
        runTopTests_mi.setAttribute('value', TestType_PrefNumTestsForForm);
        
        submitThisForm_mi.setAttribute('value', TestType_OneTestForForm);
        
        rv.menuitems.push(runTests_mi);
        rv.menuitems.push(runTopTests_mi);
     
         //menulist.setAttribute("editable", false);
        rv.menupopup= menupopup;
     
        button.setAttribute('label', "Execute");
        button.setAttribute('command', 'sqlime_do_test');
        button.className = 'run_form_test';
        
        menulist.setAttribute('class', 'TestType');
        rv.menulist = menulist;
        
        
        rv.button = button;
     
        rv.box = box;
     
        return rv;
    }
    ,
    syncSidebarToForm: function(sidebarElement, formElement){
        
                        
        var assignSidebarValueToFormElement = function(event){
            formElement.value=sidebarElement.value.toString();
        }
                        
        var assignFormElementValueToSideBar =  function(event){
            sidebarElement.value = formElement.value.toString();
        }
                        
        formElement.addEventListener('keypress', 
                assignFormElementValueToSideBar, true);
        formElement.addEventListener('mouseup', 
                assignFormElementValueToSideBar, true);
        formElement.addEventListener('change', 
                assignFormElementValueToSideBar, true);
        sidebarElement.addEventListener('input', 
                assignSidebarValueToFormElement, true);
        sidebarElement.addEventListener('click', 
                assignSidebarValueToFormElement, true);
                
                           
    }
    ,
    do_generate_form_ui: function() {
        var q = 0;
        var maindoc = getMainWindow().document.getElementById('content').contentDocument;
        var box = document.getElementById('sqlime_here_be_tabs');
        var docforms = maindoc.getElementsByTagName('form');
        var unnamedFormCounter = 0; //used for generating the unnamed form names 
        var tabbox = document.createElement('tabbox');
        var tabs = document.createElement('tabs');
        var tabpanels = document.createElement('tabpanels');
        var fieldsLabel = document.createElement('label');
        fieldsLabel.setAttribute('value', "These are the fields in this form:");
        
        tabbox.setAttribute('id', 'sidebarformtabbox');
        //we only want to put things in a clean box.
        if (box.childNodes.length !== 0){
            for (var i = 0; i < box.childNodes.length; i++){
                box.removeChild(box.childNodes[i]);
            }
        }
        
        // create the form UI
        // Note that the addition of the DOM is seperated from the creation of 
        // it in the hopes that it will make for a faster overall operation 
        // even though it does require a bit more work in the code. This is 
        // based on Mossop(David Townshed)'s advice.
        if (maindoc.forms.length !== 0){
            var attackStringContainer = getAttackStringContainer();
            attackStringContainer.init();
            
            var newTabs = [];
            var newTabForms= [];
            var newTabPanels = [];
            var newTabActions = [];
            var newTabPanelVbox = [];
            
            for (var i = 0; i < maindoc.forms.length; i++){
            
                var aForm = maindoc.forms[i];
                var formname = null;
                var formPanel = document.createElement("tabpanel");
                var fieldsWithUI = new Object();
                
                var formTab = document.createElement("tab");
                
                dump(q++ + "\n");
                
                // Since the name attribute is deprecated for the form tag we first 
                // check the id attribute, then the name attribute and then consider
                // it unnamed.
                if (aForm.id){
                    formname = aForm.id;
                }
                else if (aForm.name){ 
                    formname = aForm.name;
                }
                else {
                    formname = "Unnamed form " + (++unnamedFormCounter);
                }
                
                formTab.setAttribute("label", formname);
                
                dump('aForm.elements.length: ' + aForm.elements.length +'\n');
                
                //iterate through the forms and generate the DOM.
                if (aForm.elements.length !== 0){
                    for (var n = 0; n < aForm.elements.length; n++){
                        var sidebarElement = null;
                        dump('aForm.elements[' + n + '] = ' +aForm.elements[n] + 
                                '- ' + aForm.elements[n].id +'\n');
                        if (aForm.elements[n].name){
                            sidebarElement = 
                                    fieldsWithUI[aForm.elements[n].name] =
                                    createFieldUI(aForm.elements[n], n);
                        }
                        else if (aForm.elements[n].id){
                            sidebarElement =
                                    fieldsWithUI[aForm.elements[n].id] =
                                    createFieldUI(aForm.elements[n], n );
                        }
                        else {
                            sidebarElement = 
                                    fieldsWithUI["form" + n + "_"+ 
                                    Math.round(Math.random() * 10000000)] =
                                    createFieldUI(aForm.elements[n], n);
                        }
                        sidebarElement = sidebarElement.getElementsByAttribute('editable', 'true')[0];
                        this.syncSidebarToForm(sidebarElement, aForm.elements[n]);
                        

                    }
                    
                     
                            
                }
                
                var actionButtons = this.createActionUI();
                newTabs.push(formTab);
                newTabForms.push(fieldsWithUI);
                newTabPanels.push(formPanel);
                newTabActions.push(actionButtons);
                newTabPanelVbox.push(document.createElement("vbox"));
            
            }
            
            //Add the form UI to the DOM.
            for (var i =0; i < newTabs.length; i++) {
                newTabPanelVbox[i].appendChild(fieldsLabel.cloneNode(true));
                for each(var fieldUI in newTabForms[i]) {
                    dump(q++ + 'appending ui :' + fieldUI + '\n');
                    newTabPanelVbox[i].appendChild(fieldUI);
                }
                
                for each(var mi in newTabActions[i].menuitems){
                    newTabActions[i].menupopup.appendChild(mi);
                }
                newTabActions[i].menulist.appendChild(newTabActions[i].
                        menupopup);
                
                newTabActions[i].box.appendChild(newTabActions[i].menulist);
                newTabActions[i].box.appendChild(newTabActions[i].button);
                newTabPanelVbox[i].appendChild(newTabActions[i].box);
                newTabPanels[i].appendChild(newTabPanelVbox[i]);
                tabs.appendChild(newTabs[i]);
                tabpanels.appendChild(newTabPanels[i]);
            }
            
            tabbox.appendChild(tabs);
            tabbox.appendChild(tabpanels);
            
        }
        else {
            
            var noformPanel = document.createElement("tabpanel");
            var noformTab = document.createElement("tab");
            var labelinpanel = document.createElement("label");
            var noformPanelVbox = document.createElement("vbox");
            
            labelinpanel.setAttribute("value", "Sorry, this page has no forms.");
            
            noformTab.setAttribute("label", "No Forms");
            
            noformPanelVbox.appendChild(labelinpanel);
            
            noformPanel.appendChild(noformPanelVbox);
            
            tabs.appendChild(noformTab);
            
            tabpanels.appendChild(noformPanel);
            
            tabbox.appendChild(tabs);
            tabbox.appendChild(tabpanels);
            
        }
        
        tabbox.setAttribute('flex', 1);
        
        box.appendChild(tabbox);
        
    }
    ,
    addAllMainWindowEventListeners: function() {
        
        var mainWindow = getMainWindow();
        var ourCaller = this;
        this.windowEventClosure = function(){ourCaller.do_generate_form_ui()};
        mainWindow.getBrowser().tabContainer.
                addEventListener("TabSelect", 
                this.windowEventClosure, false);
        
        this.plistener = new sqlimeProgressListener(
            this.windowEventClosure);
        
        mainWindow.document.getElementById('content').
                addProgressListener(this.plistener,
                Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
        
    }
    ,
    removeAllMainWindowEventListeners: function (){
        var mainWindow = getMainWindow();
        
        mainWindow.document.getElementById('content').
                removeProgressListener(this.plistener);
                
        mainWindow.removeEventListener('TabSelect', this.windowEventClosure, false);
        this.windowEventClosure = null;
        
    }
    ,
    getPreferredNumberOfAttacks: function(){
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].
            getService(Components.interfaces.nsIPrefService);
        var branch = prefs.getBranch("extensions.sqlime.");
        return branch.getIntPref("prefnumattacks");   
    }
    ,
    /**
     * This function holds code that is general for any time we want to do a
     * test
     */
    preTest: function() {
        var rv = false;
        if (this.warningDialog === null){
            rv = true;
            var testRunnerContainer = getTestRunnerContainer(getMainWindow().
                    document.getElementById('content').mTabs.length);
            
            if (testRunnerContainer.keepChecking === false){
                testRunnerContainer.keepChecking = true;
                testRunnerContainer.start(); // if keepChecking is true than we
                                             // it's already started
            }
            
            this.warningDialog = window.openDialog(
                    'chrome://sqlime/content/whiletestruns.xul',
                    'whiletestruns',
                    'chrome,dialog,dependant=yes');
            
            var prefService = Components.
                    classes['@mozilla.org/preferences-service;1'].
                    getService(Components.interfaces.nsIPrefService);

            var branch = prefService.getBranch('dom.');
            if (branch.prefHasUserValue('max_chrome_script_run_time')) {
                this.originalMaxChromeScriptRunTime = branch.
                        getIntPref('max_chrome_script_run_time');
            }
            else {
                this.originalMaxChromeScriptRunTime = null
            }
                    
            branch.setIntPref('max_chrome_script_run_time', 0);
            //disables the "script ran too long alert
            
            branch = prefService.getBranch('accessibility.typeaheadfind.');
            if (branch.prefHasUserValue('enablesound')) {
                this.typeAheadSound = branch.getBoolPref('enablesound');
            }
            branch.setBoolPref('enablesound', false);
            
        }
        return rv;
        
    }
    ,
    postTest: function(){
        this.warningDialog.close();
        this.warningDialog = null;
        var prefService = Components.
                    classes['@mozilla.org/preferences-service;1'].
                    getService(Components.interfaces.nsIPrefService);
            
        var branch = prefService.getBranch('dom.');
        if (this.originalMaxChromeScriptRunTime !== null) {
            branch.setIntPref('max_chrome_script_run_time', this.
                    originalMaxChromeScriptRunTime);
        }
        else {
            branch.clearUserPref('max_chrom_script_run_time');
        }
        branch = prefService.getBranch('accessibility.typeaheadfind.');
        branch.setBoolPref('enablesound', this.typeAheadSound);
        
    }
 }

 
/**
 * This function takes a form returns an associative array (Object object) of 
 * field name => field UI pairs (with the UI being appropriate for plugging
 * into a tabpanel for display. Recursive.
 * @param form a form
 * @param fields 
 * @returns an associative array (Object) of field name => field UI pairs
 */
function getFormFieldsUI(aForm, allFields) {
    var fields = allFields ? allFields : new Object();
    
    for (var child in aForm.elements){
        dump('examining child: ' + child + " " + child.nodeName+"\n");
        if (isFormField(child)){
            if (!fields[child.name]){   //We don't want a million option UIs
                                        // even if there are a million
                                        // options
                var childUI = createFieldUI(child);
                fields[child.name] = childUI;
            }
            dump(child.nodeName + "is a form field\n");
        }
        else {
            dump(child.nodeName + "is NOT a form field\n");
            fields = getForFieldsUI(child, fields);
        }
    }
    
    return fields;
}
/**
 * generate the ui for one form field.
 * Another option is to use XBL but it really doesn't seem to be worth 
 * the effort
 * @param node a form field
 * @param elementIndex the index of the element in the form's elements array.
 * @returns the root of the ui for a form field (a groupbox).
 */
function createFieldUI(node, elementIndex){
    
//     var uid = Math.round(Math.random() * 100000000000);
    dump("creating field ui\n");
    var root = document.createElement("groupbox");
    root.setAttribute("flex", 0);
    
    var caption = document.createElement("caption");
    
    if (node.name){
        caption.setAttribute("label", node.name);
    }
    else if(node.id){
        caption.setAttribute("label", node.id);
    }
    
    var hbox = document.createElement("hbox");
    dump("creating field ui...\n");
    var checkbox = document.createElement("checkbox");
    checkbox.className = "nolabel";
    checkbox.setAttribute('formElementIndex', elementIndex);
    
    var menulist = document.createElement("menulist");
    menulist.setAttribute("editable", true);
    dump("creating field ui.......\n");
    var menupopup = document.createElement("menupopup");
    
    var firstMenuItem = document.createElement("menuitem");
    if (node.value && node.value.length){
        firstMenuItem.setAttribute("label", node.value);
    }
    else {
        firstMenuItem.setAttribute("label",
            "Change this to the value you want tested");
    }
    menupopup.appendChild(firstMenuItem);
    
    dump("creating field ui............................\n");
    var attackStringContainer = getAttackStringContainer();
    var attacks = attackStringContainer.getStrings();
    for (var i = 0; i < attacks.length; i++){
        var aMenuItem = document.createElement("menuitem");
        aMenuItem.setAttribute('label', attacks[i].string);
        aMenuItem.setAttribute('width', '100');
        aMenuItem.setAttribute('crop', 'end');
        menupopup.appendChild(aMenuItem);
        dump("menupopup childnodes length: " + menupopup.childNodes.length+"\n");
    }
    
    menulist.appendChild(menupopup);
    
    hbox.appendChild(checkbox);
    hbox.appendChild(menulist);
    
    root.appendChild(caption);
    root.appendChild(hbox);
    dump("creating field ui................................................\n");
    return root;

}

/**
 * This function checks whether the passed in DOMNode is form field or some 
 * other type of tag.
 * @param node the node to check
 * @returns true if the elemenet is a form field, false otherwise
 */
function isFormField(node){

    switch (node.tagName.toLowerCase()){
        case "input":
        case "option":
        case "button":
        case "textarea":
        case "submit":
                return true;
        default:
                return false;
    }
}
