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