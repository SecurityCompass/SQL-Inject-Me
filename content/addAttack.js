function onOk() {
    var stringTxtBox = document.getElementById('attackstringtxtbox');
    var sigTxtBox = document.getElementById('sigtxtbox');
    var attackStrContainer = window.arguments[0];
    var prefController = window.arguments[1];
    var prefWindow = window.arguments[2];
    
    
    if (!stringTxtBox.value.length)
    {
        alert("Please enter an attack string");
        stringTxtBox.select();
        return false;
    }
    if (!sigTxtBox.value.length){
        alert("Please enter a signature to identify you by.");
        sigTxtBox.select();
        return false;
    }
    
    if (attackStrContainer.addAttack(stringTxtBox.value, sigTxtBox.value)){
        prefController.makeUI(attackStrContainer.getAttacks(), prefWindow);
        return true;
    }
    else{
        alert("couldn't add your attack string");
        return false;
    }
    
    
}

function onCancel(){
    
    return true;
}