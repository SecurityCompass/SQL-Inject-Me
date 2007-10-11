/**
 * xssmeevaluators.js
 * This file holds a number of JS evaluators 
 * @require Results.js
 */

function checkForVulnerableElement(document) {
    
    var rv = null;
    
    dump('xssmeevaluator on page ' + document.location + ' is ' + (document.wrappedJSObject.vulnerable ) + ' ' + (document.wrappedJSObject.vulnerable == true) + '\n');
    
    if (document.wrappedJSObject.vulnerable && document.wrappedJSObject.vulnerable == true){
        
        rv = new Result(RESULT_TYPE_ERROR, 100, "Was able to add property to DOM, this page is very vulnerable");
        
    }
    else if (document.vulnerable){
        
        rv = new Result(RESULT_TYPE_WARNING, 100, "Seemed to add property but not vaule. This should be investigated further");
        
    }
    else {
        
        rv = new Result(RESULT_TYPE_PASS, 100, "document did not get property");
        
    }
    
    return rv;
    
}

