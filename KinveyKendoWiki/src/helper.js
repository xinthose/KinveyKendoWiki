/*
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code bundle.
 */

/// Input Filtering

function numeric(e) {
    var key;
    var keychar;
    if (window.event) key = window.event.keyCode;
    else if (e) key = e.which;
    else return true;
    keychar = String.fromCharCode(key);
    keychar = keychar.toLowerCase();
    // control keys 
    if ((key === null) || (key === 0) || (key === 8) || (key === 9) || (key === 13) || (key === 27))
        return true;
        // alphas and numbers 
    else if ((("0123456789").indexOf(keychar) > -1))
        return true;
    else
        return false;
}

function numeric_with_dash(e) {
    var key;
    var keychar;
    if (window.event) key = window.event.keyCode;
    else if (e) key = e.which;
    else return true;
    keychar = String.fromCharCode(key);
    keychar = keychar.toLowerCase();
    // control keys 
    if ((key === null) || (key === 0) || (key === 8) || (key === 9) || (key === 13) || (key === 27))
        return true;
        // alphas and numbers 
    else if ((("0123456789-").indexOf(keychar) > -1))
        return true;
    else
        return false;
}

function numeric_with_period(e) {
    var key;
    var keychar;
    if (window.event) key = window.event.keyCode;
    else if (e) key = e.which;
    else return true;
    keychar = String.fromCharCode(key);
    keychar = keychar.toLowerCase();
    // control keys 
    if ((key === null) || (key === 0) || (key === 8) || (key === 9) || (key === 13) || (key === 27))
        return true;
        // alphas and numbers 
    else if ((("0123456789.").indexOf(keychar) > -1))
        return true;
    else
        return false;
}

function alphanumeric(e) {
    var key; 
    var keychar; 
    if (window.event) key = window.event.keyCode; 
    else if (e) key = e.which; 
    else return true; 
    keychar = String.fromCharCode(key); 
    keychar = keychar.toLowerCase(); 
    // control keys 
    if ((key===null) || (key===0) || (key===8) || (key===9) || (key===13) || (key===27) ) 
        return true; 
        // alphas and numbers 
    else if ((("abcdefghijklmnopqrstuvwxyz0123456789").indexOf(keychar) > -1))
        return true;
    else
        return false;
}

function alphanumeric_with_space(e) {
    var key;
    var keychar;
    if (window.event) key = window.event.keyCode;
    else if (e) key = e.which;
    else return true;
    keychar = String.fromCharCode(key);
    keychar = keychar.toLowerCase();
    // control keys 
    if ((key === null) || (key === 0) || (key === 8) || (key === 9) || (key === 13) || (key === 27))
        return true;
        // alphas and numbers 
    else if ((("abcdefghijklmnopqrstuvwxyz0123456789 ").indexOf(keychar) > -1))
        return true;
    else
        return false;
}

function alphanumeric_with_space_dash(e) {
    var key;
    var keychar;
    if (window.event) key = window.event.keyCode;
    else if (e) key = e.which;
    else return true;
    keychar = String.fromCharCode(key);
    keychar = keychar.toLowerCase();
    // control keys 
    if ((key === null) || (key === 0) || (key === 8) || (key === 9) || (key === 13) || (key === 27))
        return true;
        // alphas and numbers 
    else if ((("abcdefghijklmnopqrstuvwxyz0123456789 -").indexOf(keychar) > -1))
        return true;
    else
        return false;
}

function alphabetical (e) {
    var key;
    var keychar;
    if (window.event) key = window.event.keyCode;
    else if (e) key = e.which;
    else return true;
    keychar = String.fromCharCode(key);
    keychar = keychar.toLowerCase();
    // control keys 
    if ((key === null) || (key === 0) || (key === 8) || (key === 9) || (key === 13) || (key === 27))
        return true;
        // alphas and numbers 
    else if ((("abcdefghijklmnopqrstuvwxyz").indexOf(keychar) > -1))
        return true;
    else
        return false;
}

function alphabetical_with_space (e) {
    var key;
    var keychar;
    if (window.event) key = window.event.keyCode;
    else if (e) key = e.which;
    else return true;
    keychar = String.fromCharCode(key);
    keychar = keychar.toLowerCase();
    // control keys 
    if ((key === null) || (key === 0) || (key === 8) || (key === 9) || (key === 13) || (key === 27))
        return true;
        // alphas and numbers 
    else if ((("abcdefghijklmnopqrstuvwxyz ").indexOf(keychar) > -1))
        return true;
    else
        return false;
}

/// Validation

function validate_email(email) {
    var regex = /\S+@\S+\.\S+/;
    return regex.test(email);
}

function validate_ip_address (ip_address) {
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip_address)) {
        return (true)
    }
    else return (false)
}

