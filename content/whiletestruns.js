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
 * whiletestruns.js
 * Holding JS code for whiletestruns.xul
 */
function OK(){
    
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                        .getService(Components.interfaces.nsIPromptService);
    var rv = false;

    rv = prompts.confirmEx(null,
            "Are you sure you want to close this window?",
            "Are you sure you want to close this window? It's useful to " +
                    "remind you not to use the testing window. Also closing this window will NOT stop the tests.",
            prompts.STD_YES_NO_BUTTONS, "", "", "", null, new Object());
    
    return !rv;
    
}

