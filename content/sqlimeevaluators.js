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
                
                result = new Result(RESULT_TYPE_ERROR, 100, "Error string found: '" + encodeString(error.string) + "'");
                
            }
            else {
                result = new Result(RESULT_TYPE_PASS, 100, "Error String not found: '" + encodeString(error.string) + "'");
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
            var displayString = "Server Status Code: " + encodeString(responseCode.toString()) + " " +
                    encodeString(nsiHttpChannel.responseStatusText);
            if (responseCode == 200){
                result = new Result(RESULT_TYPE_PASS, 100, displayString );
            }
            else {
                result = new Result(RESULT_TYPE_ERROR, 100, displayString);
            }
        }
        return [result];
    }
    catch(err){
        dump('sqlimeevaluators::checkForServerResponseCode err: ' + err + '\n');
        return false;
    }
}