/// Formating

function show_popup_centered(e) {
    if (!$("." + e.sender._guid)[1]) {
        var element = e.element.parent(),
            eWidth = element.width(),
            eHeight = element.height(),
            wWidth = $(window).width(),
            wHeight = $(window).height(),
            newTop, newLeft;

        newLeft = Math.floor(wWidth / 2 - eWidth / 2);
        newTop = Math.floor(wHeight / 2 - eHeight / 2);

        e.element.parent().css({
            top: newTop,
            left: newLeft,
            zIndex: 22222
        });
    }
}

function remove_phone_mask(str) {
    try {
        if (!str) return "";
        str = str.replace(/\(/g, '');
        str = str.replace(/\)/g, '');
        str = str.replace(/-/g, '');
        str = str.replace(/_/g, '');
        str = str.replace(/ /g, '');
    }
    catch (e) {
        console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
    }

    return str;
}

function odata_format_str(str) {
    try {
        if (!str) return "";
        str = str.replace(/\'/g, '~quote~');
        str = str.replace(/\&/g, '~and~');
        str = str.replace(/\#/g, '~no~');
    }
    catch (e) {
        console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
    }

    return str;
}

function odata_format_obj(obj) {
    var obj_str = "";
    var debug = false;
    var debug1 = true;

    try {
        if (debug) console.log(arguments.callee.name + " >> obj = " + JSON.stringify(obj));
        var obj_keys = Object.keys(obj);
        if (debug) console.log(arguments.callee.name + " >> obj_keys = " + JSON.stringify(obj_keys));
        for (var i = 0; i < obj_keys.length; i++) {
            obj_str += obj_keys[i] + "='" + obj[obj_keys[i]] + "'&";
        }
        obj_str = obj_str.slice(0, -1);    // remove last &
        if (debug1) console.log(arguments.callee.name + " >> obj_str = " + obj_str);
    }
    catch (e) {
        console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
    }

    return obj_str;
}

var currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
});

function grid_format_currency(e, property) {
    if (e[property] < 0) {
        return "<span class='negative_field'>" + currency.format(e[property]) + "</span>";
    }
    else if (e[property] === 0) {
        return "<span class='include_spaces'>$    -    </span>";
    }
    else {
        return "<span class='positive_field'>" + currency.format(e[property]) + "</span>";
    }
};

function grid_format_currency_ledger(e, property) {
    if (e[property] === 0) {
        return "<span class='include_spaces'>$    -    </span>";
    }
    else {
        return currency.format(e[property]);
    }
};

function update_gradient()
{
    try {
        var colors = new Array(
          [62, 35, 255],
          [60, 255, 60],
          [255, 35, 98],
          [45, 175, 230],
          [255, 0, 255],
          [255, 128, 0]);

        var step = 0;
        //color table indices for: 
        // current color left
        // next color left
        // current color right
        // next color right
        var colorIndices = [0, 1, 2, 3];

        //transition speed
        var gradientSpeed = 0.002;

        if ($ === undefined) return;
  
        var c0_0 = colors[colorIndices[0]];
        var c0_1 = colors[colorIndices[1]];
        var c1_0 = colors[colorIndices[2]];
        var c1_1 = colors[colorIndices[3]];

        var istep = 1 - step;
        var r1 = Math.round(istep * c0_0[0] + step * c0_1[0]);
        var g1 = Math.round(istep * c0_0[1] + step * c0_1[1]);
        var b1 = Math.round(istep * c0_0[2] + step * c0_1[2]);
        var color1 = "rgb("+r1+","+g1+","+b1+")";

        var r2 = Math.round(istep * c1_0[0] + step * c1_1[0]);
        var g2 = Math.round(istep * c1_0[1] + step * c1_1[1]);
        var b2 = Math.round(istep * c1_0[2] + step * c1_1[2]);
        var color2 = "rgb("+r2+","+g2+","+b2+")";

        $('#main_pane_blank').css({
            background: "-webkit-gradient(linear, left top, right top, from("+color1+"), to("+color2+"))"}).css({
                background: "-moz-linear-gradient(left, "+color1+" 0%, "+color2+" 100%)"});
  
        step += gradientSpeed;
        if ( step >= 1 )
        {
            step %= 1;
            colorIndices[0] = colorIndices[1];
            colorIndices[2] = colorIndices[3];
    
            //pick two new target color indices
            //do not pick the same as the current one
            colorIndices[1] = ( colorIndices[1] + Math.floor( 1 + Math.random() * (colors.length - 1))) % colors.length;
            colorIndices[3] = ( colorIndices[3] + Math.floor( 1 + Math.random() * (colors.length - 1))) % colors.length;
    
        }
    }
    catch (e) {
        console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
    }

    return;
}
//setInterval(update_gradient, 10);

