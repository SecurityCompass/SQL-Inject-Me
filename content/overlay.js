/**
 * This function checks whether the context menu needs to be dispalyed and then
 * makes sure that that is the state of the context menu
 */

function checkContextMenu() {
    var prefService = Components.classes['@mozilla.org/preferences-service;1'].
            getService(Components.interfaces.nsIPrefService);
    var branch = prefService.getBranch('extensions.sqlime.');
    var showContextMenu = true; //default
    dump('::checkContextMenu branch.prefHasUserValue(\'showcontextmenu\') == ');
    dump(branch.prefHasUserValue('showcontextmenu'));
    dump('\n');
    if (branch.prefHasUserValue('showcontextmenu')) {
        showContextMenu = branch.getBoolPref('showcontextmenu');
    }

    var contextMenu = document.getElementById('sqlimecontextmenu');
    dump('::checkContextMenu contextMenu == ' + contextMenu + '\n');
    dump('::checkContextMenu showcontextmenu == ');
    dump(showContextMenu +'\n');
    contextMenu.setAttribute('collapsed', !showContextMenu);
}
    
function XssOverlay() {}

XssOverlay.prototype = {
    contextMenuObserver: null
    ,
    onLoad: function() {
        
        var prefService = Components.classes['@mozilla.org/preferences-service;1'].
                getService(Components.interfaces.nsIPrefService);
        
        var branch = prefService.getBranch('');
    
        var observableBranch = branch.
                QueryInterface(Components.interfaces.nsIPrefBranch2);
        
        this.contextMenuObserver = new Xss_PrefObserver(checkContextMenu);
        
        checkContextMenu();
        
        dump('mainwindow::onLoad contextMenuObserver ==' + this.contextMenuObserver +'\n');
        
        
        observableBranch.addObserver('extensions.sqlime.showcontextmenu', this.contextMenuObserver, false);
    }
    ,
    onUnload: function() {
        dump('XssOverlay::onUnload this.contextMenuObserver' + this.contextMenuObserver + '\n');
        //Do nothing right now.
    }
};

var xssOverlay = new XssOverlay();

window.addEventListener('load', xssOverlay.onLoad, false);
window.addEventListener('unload', xssOverlay.onUnload, false);
