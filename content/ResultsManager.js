/**
 * ResultsManager.js
 * @requires Result.js
 */

/**
 * The Results Manager is 
 */
function ResultsManager() {
    this.evaluators = new Array();
    this.errors = new Array();
    this.warnings = new Array();
    this.pass = new Array();
    this.attacks = new Array();
}

ResultsManager.prototype = {
    
    evaluate: function(document, attackRunner){
        var result = null;
        
        dump('resultmanager::evaluate this.attacks.indexOf(attackRunner) = ' +
                this.attacks.indexOf(attackRunner) + '\n');
        
        if (this.attacks.indexOf(attackRunner) !== -1){
            
            for each(var evaluator in this.evaluators){
                
                result = evaluator(document);
                
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
                    
                    
                }
                
            }
            
            this.attacks.splice(this.attacks.indexOf(attackRunner), 1);
            
            if (this.attacks.length === 0){
                
                this.showResults();
                
            }
            
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
    showResults: function(){
        var results="<pre>results:";
        
        //errors:
        results+= "\nerrors\n";
        for each (var errorLevel in this.errors){
            for each (var error in errorLevel){
                if (error){
                    
                    results += error.message;
                    results += "\n";
                    
                }
            }
            
        }
        results+= "\nwarnings\n";
        for each (var warningLevel in this.warnings){
            for each (var warning in warningLevel){
                if (warning){
                    results += warning.message;
                    results += '\n';
                }
            }
        }
        results+= "\npasses\n";
        for each (var passLevel in this.pass){
            for each(var pass in passLevel){
                
                if (pass){
                    results += pass.message;
                    results += '\n';   
                }
                
            }
            
        }
        results+="</pre>";
//         alert(results);
        var resultsTab = getMainWindow().getBrowser().addTab('about:blank');
        
        getMainWindow().getBrowser().selectedTab=resultsTab;
        
        resultsTab.linkedBrowser.contentDocument.write(results);
        
        resultsTab.linkedBrowser.contentDocument.close();
    }
    ,
    registerAttack:function(attackRunner){
        this.attacks.push(attackRunner);
    }
};