// make date/time from Cloud readable and convert UTC to local time
function format_CreatedAt(CreatedAt) {
    //var local_time = moment(CreatedAt).local().format('YY-MM-DD hh:mm a');  // http://momentjs.com/docs/#/parsing/string-format/
    //var local_time = moment(CreatedAt).local().format('M/D/YYYY hh:mm a');  // http://momentjs.com/docs/#/parsing/string-format/
    var local_time = moment(CreatedAt).local().format('dddd, MMMM DD, YYYY h:mm A');  // http://momentjs.com/docs/#/parsing/string-format/
    return local_time;
}

function format_date_time(date_time) {
    return kendo.toString(date_time, "dddd, MMMM dd, yyyy h:mm tt");  // http://docs.telerik.com/kendo-ui/framework/globalization/dateformatting
}

function format_full_date_time(date_time_formatted) {
    var parsed_date = kendo.parseDate(date_time_formatted, "dddd, MMMM dd, yyyy h:mm tt");
    return kendo.toString(parsed_date, "u");  // http://docs.telerik.com/kendo-ui/framework/globalization/dateformatting
}

function precise_round(num, decimals) {
    var t = Math.pow(10, decimals);
    return (Math.round((num * t) + (decimals > 0 ? 1 : 0) * (Math.sign(num) * (10 / Math.pow(100, decimals)))) / t).toFixed(decimals);
}

// turns an array into one with only unique numbers in it
function array_unique(arr) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        if (result.indexOf(arr[i]) === -1) {
            result.push(arr[i]);
        }
    }
    return result;
}

