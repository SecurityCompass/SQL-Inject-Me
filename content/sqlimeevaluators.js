/**
 * sqlimeevaluators.js
 * This file holds a number of JS evaluators 
 * @require Results.js
 * @require ErrorStringContainer.js
 */

function checkForVulnerableElement(browser) {
    
    var rv = null;
    
    dump('sqlimeevaluator on page ' + browser.webNavigation.document.location + ' is ' + (browser.webNavigation.document.wrappedJSObject.vulnerable ) + ' ' + (browser.webNavigation.document.wrappedJSObject.vulnerable == true) + '\n');
    
    if (browser.webNavigation.document.wrappedJSObject.vulnerable && browser.webNavigation.document.wrappedJSObject.vulnerable == true){
        
        rv = new Result(RESULT_TYPE_ERROR, 100, "Was able to add property to DOM, this page is very vulnerable");
        
    }
    else if (browser.webNavigation.document.vulnerable){
        
        rv = new Result(RESULT_TYPE_WARNING, 100, "Seemed to add property but not vaule. This should be investigated further");
        
    }
    else {
        
        rv = new Result(RESULT_TYPE_PASS, 100, "browser.webNavigation.document did not get property");
        
    }
    
    return [rv];
    
}

function checkForErrorString(browser) {

    var errorContainer = getErrorStringContainer();
    var results = new Array();
//     dump('sqlimeevaluators::checkForErrorString gFindInstData: ' + (new nsFindInstData()) + ' ' + findInPage + '\n');
//     dump('sqlimeevaluators::checkForErrorString getMainWindow() ' + getMainWindow() + '  getMainWindow().webBrowserFind ' + browser.webBrowserFind + '\n');
    dump('sqlimeevaluators::checkForErrorString browswer._fastFind == ' +browser._fastFind + '\n');
    for each (var error in errorContainer.getStrings()){
        var result;
        var findInstData = new nsFindInstData();
        dump('going to check ' + browser + ' for \'' + error.string + '\'\n');
        try {
            if (browser._fastFind.find(error.string, false) !== Components.interfaces.nsITypeAheadFind.FIND_NOTFOUND) { //, false, true, false, true, false)){
                
                result = new Result(RESULT_TYPE_ERROR, 100, "Was able to find error string ('" + error.string + "')");
                
            }
            else {
                result = new Result(RESULT_TYPE_PASS, 100, "Was not able to find error string ('" + error.string + "')");
            }
            results.push(result);
        }
        catch (err){
            dump('problem in sqlimeevaluators::checkForErrorString... ' + err + '\n');   
        }
    }
    
    return results;
}