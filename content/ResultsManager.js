/**
 * ResultsManager.js
 * @requires FieldResult.js
 * @requires Result.js
 * @requires AttackHttpResponseObserver
 */

/**
 * The Results Manager is 
 */
function ResultsManager(extensionManager) {
    this.evaluators = new Array();
    this.errors = 0
    this.warnings = 0
    this.pass = 0
    this.attacks = new Array();
    this.httpresponseObservers = new Array(); //parallel to this.attacks
    this.sourceListeners = new Array(); //members are asynchronous.
    this.sourceEvaluators = new Array();
    this.extensionManager = extensionManager;

    /**
     *  This is a dynamically allocated 2d array. The first dimension is the
     *  index of the form. The second dimension is the index of the field that
     *  is being tested
     */
    this.fields = new Array(); 

}

ResultsManager.prototype = {
    addResults: function(resultsWrapper){
        if (resultsWrapper.results.length === 0) {
            return;
        }
        var formIndex = resultsWrapper.formIndex;
        var fieldIndex = resultsWrapper.fieldIndex;
        
        /* if there is no field array for this form then create it*/
        if (this.fields[formIndex] === undefined){
            this.fields[formIndex] = new Array(); 
        }
        
        if (this.fields[formIndex][fieldIndex] === undefined) {
            this.fields[formIndex][fieldIndex] = new FieldResult(formIndex, fieldIndex);
        }
        this.fields[formIndex][fieldIndex].addResults(resultsWrapper.results);
    
    }
    ,
    evaluate: function(browser, attackRunner){
        
        if (this.attacks.indexOf(attackRunner) !== -1){
            for each (var evaluator in this.evaluators){
                
                var results = evaluator(browser);
                
                dump('resultsManager::evaluate attackRunner::testData'+attackRunner.testData.length+'\n');
                for each(var result in results){
                    result.testData = attackRunner.testData;
                    result.fieldIndex = attackRunner.fieldIndex;
                    result.formIndex = attackRunner.formIndex;
                }
                var resultsWrapper = new Object();
                resultsWrapper.results = results;
                resultsWrapper.fieldIndex = attackRunner.fieldIndex;
                resultsWrapper.formIndex = attackRunner.formIndex;
                this.addResults(resultsWrapper);
                
            }
            
            this.attacks.splice(this.attacks.indexOf(attackRunner), 1);
            
        }
    }
    ,  
    addEvaluator: function(evaluator){
        this.evaluators.push(evaluator);
    }
    ,
    hasResults: function(){
        return (this.errors.length !==  0 || 
                this.warnings.length !== 0 || 
                this.pass.length !== 0);
    }
    ,
    getNumTestsRun: function(){
        var results = [this.errors, this.warnings , this.pass];
        var rv = 0;
        
        for each (var resultContainer in results){
            for each (var resultLevel in resultContainer){
                for each (var result in resultLevel){
                    if (result !== null && result !== undefined){
                        rv++;
                    }
                }
            }
        }
        
        return rv;
        
    }
    ,
    getNumTestsPassed: function(){
        var rv = 0;
        for each (var resultLevel in this.pass){
            for each (var result in resultLevel){
                if (result !== null && result !== undefined){
                    rv++;
                }
            }
        }
        return rv;
    }
    ,
    getNumTestsWarned: function(){
        var rv = 0;
        for each (var resultLevel in this.warnings){
            for each (var result in resultLevel){
                if (result !== null && result !== undefined){
                    rv++;
                }
            }
        }
        return rv;
    }
    ,
    getNumTestsFailed: function(){
        var rv = 0;
        for each (var resultLevel in this.errors){
            for each (var result in resultLevel){
                if (result !== null && result !== undefined){
                    rv++;
                }
            }
        }
        return rv;
    }
    ,
    makeResultsGraph:function (numTestsRun, numFailed, numWarned, numPassed){
        var rv = '';
        rv += '<table style="width: 100%">' +
                '<tr>';
        rv += "<td class=\"bar-status\">Failures (" +numFailed+"):</td>";
        rv += '<td class="bar"><div style="width: ' +
                Math.round((numFailed / numTestsRun)*100).toString() +
                '% ; height: 100%;background-color: #FF3333;color: white;border: none;">&nbsp;</div></td>';
        rv += '</tr><tr>';
        rv +="<td class=\"bar-status\">Warnings (" + numWarned+"):</td>" +
                '</td>';
        rv += '<td class="bar"><div style="width: ' +
                Math.round((numWarned / numTestsRun)*100).toString() + 
                '%; height: 100%;background-color: #FFFF00; color: white;border:none;">&nbsp;</div></td>';
        rv += '</tr><tr>';
        rv += "<td class=\"bar-status\">Passes (" +numPassed+"):</td>" +
                '<td class="bar"><div style="width: ' +
                Math.round((numPassed / numTestsRun)*100).toString() + 
                '%; background-color: #66ff66;height: 100%;color: white;border: none;">&nbsp;</div></td>';
        rv +='</tr></table>';
        
        return rv;
    }
    ,
    sortResults: function (){
        var errors = new Array();
        var errorsWithWarnings = new Array();
        var errorsWithWarningsAndPasses = new Array();
        var warnings = new Array();
        var warningsWithPasses = new Array();
        var passes = new Array();
        for each (var form in this.fields){
            for each(var fieldResult in form) {
                if (fieldResult.state & fieldresult_has_error &&
                    !(fieldResult.state & fieldresult_has_warn ||
                      fieldResult.state & fieldresult_has_pass))
                {
                    errors.push(fieldResult);
                }
                else if (fieldResult.state & fieldresult_has_error &&
                         fieldResult.state & fieldresult_has_warn &&
                         !(fieldResult.state & fieldresult_has_pass))
                {
                    errorsWithWarnings.push(fieldResult);
                }
                else if (fieldResult.state & fieldresult_has_error &&
                         fieldResult.state & fieldresult_has_warn &&
                         fieldResult.state & fieldresult_has_pass)
                {
                    errorsWithWarningsAndPasses.push(fieldResult);
                }
                else if (fieldResult.state & fieldresult_has_warn &&
                         !(fieldResult.state & fieldresult_has_pass))
                {
                    warnings.push(fieldResult);
                }
                else if (fieldResult.state & fieldresult_has_warn &&
                         fieldResult.state & fieldresult_has_pass)
                {
                    warningsWithPasses.push(fieldResult);
                }
                else {
                    passes.push(fieldResult);
                }
            }
        }
        
        return errors.concat(errorsWithWarnings, errorsWithWarningsAndPasses,
                warnings, warningsWithPasses, passes);
        
    }
    ,
    count: function(){
        var numTestsRun = 0; 
        var numPasses = 0; 
        var numWarnings = 0;
        var numFailes = 0; 
        for each (var form in this.fields) {
            for each (var fieldResult in form) {
                var numTestsRunInField = 0; 
                var numPassesInField = 0; 
                var numWarningsInField = 0;
                var numFailesInField = 0; 
                [numTestsRunInField, numFailesInField, numWarningsInField, numPassesInField] =
                        fieldResult.count();
                        
                numTestsRun += numTestsRunInField; 
                numPasses += numPassesInField; 
                numWarnings += numWarningsInField;
                numFailes += numFailesInField; 
                        
            }
        }
        return [numTestsRun, numFailes, numWarnings, numPasses];

    }
    ,
    showFieldResult: function(fieldResult){
        fieldResult.sort();
        var rv ="";
        var testFieldName;
        rv += "<fieldset>";
        var unamedFieldCounter = 0;
        var testDataList = fieldResult.getSubmitState();
        for each(var testData in testDataList) {
            if (testData.tested ===true){
                testFieldName = (testData.name !== undefined ? testData.name : ("unnamed field " + ++unamedFieldCounter));
                break;
            }
            else if (testData.name === undefined) {
                unamedFieldCounter++;
            }
        }
        rv += "<legend>" + testFieldName + "</legend>";
        rv += "<ul>";
        rv += "<li>Submit Form State:<ul>";
        unamedFieldCounter = 0;
        for each(var testData in testDataList) {
            if (testData.tested === false){
                rv += "<li>" + (testData.name !== undefined? testData.name : ("unnamed field " + ++unamedFieldCounter)) + ": " + encodeString(testData.data) + "</li>";
            }
            else if (testData.name === undefined) {
                unamedFieldCounter++;
            }
        }
        rv += "</ul></li>";
        rv += "<li>Result Details:<ul>";
        for each(var result in fieldResult.results) {
            
            switch (result.type){
                case RESULT_TYPE_PASS:
                    rv += "<li><ul class='pass'>"
                    rv += "<li>";
                    rv += "Test Passed</li>"; 
                    break;
                case RESULT_TYPE_WARNING:
                    rv += "<li><ul class='warn'>"
                    rv += "<li>";
                    rv += "Test had Warnings</li>";
                    break;
                case RESULT_TYPE_ERROR:
                    rv += "<li><ul class='errors'>";
                    rv += "<li>";
                    rv += "Test had Errors</li>";
                    break;
            }
            rv += "<li>"+result.message+"</li>"
            rv += "<li>Test value: ";
            unamedFieldCounter = 0;
            for each(var testData in result.testData) {
                if (testData.tested === true){
                    rv += encodeString(testData.data);
                    break;
                }
                else if (testData.name === undefined) {
                    unamedFieldCounter++;
                }
            }
            rv += "</li>";
            rv += "</ul></li>"
            
        }
        rv += "</ul></li>";
        rv += "</ul></li>";
        rv += "</fieldset>";
        return rv;
    }
    ,
    showResults: function(){
        if (this.attacks.length != 0 || this.sourceListeners.length != 0){
            var self = this;
            setTimeout(function(){self.showResults()}, 1000);
            return;
        }
        
        getTestRunnerContainer().keepChecking = false;
        
        var sortedResults = this.sortResults();
        
        var resultsTab = null;
        var numTestsRun = 0; 
        var numPasses = 0; 
        var numWarnings = 0;
        var numFailes = 0; 
        
        [numTestsRun, numFailes, numWarnings, numPasses] = this.count();
        
        var results="<html><head><link  rel=\"stylesheet\" type=\"text/css\""+
                "href=\"chrome://sqlime/skin/results.css\"/>"+
                "<title>Results</title></head><body>";
        results += "<img src='chrome://sqlime/skin/logo_sc.png' />";  
        results += "<h1>Test Results</h1>";
        
        results += this.makeResultsGraph(numTestsRun, numFailes, numWarnings, 
                numPasses);
        
        results += "<h2>Results</h2>";
        
        for each(var fieldResult in sortedResults){
            results += this.showFieldResult(fieldResult);
        }
        results+="</body></html>";
        
        var file = Components.classes['@mozilla.org/file/directory_service;1']
                .getService(Components.interfaces.nsIProperties)
                .get('TmpD', Components.interfaces.nsIFile);
        file.append('results_' + (new Date()).getTime() +'.tmp');
        file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);
        
        // file is nsIFile, data is a string
        var foStream = Components.classes['@mozilla.org/network/file-output-stream;1']
                .createInstance(Components.interfaces.nsIFileOutputStream);

        foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); // write, create, truncate
        foStream.write(results, results.length);
        foStream.close();

        
        resultsTab = getMainWindow().getBrowser().
                addTab(file.path);
        getMainWindow().getBrowser().selectedTab=resultsTab;
        
        this.extensionManager.postTest();
        
    }
    ,
    registerAttack:function(attackRunner){
        this.attacks.push(attackRunner);
    }
    ,
    addObserver: function(attackRunner, attackHttpResponseObserver){
        
        /*
         * This will cause problems if the attackRunner 
         */
        this.httpresponseObservers[this.attacks.indexOf(attackRunner)] = 
                attackHttpResponseObserver;
    }
    ,
    /**
     * This will cause problems if the attackRunner has been evaluated before
     * this is called. However it evaluate is called on (or after) 
     * DOMContentLoaded which should happen after a response code has been 
     * received.
     */
    gotChannelForAttackRunner: function( nsiHttpChannel, attackHttpResponseObserver){
        
        var observerService = Components.
                classes['@mozilla.org/observer-service;1'].
                getService(Components.interfaces.nsIObserverService);
        var results = checkForServerResponseCode(nsiHttpChannel)
        dump('resultmanager::gotChannelForAttackRunner results: ' + results + '\n');
        if (results != null){
            dump('resultmanager::gotChannelForAttackRunner results: ' + results + '\n');
            for each(var result in results){
                result.testData = attackHttpResponseObserver.attackRunner.testData;
                result.fieldIndex = attackHttpResponseObserver.attackRunner.fieldIndex;
                result.formIndex = attackHttpResponseObserver.attackRunner.formIndex;
            }
            var resultsWrapper = new Object();
            resultsWrapper.results = results;
            resultsWrapper.fieldIndex = attackHttpResponseObserver.attackRunner.fieldIndex;
            resultsWrapper.formIndex = attackHttpResponseObserver.attackRunner.formIndex;
            this.addResults(resultsWrapper);
            observerService.removeObserver(attackHttpResponseObserver, 
                    AttackHttpResponseObserver_topic);
            
            this.httpresponseObservers.
                    splice(this.attacks.indexOf(attackHttpResponseObserver), 1);
        }
        
    }
    ,
    /**
     * 
     */
    addSourceListener:function(sourceListener, attackRunner){
        this.sourceListeners.push(sourceListener);
    }
    ,
    addSourceEvaluator: function(sourceEvaluator){
        this.sourceEvaluators.push(sourceEvaluator);
    }
    ,
    evaluateSource: function(streamListener){
        
        var attackRunner = streamListener.attackRunner;
        
        for each(sourceEvaluator in this.sourceEvaluators){
            var results = sourceEvaluator(streamListener);
            for each (var result in results){
                result.testData = attackRunner.testData;
                result.fieldIndex = attackRunner.fieldIndex;
                result.formIndex = attackRunner.formIndex;
            }
            var resultsWrapper = new Object();
            resultsWrapper.results = results;
            resultsWrapper.fieldIndex = attackRunner.fieldIndex;
            resultsWrapper.formIndex = attackRunner.formIndex;
            this.addResults(resultsWrapper);
        }
        
        var index = this.sourceListeners.indexOf(streamListener);
        this.sourceListeners.splice(index, 1);
    }
};
