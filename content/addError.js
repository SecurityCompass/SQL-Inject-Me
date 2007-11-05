function onOk() {
    var stringTxtBox = document.getElementById('errorstringtxtbox');
    var errorStrContainer = window.arguments[0];
    var prefController = window.arguments[1];
    var prefWindow = window.arguments[2];
    
    
    if (!stringTxtBox.value.length)
    {
        alert("Please enter an error string");
        stringTxtBox.select();
        return false;
    }
    var wasStringAdded = errorStrContainer.addString(stringTxtBox.value, null);
    
    dump('was this string (' + stringTxtBox.value + ') added? ' + 
            wasStringAdded + '\n');
    
    if (wasStringAdded){
        prefController.makeUI(errorStrContainer.getStrings(), prefWindow, 
                'existingSQLIerrStrings');
        return true;
    }
    else{
        alert("couldn't add your error string");
        return false;
    }
    
    
}

function onCancel(){
    
    return true;
}