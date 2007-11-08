/**
 * PrefObserver.js
 * This provides a class that can be used to watch arbitrary preferences and do
 * artibrary things based on them.
 * This assumes will act on all preferences being watched (that is all children
 * of this preference as well as the preference itself).
 */

function Xss_PrefObserver(functionToCall){
    this.funcToCall = functionToCall;
    
}

Xss_PrefObserver.prototype = {
    observe: function(subject, topic, data) {
        dump('Xss_PrefObserver::Observe topic == ' + topic + '\n');
        if (topic == "nsPref:changed") {
            this.funcToCall(subject, topic, data);
        }
    }
    ,
    QueryInterface : function(aIID) {
        if (aIID.equals(Components.interfaces.nsIObserver)) {
            return this;
        }
    
        throw Components.results.NS_NOINTERFACE;
    }
};