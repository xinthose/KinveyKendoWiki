/*
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code bundle.
 */

const app_version = "1.08";
const app_testing = false;   /*** Change for Production ***/
const skip_login = false;   /*** Change for Production ***/
const chat_used = true;
const ldap_auto_login_used = false;

// Kinvey
const kinvey_development_mode = false; // *** Change for Production ***
var kinvey_appKey = "",
    kinvey_appSecret = "";
if (kinvey_development_mode) {
    kinvey_appKey = "kid_rJ_wACUYf";
    kinvey_appSecret = "3a98c0a5fedb4a83ae04ff308d20d3df";
} else {
    kinvey_appKey = "kid_HJqEBtNWz";
    kinvey_appSecret = "e67314acfb6443a0870e2b8a60cf3167";
}
const kinvey_host_url = "https://baas.kinvey.com";

// everlive
const ever_live_base_url = "http://api.everlive.com/v1/";
const el_app_id = "lx20s2d5unufm8zs";   // EleMech_Wiki
var el = new Everlive({
    appId: el_app_id,	// EleMech_Wiki
    scheme: 'https'
});
const role_default = "47118230-82da-11e6-bdfa-0d54c0b65d26";
const role_editor = "88aa0490-2fb1-11e7-aa94-cbd6a7f6b780";
const role_admin = "e7839bd0-f90a-11e6-bed2-fdb7f2ad6e99";
const max_num_search_words = 10;
