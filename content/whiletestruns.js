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

