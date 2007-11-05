const STATE_START = Components.interfaces.nsIWebProgressListener.STATE_START;
const STATE_STOP = Components.interfaces.nsIWebProgressListener.STATE_STOP;
const STATE_IS_WINDOW = Components.interfaces.nsIWebProgressListener.STATE_IS_WINDOW;
const STATE_IS_DOCUMENT = Components.interfaces.nsIWebProgressListener.STATE_IS_DOCUMENT;

const LISTEN_ON_WINDOW = 1;
const LISTEN_ON_DOCUMENT = 2;

function sqlimeProgressListener(funcToCall, listenOn) {
    
    this.func = funcToCall
    this.listenOn = listenOn != null ? listenOn : STATE_IS_WINDOW;
    dump('created a listener... mode is ' + listenOn + '\n');
    this.interfaceName = "nsIWebProgressListener";
};

sqlimeProgressListener.prototype =
{
    QueryInterface: function(aIID)
    {
        if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
            aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aIID.equals(Components.interfaces.nsISupports))
        {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
        return null;
    },
    
    onStateChange: function(aProgress, aRequest, aFlag, aStatus)
    {
        dump('got a state change. aFlag is ' + aFlag.toString(16) + '\n');
        dump('got a state change. we are listening on ' + 
                this.listenOn.toString(16) + '\n');
        // Components sometimes seems to disappear or or malfunction so we're 
        // just using the literal constant here.
//         if((aFlag & 0x00000010) && 
//             (aFlag & 0x00080000) )
        if ((aFlag & STATE_STOP) && (aFlag & this.listenOn)) {
            this.func();
        }
        return 0;
    },
    
    onLocationChange: function(aProgress, aRequest, aURI)
    {

        return 0;
    },
    
    // For definitions of the remaining functions see XULPlanet.com
    onProgressChange: function() {return 0;},
    onStatusChange: function() {return 0;},
    onSecurityChange: function() {return 0;},
    onLinkIconAvailable: function() {return 0;}
};
