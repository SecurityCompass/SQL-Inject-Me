/**
 * AttackHttpResponseObserver.js
 */
const AttackHttpResponseObserver_topic = 'http-on-examine-response';
 
function AttackHttpResponseObserver(attackRunner, resultsManager){
    
    this.attackRunner = attackRunner;
    this.resultsManager = resultsManager;
    
}

AttackHttpResponseObserver.prototype = {
    
    QueryInterface: function(iid) {
        if (iid.equals(Components.interfaces.nsIObserver) || 
            iid.equals(Components.interfaces.nsISupports))
        {
            return this;
        }
        
        throw Components.results.NS_ERROR_NO_INTERFACE;
    },

    observe: function(subject, topic, data) {
        
        if (topic == AttackHttpResponseObserver_topic){
            try {
                var channel = subject.
                        QueryInterface(Components.interfaces.nsIHttpChannel)
                if (channel.responseStatus < 300 ||
                    channel.responseStatus >= 400)
                {
                    this.resultsManager.gotChannelForAttackRunner(channel,
                            this);
                }
            }
            catch(err) {
                dump('AttackHttpResponseObserver::observe: ' + err + '\n');
            }
        }
        
    }
    
};