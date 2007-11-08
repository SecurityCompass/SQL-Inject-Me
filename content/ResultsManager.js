/**
 * ResultsManager.js
 * @requires Result.js
 * @requires AttackHttpResponseObserver
 */

/**
 * The Results Manager is 
 */
function ResultsManager(extensionManager) {
    this.evaluators = new Array();
    this.errors = new Array();
    this.warnings = new Array();
    this.pass = new Array();
    this.attacks = new Array();
    this.httpresponseObservers = new Array(); //parallel to this.attacks
    this.sourceListeners = new Array(); //members are asynchronous.
    this.sourceEvaluators = new Array();
    this.extensionManager = extensionManager;
}

ResultsManager.prototype = {
    addResults: function(results){
        for each (var result in results){
            switch(result.type){
                        
                case RESULT_TYPE_ERROR:
                        if (this.errors[result.value] === undefined)
                {
                    this.errors[result.value] = new Array();
                }
                this.errors[result.value].push(result);
                break;
                        
                case RESULT_TYPE_WARNING:
                        if (this.warnings[result.value] === undefined)
                {
                    this.warnings[result.value] = new Array();
                }
                this.warnings[result.value].push(result);
                break;
                        
                        
                case RESULT_TYPE_PASS:
                        if (this.pass[result.value] === undefined)
                {
                    this.pass[result.value] = new Array();
                }
                this.pass[result.value].push(result);
                break;
                            
                default:
                        dump('resultmanager::evaluate error, result has valid type\n');
                break;  
            }
        }
    }
    ,
    evaluate: function(browser, attackRunner){
        
            if (this.attacks.indexOf(attackRunner) !== -1){
                for each (var evaluator in this.evaluators){
                    
                    var results = evaluator(browser);
    //                 /*alert*/('# results: ' + results.length);
                    dump('resultsManager::evaluate attackRunner::testData'+attackRunner.testData.length+'\n');
                    for each(var result in results){
                        result.testData = attackRunner.testData;
    //                     alert('ar:td:' + attackRunner.testData);
                    }
                    this.addResults(results);
                    
                
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
        rv += "<td class=\"bar-status\">Failed:</td>";
        rv += '<td class="bar"><div style="width: ' +
                Math.round((numFailed / numTestsRun)*100).toString() +
                '% ; background-color: #FF3333;color: white;border: none;">&nbsp;</div></td>'+
                '<td class="percent">'+numFailed+'</td>';
        rv += '</tr><tr>';
        rv +="<td class=\"bar-status\">Warning:</td>" +
                '</td>';
        rv += '<td class="bar"><div style="width: ' +
                Math.round((numWarned / numTestsRun)*100).toString() + 
                '%; background-color: #FFFF00; color: white;border:none;">&nbsp;</div></td>' +
                '<td class="percent">'+numWarned+'</td>';
        rv += '</tr><tr>';
        rv += "<td class=\"bar-status\">Passed:</td>" +
                '<td class="bar"><div style="width: ' +
                Math.round((numPassed / numTestsRun)*100).toString() + 
                '%; background-color: #66ff66;color: white;border: none;">&nbsp;</div></td>'+
                '<td class="percent">'+numPassed+'</td>';
        rv +='</tr></table>';
        
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
        
        var resultsTab = null;
        var numTestsRun = this.getNumTestsRun();
        var numPasses = this.getNumTestsPassed();
        var numWarnings = this.getNumTestsWarned();
        var numFailes = this.getNumTestsFailed();
        var results="<html><head><link  rel=\"stylesheet\" type=\"text/css\""+
                "href=\"chrome://sqlime/skin/results.css\"/>"+
                "<title>Results</title></head><body>";

        results += "<h1>Test Results</h1>";
        
        results += this.makeResultsGraph(numTestsRun, numFailes, numWarnings, 
                numPasses);
        
        results += "<h2>Results</h2>";
        
        //errors:
        for each (var errorLevel in this.errors.reverse()){
            for each (var error in errorLevel){
                if (error){
                    results += "<fieldset>";
                    results += "<p>Result: <span class=\"failed\">Failed</span></p>";
                    results += "<p>Details: " + error.message + "</p>";
                    results += "\nForm Data (bold field has test data):";
                    results += "<ul>";
                    
                    for each (var fieldInfo in error.testData){
                        results += '<li>';
                        if (fieldInfo.tested){
                            results+= '<strong>';
                        }
                        results += fieldInfo.name + ': ' + 
                                encodeString(fieldInfo.data);
                        if (fieldInfo.tested){
                            results+= '</strong>';
                        }
                        results += '</li>';
                    }
                    results += '</ul>';
                    results += '</fieldset>';
                    
                }
            }
            
        }
        //warnings:
        for each (var warningLevel in this.warnings.reverse()){
            for each (var warning in warningLevel){
                if (warning){
                    results += '<fieldset>';
                    results += "<p>Result: <span class=\"warning\">Warning</span></p>";
                    results += "<p>Details: " + warning.message + "</p>";
                    results += '<ul>';
                    for each (var fieldInfo in warning.testData){
                        results += '<li>';
                        if (fieldInfo.tested){
                            results+= '<strong>';
                        }
                        results += fieldInfo.name + ': ' + 
                                encodeString(fieldInfo.data);
                        if (fieldInfo.tested){
                            results+= '</strong>';
                        }
                        results += '</li>';
                    }
                    results += '</ul>';
                    results += '</fieldset>';
                    
                    results += '</fieldset>\n';
                }
            }
        }
        //passes:
        for each (var passLevel in this.pass.reverse()){
            for each(var pass in passLevel){
                
                if (pass){
                    results += '<fieldset>';
                    results += "<p>Result: <span class=\"Passed\">Passed</span></p>";
                    results += "<p>Details: " + pass.message + "</p>";
                    results += '<ul>';
                    for each (var fieldInfo in pass.testData){
                        results += '<li>';
                        if (fieldInfo.tested){
                            results+= '<strong>';
                        }
                        results += fieldInfo.name + ': ' + 
                                encodeString(fieldInfo.data);
                        if (fieldInfo.tested){
                            results+= '</strong>';
                        }
                        results += '</li>';
                    }
                    results += '</ul>';
                    results += '</fieldset>';
                    
                    results += '</fieldset>\n';
                }
                
            }
            
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
        this.httpresponseObservers.push(attackHttpResponseObserver);
    }
    ,
    /**
     * This will cause problems if the attackRunner has been evaluated before
     * this is called. However it evaluate is called on (or after) 
     * DOMContentLoaded which should happen after a response code has been 
     * received.
     */
    gotChannelForAttackRunner: function( nsiHttpChannel, attackHttpResponseObserver){
       
        var results = checkForServerResponseCode(nsiHttpChannel)
        dump('resultmanager::gotChannelForAttackRunner results: ' + results + '\n');
        if (results != null){
            dump('resultmanager::gotChannelForAttackRunner results: ' + results + '\n');
            this.addResults(results);
            var observerService = Components.
                classes['@mozilla.org/observer-service;1'].
                getService(Components.interfaces.nsIObserverService);
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
            }
            this.addResults(results);
        }
        
        var index = this.sourceListeners.indexOf(streamListener);
        this.sourceListeners.splice(index, 1);
    }
};
