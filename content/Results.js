/**
 * Result.js
 */
 
const RESULT_TYPE_ERROR = 1;
const RESULT_TYPE_WARNING = 2;
const RESULT_TYPE_PASS = 3;

/**
 * The Result object is returned by evalutors.
 * The type defines whether the test resulted in an error, warning, or pass.
 * The value is used for sorting errors, warnings, and passes (usually doesn't 
 * matter for passes)
 * The message is what is to be displayed to the user. 
 */
function Result(type, value, message){
    this.value = value;
    this.type = type;
    this.message = message;
    dump('Result::Ctor (' + type+ ' ' + value+ ' ' + message + '\n');
}

