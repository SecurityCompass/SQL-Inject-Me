/**
 * util.js
 * Utility Functions.
 */

/**
 * This takes a string of a piece of encoded XML and decodes it.
 * Specifically, this checks checks for encoded nested ]]> code.
 * Note: No XML parsing or checking is done.
 * @param xmlString
 * @returns a decoded string of a piece of XML (same piece)
 */
function decodeXML(xmlString) {
    
    var regex = ']]]]><![CDATA[';
    var replaced = ']]>';
    
    return xmlString.replace(regex, replaced, 'gm');
    
}

/**
 * This takes a string of a piece of XML and decodes it.
 * Specifically, this checks checks for nested ']]>' code.
 * Note: No XML parsing or checking is done.
 * @param xmlString
 * @returns an encoded string of a piece of XML (same piece)
 */
function encodeXML(xmlString) {
    
    var regex = ']]>';
    var replaced = ']]]]><![CDATA[';
    
    return xmlString.replace(regex, replaced, 'gm');
    
}

/**
 * Takes a string and returns the string with each character encoded in html
 * entities (e.g. &#65; for A).
 */
function encodeString(str){
    var rv = "";
    for each(var letter in str){
        rv += '&#' + letter.charCodeAt() +  ';';
    }
    return rv;
}