function format_telephone_number(telephone_number) {
    var telephone_number_formatted = "";

    try {
        var len = telephone_number.length;

        switch (len) {
            // less than 10 characters
            case 0: break;  // empty number
            case 8: {
               telephone_number_formatted = telephone_number.replace(/(\d{1})(\d{3})(\d{4})/, '($1) $2-$3');
               break;
            }
            case 9: {
                telephone_number_formatted = telephone_number.replace(/(\d{2})(\d{3})(\d{4})/, '($1) $2-$3');
               break;
            }
            // no country code
            case 10: {
               telephone_number_formatted = telephone_number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
               break;
            }
            // include varying country code sizes
            case 11: {
               telephone_number_formatted = telephone_number.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
               break;
            }
            case 12: {
               telephone_number_formatted = telephone_number.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
               break;
            }
            case 13: {
               telephone_number_formatted = telephone_number.replace(/(\d{3})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
               break;
            }
            case 14: {
               telephone_number_formatted = telephone_number.replace(/(\d{4})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
               break;
            }
            case 15: {
               telephone_number_formatted = telephone_number.replace(/(\d{5})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
               break;
            }
            case 16: {
               telephone_number_formatted = telephone_number.replace(/(\d{6})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
               break;
            }
            default: {
                console.error(arguments.callee.name + " >> ERROR >> telephone_number length not handled >> " + len);
                break;
            }
        }
    }
    catch (e) {
        console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
    }
    return telephone_number_formatted;
}

var grid_common_options = {
    reorderable: true,
    resizable: true,
    columnMenu: true,
    groupable: false,
    navigatable: true,
    filterable: true,
    scrollable: true,
    allowCopy: true,
    mobile: true,
    editable: "inline",
    pageable: {
        refresh: true,
        input: true,
        pageSizes: true,
    },
    sortable: {
        mode: "multiple"
    },
    //selectable: "row single",
    selectable: false,
    toolbar: ["create"],
};

var app_skins = [
    { text: "Bootstrap", value: 1, name: "bootstrap" },
    { text: "Nova", value: 2, name: "nova" },
    { text: "Material-Light", value: 3, name: "material" },
    { text: "Material-Dark", value: 4, name: "materialblack" },
    { text: "Fiori", value: 5, name: "fiori" },
    { text: "Office 365", value: 6, name: "office365" },
]

// Global ajax Setup
var ajax_timer;

$(document).ajaxStart(function ajaxStart() {
    try {
        clearTimeout(ajax_timer);
        app.showLoading();
    }
    catch (e) {
        console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
        screen_popup_no_hide.error({ message: "Error: " + e.toString() });
    }
}); // when the first Ajax request begins

$(document).ajaxError(function ajaxError(event, jqXHR, ajaxSettings, thrownError) {
    try {
        var url = ajaxSettings.url;
        var http_status_code = jqXHR.status;
        var response = jqXHR.responseText;
        var message = "";
        if (isJson(response)) {
            var json_obj = JSON.parse(response);
            if (json_obj.hasOwnProperty("message")) {
                message = "  " + json_obj.message;
            }
            else if (json_obj.hasOwnProperty("description")) {
                message = json_obj.description;
            }
        }
        var error_str = "";

        // 1. handle HTTP status code
        switch (http_status_code) {
            case 0: {
                error_str = "No Connection.  Cannot connect to " + new URL(url).hostname + ".";
                break;
            }   // No Connection
            case 400: {
                if (message) {
                    var pos = message.indexOf("The particular issue is: ");
                    if (pos > -1) {
                        message = message.substring(pos + 25, message.length);
                    }
                    error_str = "Bad Request.  " + message;
                }
                else {
                    error_str = "Bad Request.  Please see help.";
                }
                break;
            }   // Bad Request
            case 401: {
                error_str = "Unauthorized." + message + "  Please see help.";
                break;
            }   // Unauthorized
            case 402: {
                error_str = "Request Failed." + message;
                break;
            }   // Request Failed
            case 404: {
                error_str = "Not Found." + message + "  Please see help.";
                break;
            }   // Not Found
            case 405: {
                error_str = "Method Not Allowed." + message + "  Please see help.";
                break;
            }   // Method Not Allowed
            case 409: {
                error_str = "Conflict." + message + "  Please see help.";
                break;
            }   // Conflict
            case 429: {
                error_str = "Too Many Requests." + message + "  Please try again later.";
                break;
            }   // Too Many Requests
            case 500: {
                if (message) {
                    error_str = message;
                }
                else {
                    error_str = "Internal Server Error.  Please see help.";
                }
                break;
            }   // Internal Server Error
            case 502: {
                error_str = "Bad Gateway." + message + "  Please see help.";
                break;
            }   // Bad Gateway
            case 503: {
                error_str = "Service Unavailable." + message + "  Please see help.";
                break;
            }   // Service Unavailable
            case 504: {
                error_str = "Gateway Timeout." + message + "  Please see help.";
                break;
            }   // Gateway Timeout
            default: {
                console.error(arguments.callee.name + " >> http_status_code unhandled >> http_status_code = " + http_status_code);
                error_str = "Unknown Error." + message + "  Please see help.";
                break;
            }
        }

        // 2. show popup
        screen_popup_no_hide.error({ message: error_str });
        console.error(arguments.callee.name + " >> http_status_code = " + http_status_code.toString() + "; thrownError = " + thrownError + "; URL = " + url + "; Response = " + response);

    }
    catch (e) {
        console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
        screen_popup_no_hide.error({ message: "Error: " + e.toString() });
    }
});

$(document).ajaxStop(function ajaxStop() {
    try {
        // delay to avoid loading icon disappearing and reappearing quickly
        ajax_timer = setTimeout(function () {
            app.hideLoading();
        }, 250);
    }
    catch (e) {
        console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
        screen_popup_no_hide.error({ message: "Error: " + e.toString() });
    }
}); // when all Ajax requests have completed

/////// Miscellaneous ///////

// Dialogs
function delete_dialog_yes () {
    try {
        var screen = main_pane.view().id;
        screen = screen.slice(1, screen.length);    // remove first hashmark "#"
        APP.models[screen].delete_button_click_yes();
    }
    catch (e) {
        console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
        screen_popup.error("Internal Error.  Please see help.");
    }

    return true;
}
function open_delete_dialog() {
    try {
        var screen = main_pane.view().id;
        var dialog_id = screen + "_dialog";
        var dialog = $(dialog_id).data("kendoDialog");
        dialog.open();
    }
    catch (e) {
        console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
        screen_popup.error("Internal Error.  Please see help.");
    }

    return;
}
function close_dialog() {
    return true;
};
function logout_dialog_yes() {
    try {
        APP.models.main_splitter_header.logout_click_yes();
    }
    catch (e) {
        console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
        screen_popup.error("Internal Error.  Please see help.");
    }

    return;
};

function initMaps() {
    //APP.models.login_window.initialize_google();
};

function isChrome() {
    var isChromium = window.chrome,
      winNav = window.navigator,
      vendorName = winNav.vendor,
      isOpera = winNav.userAgent.indexOf("OPR") > -1,
      isIEedge = winNav.userAgent.indexOf("Edge") > -1,
      isIOSChrome = winNav.userAgent.match("CriOS");

    if (isIOSChrome) {
        return true;
    } else if (
      isChromium !== null &&
      typeof isChromium !== "undefined" &&
      vendorName === "Google Inc." &&
      isOpera === false &&
      isIEedge === false
    ) {
        return true;
    } else {
        return false;
    }
}

/* Saved Code
*******************************************************************************************
function empty_function() {
    try {

    }
    catch (e) {
        console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
        screen_popup.error("Internal Error.  Please see help.");
    }

    return;
}
*******************************************************************************************

*/