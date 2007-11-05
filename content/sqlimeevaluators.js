/**
 * sqlimeevaluators.js
 * This file holds a number of JS evaluators 
 * @require Results.js
 * @require ErrorStringContainer.js
 */

function checkForErrorString(browser) {

    var errorContainer = getErrorStringContainer();
    var results = new Array();
//     dump('sqlimeevaluators::checkForErrorString gFindInstData: ' + (new nsFindInstData()) + ' ' + findInPage + '\n');
//     dump('sqlimeevaluators::checkForErrorString getMainWindow() ' + getMainWindow() + '  getMainWindow().webBrowserFind ' + browser.webBrowserFind + '\n');
    dump('sqlimeevaluators::checkForErrorString browswer._fastFind == ' +browser._fastFind + '\n');
    for each (var error in errorContainer.getStrings()){
        var result;
//        dump('sqlimeevaluators::checkForErrorString going to check ' + browser.spec + ' with value \'' + browser.webNavigation.document.body.innerHTML + '\' for \'' + error.string + '\'\n');
        try {
            browser.fastFind.init(browser.docShell);
            dump('sqlimeevaluators::checkForErrorString browser.fastFind.find(error.string, false) == ' + browser.fastFind.find(error.string, false) + '\n');
            if (browser.fastFind.find(error.string, false) !== Components.interfaces.nsITypeAheadFind.FIND_NOTFOUND) { //, false, true, false, true, false)){
                
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

function checkForServerResponseCode(nsiHttpChannel){
    try{
        dump('sqlimeevaluators::checkForServerResponseCode nsiHttpChannel.toString(): ' + nsiHttpChannel.toString() + '\n');
        dump('sqlimeevaluators::checkForServerResponseCode nsiHttpChannel.responseStatus: ' + nsiHttpChannel.responseStatus + '\n');
        if ((nsiHttpChannel.responseStatus === undefined || nsiHttpChannel.responseStatus === null)){
            return null;   
        }
        else {
            var result;
            var responseCode = nsiHttpChannel.responseStatus;
            if (responseCode == 200){
                result = new Result(RESULT_TYPE_PASS, 100, "Server returned OK return code ('" + responseCode + "')");
            }
            else {
                result = new Result(RESULT_TYPE_ERROR, 100, "server returned a bad response code :" + responseCode + ", " + nsiHttpChannel.responseStatusText + "\n" );
            }
        }
        return [result];
    }
    catch(err){
        dump('sqlimeevaluators::checkForServerResponseCode err: ' + err + '\n');
        return false;
    }
}