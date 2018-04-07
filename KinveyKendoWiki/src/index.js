/*
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code bundle.
 */

/******************************** Global Variables ***********************************/
var app, router, online = false, local_storage_used = false, check_online_interval, user_id, role;
var main_pane_search_screen_listview_index = 0;
/******* Popups, Windows, & Dialogs *******/
var screen_popup, screen_popup_no_hide, login_window, fun_window, help_window, about_window, main_pane_customer_information_details_window, logout_dialog;
/******* Panes *******/
var left_pane, main_pane, right_pane;

/******************************** Main Code ***********************************/

window.APP = {
    models: {
        /******************** Login Window ********************/
        login_window: kendo.observable({
            user_name: "", password: "", email: "", display_name: "", quicklinks: [],
            // functions
            submit_button_click: function () {
                try {
                    var loc = "login_window >> submit_button_click >> ";
                    var debug = false;

                    // 1. validate data
                    if (!isChrome()) {
                        screen_popup.warning("You are not using Google Chrome.  Please try again.");
                        return;
                    }
                    var validator = $("#login_window").data("kendoValidator");
                    if (!validator.validate()) {
                        console.warn(loc + "validation failed");
                        return;
                    }

                    // 2. get data
                    var user_name = $("#login_window_user_name").val();
                    var password = $("#login_window_password").val();

                    // 3. set data
                    this.set("user_name", user_name);
                    this.set("password", password);

                    // 4. submit data
                    app.showLoading();
                    el.authentication.login(user_name, password,
						function (data) {
						    try {
						        if (debug) console.info(loc + "SUCCESS >> " + JSON.stringify(data));
						        user_id = data.result.principal_id;

						        if (local_storage_used) {
						            localStorage.setItem("user_name", user_name);
						        }

						        APP.models.login_window.get_user_info();
                            }
						    catch (e) {
						        console.error(loc + e.toString());
						        screen_popup.error("Internal error.  Please see help.");
						    }
						},
						function (error) {
						    try {
						        console.warn(loc + "ERROR >> " + JSON.stringify(error));
						        screen_popup.warning(error.message);
						    }
						    catch (e) {
						        console.error(loc + e.toString());
						        screen_popup.error("Internal error.  Please see help.");
						    }
						}
					);

                    app.hideLoading();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                    app.hideLoading();
                }
            },
            cancel_button_click: function cancel() {
                try {
                    this.set("user_name", "");
                    this.set("password", "");

                    $("#login_window_user_name").focus();

                    var validator = $("#login_window").data("kendoValidator");
                    validator.hideMessages();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            get_user_info: function get_user_info() {
                try {
                    var loc = "login_window >> get_user_info >> ";
                    var debug = false;
                    
                    app.showLoading();
                    el.Users.currentUser()
						.then(function (data) {
						    try {
						        if (debug) console.info(loc + "SUCCESS >> " + JSON.stringify(data));
						        var empty_array = [];

                                // 1. get data
                                var email_address = data.result.Email;
                                var display_name = data.result.DisplayName;
                                role = data.result.Role;
                                var theme_num = data.result.ThemeNumber;
                                var quicklinks = data.result.Quicklinks;
                                var skin_num = data.result.AppSkinNumber;

                                var user_name = APP.models.login_window.get("user_name");
                                var password = APP.models.login_window.get("password");

                                if (debug) console.info(loc + "user_name = " + user_name + "; password = " + password + "; email_address = " + email_address);

                                // 2. set user information
                                APP.models.login_window.set("email", email_address);
                                APP.models.login_window.set("display_name", display_name);
                                APP.models.main_pane_profile_screen.set("skin_num", skin_num);
                                if (quicklinks != null) {
                                    APP.models.login_window.set("quicklinks", quicklinks);
                                }
                                else {
                                    APP.models.login_window.set("quicklinks", empty_array);
                                }   // set quicklinks to an empty array, not null
                                switch (theme_num) {
                                    case 1: {
                                        break;
                                    }
                                    case 2: {
                                        $('head').append('<link rel="stylesheet" type="text/css" href="src/theme_colors/red_theme.css">');
                                        break;
                                    }
                                    case 3: {
                                        $('head').append('<link rel="stylesheet" type="text/css" href="src/theme_colors/green_theme.css">');
                                        break;
                                    }
                                    case 4: {
                                        $('head').append('<link rel="stylesheet" type="text/css" href="src/theme_colors/blue_theme.css">');
                                        break;
                                    }
                                    case 5: {
                                        $('head').append('<link rel="stylesheet" type="text/css" href="src/theme_colors/light_theme.css">');
                                        break;
                                    }
                                    case 6: {
                                        $('head').append('<link rel="stylesheet" type="text/css" href="src/theme_colors/dark_theme.css">');
                                        break;
                                    }
                                    default: {
                                        console.log(loc + "ERROR >> theme_num unhandled >> " + theme_num.toString());
                                        screen_popup.error("Internal error.  Please see help.");
                                        break;
                                    }
                                }

                                // 3. set display name on each view
                                APP.models.main_splitter_header.set("display_name", display_name);

						        // 4. update quicklinks
                                APP.models.main_pane_edit_quicklinks_screen.filter_dataSources();

						        // 5. login to chat
                                if (chat_used) {
                                    if (app_testing) {
                                        converse.initialize({
                                            bosh_service_url: 'http://localhost:7070/http-bind/',
                                            show_controlbox_by_default: true,
                                            muc_nickname_from_jid: true,
                                            hide_muc_server: true,
                                            muc_domain: "conference.desktop-bn13agh",
                                            debug: true,
                                            auto_login: true,
                                            auto_list_rooms: true,
                                            auto_reconnect: true,
                                            allow_logout: false,
                                            locked_domain: "elemechinc.com",
                                            jid: email_address,
                                            password: password,
                                            message_archiving: "always",
                                            play_sounds: true,
                                            sounds_path: "/osrc/converse/sounds/",
                                            notification_icon: "/osrc/converse/logo/conversejs.png",
                                            use_emojione: true,
                                            emojione_image_path: "/osrc/converse/EmojiOne_3.1.1_128x128_png/",
                                        });
                                    }
                                    else {
                                        converse.initialize({
                                            bosh_service_url: 'http://10.1.1.7:7070/http-bind/',
                                            show_controlbox_by_default: true,
                                            muc_nickname_from_jid: true,
                                            hide_muc_server: true,
                                            muc_domain: "conference.eds.elemech.local",
                                            debug: false,
                                            auto_login: true,
                                            auto_list_rooms: true,
                                            auto_reconnect: true,
                                            allow_logout: false,
                                            locked_domain: "elemechinc.com",
                                            jid: email_address,
                                            password: password,
                                            message_archiving: "always",
                                            play_sounds: true,
                                            sounds_path: "/osrc/converse/sounds/",
                                            notification_icon: "/osrc/converse/logo/conversejs.png",
                                            use_emojione: true,
                                            emojione_image_path: "/osrc/converse/EmojiOne_3.1.1_128x128_png/"
                                        });
                                    }
                                }

						        // 6. set skin
                                var skin_name = app_skins[skin_num - 1].name;
                                // a. remove default stylesheets
                                $('link[rel=stylesheet][href~="kendo/styles/kendo.common.min.css"]').remove();
                                $('link[rel=stylesheet][href~="kendo/styles/kendo.default.min.css"]').remove();
						        // b. include correct CSS files
                                switch (skin_num) {
                                    case 1: {
                                        $("head").prepend('<link rel="stylesheet" type="text/css" href="kendo/styles/kendo.common-bootstrap.min.css">');
                                        $("head").prepend('<link rel="stylesheet" type="text/css" href="kendo/styles/kendo.bootstrap.min.css">');
                                        break;
                                    }   // Bootstrap
                                    case 2: {
                                        $("head").prepend('<link rel="stylesheet" type="text/css" href="kendo/styles/kendo.common-nova.min.css">');
                                        $("head").prepend('<link rel="stylesheet" type="text/css" href="kendo/styles/kendo.nova.min.css">');
                                        break;
                                    }   // Nova
                                    case 3: {
                                        $("head").prepend('<link rel="stylesheet" type="text/css" href="kendo/styles/kendo.common-material.min.css">');
                                        $("head").prepend('<link rel="stylesheet" type="text/css" href="kendo/styles/kendo.material.min.css">');
                                        break;
                                    }   // Material-Light
                                    case 4: {
                                        $("head").prepend('<link rel="stylesheet" type="text/css" href="kendo/styles/kendo.common-material.min.css">');
                                        $("head").prepend('<link rel="stylesheet" type="text/css" href="kendo/styles/kendo.materialblack.min.css">');
                                        break;
                                    }   // Material-Dark
                                    case 5: {
                                        $("head").prepend('<link rel="stylesheet" type="text/css" href="kendo/styles/kendo.common-fiori.min.css">');
                                        $("head").prepend('<link rel="stylesheet" type="text/css" href="kendo/styles/kendo.fiori.min.css">');
                                        break;
                                    }   // Fiori
                                    case 6: {
                                        $("head").prepend('<link rel="stylesheet" type="text/css" href="kendo/styles/kendo.common-office365.min.css">');
                                        $("head").prepend('<link rel="stylesheet" type="text/css" href="kendo/styles/kendo.office365.min.css">');
                                        break;
                                    }   // Office 365
                                    default: {
                                        console.log(loc + "ERROR >> skin_num unhandled >> skin_num = " + skin_num.toString());
                                        screen_popup.error("Internal error.  Please see help.");
                                        break;
                                    }
                                }
						        // c. set skin on app
                                app.skin(skin_name);

						        // 6. close login window and navigate to home screen
                                var screen = main_pane.view().id;
                                if (screen == "#main_pane_blank") {
                                    login_window.close();
                                    fun_window.close();
                                    main_pane.navigate("#main_pane_home_screen");
                                }
                            }
						    catch (e) {
						        console.error(loc + e.toString());
						        screen_popup.error("Internal error.  Please see help.");
						    }
						},
						function (error) {
						    try {
						        console.warn(loc + "ERROR >> " + JSON.stringify(error));
						        screen_popup.warning(error.message);
						    }
						    catch (e) {
						        console.error(loc + e.toString());
						        screen_popup.error("Internal error.  Please see help.");
						    }
						});
                    app.hideLoading();                    
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            logout: function logout() {
                try {
                    var debug = false;
                    var loc = "login_window >> logout >> ";

                    el.authentication.logout(
						function (data) {
						    try {
						        console.log(loc + "SUCCESS >> " + JSON.stringify(data));

                                // 1. reset
						        left_pane.navigate("#left_pane_home_screen");
						        main_pane.navigate("#main_pane_blank");
						        APP.models.login_window.cancel_button_click();
						        APP.models.main_splitter_header.set("display_name", "");
						        role = "";

                                // 2. setup for next login
						        if (local_storage_used) {
						            var user_name = localStorage.getItem("user_name");
						            $("#login_window_user_name").data("kendoMaskedTextBox").value(user_name);   // more reliable than data-binding
						            if (user_name) {
						                $("#login_window_password").focus();
						            }
						            else {
						                $("#login_window_user_name").focus();
						            }
						        }
						        fun_window.open().maximize();
						        login_window.open().center();

						        // 3. log out of chat
						        //window.converse_logout();

						        // 4. restart tetris
						        $("#tetris").blockrain("restart");
                            }
						    catch (e) {
						        console.error(loc + e.toString());
						        screen_popup.error("Internal error.  Please see help.");
						    }
						},
						function (error) {
						    try {
						        console.log(loc + "ERROR >> " + JSON.stringify(error));
						        screen_popup.error(error.message);
						    }
						    catch (e) {
						        console.error(loc + e.toString());
						        screen_popup.error("Internal error.  Please see help.");
						    }
						}
					);
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            help_button_click: function help_button_click() {
                try {
                    help_window.center().open();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal Error.  Please see help.");
                }
            },
            about_button_click: function about_button_click() {
                try {
                    about_window.center().open();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal Error.  Please see help.");
                }
            },
        }),
        forgot_password_screen: kendo.observable({
            user_name: "",
            // functions
            after_show: function after_show() {
                try {
                    this.cancel();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            cancel: function cancel() {
                try {
                    this.set("user_name", "");
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            submit: function submit() {
                try {
                    var debug = false;
                    var loc = "forgot_password_screen >> submit >> ";

                    // 1. get data
                    var user_name = this.get("user_name");

                    // 2. send data
                    var data = {
                        user_name: user_name
                    };
                    el.users.resetPassword(data,
						function (data) {
						    try {
						        console.log(loc + "SUCCESS >> " + JSON.stringify(data));
						        screen_popup_short.success("Password reset email sent.");
						    }
						    catch (e) {
						        console.error(loc + e.toString());
						        screen_popup.error("Internal error.  Please see help.");
						    }
						},
						function (error) {
						    try {
						        console.log(loc + "ERROR >> " + JSON.stringify(error));
						        screen_popup.error(error.message);
						    }
						    catch (e) {
						        console.error(loc + e.toString());
						        screen_popup.error("Internal error.  Please see help.");
						    }
						});
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),
        /******************** Main Splitter Header ********************/
        main_splitter_header: kendo.observable({
            title: "EleMech Wiki", display_name: "",
            // functions
            toggle_menu_button_click: function toggle_menu_button_click() {
                try {
                    $(".rotate").toggleClass("down");
                    $("#left_pane").toggle("slide", { direction: "left" }, 500);
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
                    screen_popup.error("Internal Error.  See Help.");
                }
            },
            home_button_click: function home_button_click() {
                try {
                    // 1. get data
                    var editor_changed = APP.models.main_pane_topic_content.get("editor_changed");

                    // 2. check for editor edits
                    if (editor_changed) {
                        var response = confirm("You have unsaved changes.  Are you sure you want to leave this page?");
                        if (!response) return;
                    }

                    // 3. navigate
                    main_pane.navigate('#main_pane_home_screen');
                    if ($("#left_pane").is(":visible")) {
                        setTimeout(function () {
                            left_pane.navigate('#left_pane_home_screen');
                        }, 100);
                    }   // navigating with pane hidden causes it to stop working               
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
                    screen_popup.error("Internal Error.  See Help.");
                }
            },
            help_click: function help_click() {
                try {
                    help_window.center().open();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal Error.  Please see help.");
                }
            },
            about_click: function about_click() {
                try {
                    about_window.center().open();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal Error.  Please see help.");
                }
            },
            // Logout
            logout_click: function logout_click() {
                try {
                    // 1. get data
                    var editor_changed = APP.models.main_pane_topic_content.get("editor_changed");

                    // 2. check for editor edits
                    if (editor_changed) {
                        var response = confirm("You have unsaved changes.  Are you sure you want to leave this page?");
                        if (!response) return;
                    }

                    // 3. open dialog
                    logout_dialog.open();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal Error.  Please see help.");
                }
            },
            logout_click_yes: function logout_click_yes() {
                try {
                    APP.models.login_window.logout();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal Error.  Please see help.");
                }

                return true;
            },
        }),
        /******************** Main Pane ********************/
        main_pane_home_screen: kendo.observable({
            topics_ds: new kendo.data.DataSource({
                type: 'everlive',
                transport: {
                    typeName: "Topics"
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            Id: { editable: false },
                            CreatedAt: { editable: false },
                            ModifiedAt: { editable: false },
                            Owner: { editable: false },
                            Content: { editable: true },
                            Name: { editable: true },
                            Tags: { editable: true },
                            ParentTopicId: { editable: true },
                        }
                    }
                },
                serverSorting: true,
                sort: {
                    field: "Name",
                    dir: "asc", // (asc)ending, (desc)ending
                },
                serverFiltering: true,
            }),
            // functions
            before_show: function before_show() {
                try {
                    var debug = false;
                    var loc = "main_pane_home_screen >> before_show >> ";
                    var quicklinks_ds_filter = { logic: "or", filters: [] };

                    // 1. get data
                    var dataSource = this.get("topics_ds");
                    var quicklinks = APP.models.login_window.get("quicklinks");
                    if (debug) console.log(loc + "quicklinks = " + JSON.stringify(quicklinks));

                    if (quicklinks.length) {
                        // 2. build filter
                        for (var i = 0; i < quicklinks.length; i++) {
                            quicklinks_ds_filter.filters.push({
                                field: "Id", operator: "eq", value: quicklinks[i]
                            });
                        }
                        if (debug) console.log(loc + "quicklinks_ds_filter = " + JSON.stringify(quicklinks_ds_filter));

                        // 3. filter data
                        dataSource.filter(quicklinks_ds_filter);
                    }
                    else {
                        dataSource.filter({
                            field: "Id", operator: "eq", value: "DNE"
                        });
                    }   // filter dataSource to zero items
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            get_topics: function get_topics() {
                try {
                    var loc = "main_pane_home_screen >> get_topics >> ";
                    var debug = false, debug1 = false;
                    var dataSource = new kendo.data.DataSource();

                    app.showLoading();

                    // 1. get data
                    var quicklinks = APP.models.login_window.get("quicklinks");
                    if (debug1) console.info(loc + "quicklinks = " + JSON.stringify(quicklinks));

                    // 2. query data
                    var query = new Everlive.Query();
                    query.select("Name", "TopicNumber");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            if (debug) console.info(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. a. build topics dataSource
                                for (var i = 0; i < data.count; i++) {
                                    var name = data.result[i].Name;
                                    var number = data.result[i].TopicNumber;
                                    dataSource.add({
                                        name: name, number: number
                                    });
                                }
                                // 1. b. set dataSource
                                APP.models.main_pane_home_screen.set("topics_ds", dataSource);

                                // 2. c. set quicklinks
                                APP.models.main_pane_home_screen.set_quicklinks();
                            }
                            else {
                                console.log(arguments.callee.name + " >> ERROR >> no data");
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();

                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            set_quicklinks: function set_quicklinks() {
                try {
                    var loc = "main_pane_home_screen >> get_topics >> ";
                    var debug = false;
                    var topics_ds = this.get("topics_ds");
                    var dataSource = new kendo.data.DataSource();

                    app.showLoading();

                    // 1. get data
                    var quicklinks = APP.models.login_window.get("quicklinks");

                    // 2. query data
                    if (!quicklinks.length) {
                        console.info(loc + "user has no quicklinks");
                    }
                    else {
                        // 2. a. filter data
                        for (var i = 0; i < quicklinks.length; i++) {
                            topics_ds.filter({ field: "number", operator: "eq", value: quicklinks[i] });
                            var view = topics_ds.view();

                            // 2. b. build listView dataSource
                            if (view.length) {
                                var name = view[0].name;
                                var number = view[0].number;
                                dataSource.add({
                                    name: name, number: number
                                });
                            }
                            else {
                                console.warn("filter has no results");
                            }
                        }
                    }

                    // 3. set data
                    dataSource.sort({ field: "name", dir: "asc" });
                    this.set("quicklinks_ds", dataSource);
                    var listView1 = $("#main_pane_edit_quicklinks_screen_current_list").data("kendoListView");
                    listView1.setDataSource(dataSource);
                    APP.models.main_pane_edit_quicklinks_screen.get_filtered_topics();

                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            quicklink_click: function quicklink_click(e) {
                try {
                    var loc = "main_pane_home_screen >> quicklink_click >> ";
                    var debug = false;
                    var topic_id = e.data.id;

                    if (debug) console.log(loc + "topic_id = " + topic_id.toString());

                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("Id", topic_id)
                    .done();
                    query.select("Content", "Name");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            if (debug) console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var content = data.result[0].Content;
                                var editor = $("#main_pane_topic_content_editor").data("kendoEditor");
                                var item_id = data.result[0].Id;
                                var name = data.result[0].Name;

                                // 2. set data
                                if (content) {
                                    editor.value(content);
                                }
                                else {
                                    editor.value("");
                                }	// no content, so set a blank string
                                APP.models.main_pane_topic_content.set("item_id", item_id);
                                APP.models.main_pane_topic_content.set("title", name);
                            }
                            else {
                                console.log(arguments.callee.name + " >> ERROR >> Topic does not exist in cloud");
                                screen_popup.error("Internal error.  Please see help.");
                            }

                            main_pane.navigate("main_pane_topic_content");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),
        main_pane_search_screen: kendo.observable({
            topic_id: null, tags: null, topic_id_words: null, search_logic_index: 0, search_in_progress: false,
            search_words_1: "", search_word_in_use_1: false,
            search_words_2: "", search_word_in_use_2: false,
            search_words_3: "", search_word_in_use_3: false,
            search_words_4: "", search_word_in_use_4: false,
            search_words_5: "", search_word_in_use_5: false,
            search_words_6: "", search_word_in_use_6: false,
            search_words_7: "", search_word_in_use_7: false,
            search_words_8: "", search_word_in_use_8: false,
            search_words_9: "", search_word_in_use_9: false,
            search_words_10: "", search_word_in_use_10: false,
            // dataSource
            topics_ds: new kendo.data.DataSource({
                type: 'everlive',
                transport: {
                    typeName: "Topics"
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            Id: { editable: false },
                            CreatedAt: { editable: false },
                            ModifiedAt: { editable: false },
                            Owner: { editable: false },
                            Content: { editable: true, type: "string" },
                            Name: { editable: true },
                            Tags: { editable: true },
                            ParentTopicId: { editable: true },
                        }
                    }
                },
                serverSorting: true,
                sort: {
                    field: "Name",
                    dir: "asc", // (asc)ending, (desc)ending
                },
                serverFiltering: true,
            }),
            topic_tags_ds: new kendo.data.DataSource({
                type: 'everlive',
                transport: {
                    typeName: "TopicTags"
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            Id: { editable: false },
                            CreatedAt: { editable: false },
                            ModifiedAt: { editable: false },
                            Owner: { editable: false },
                            Name: { editable: true },
                        }
                    }
                },
                serverSorting: true,
                sort: {
                    field: "Name",
                    dir: "asc", // (asc)ending, (desc)ending
                },
            }),
            search_logic_terms: new kendo.data.DataSource({
                data: [
                    { name: "And", value: 1},
                    { name: "Or", value: 2},
                ]
            }),
            search_filter_terms: new kendo.data.DataSource({
                data: [
                    { name: "Contain", value: 1},
                    { name: "Not Contain", value: 2},
                    { name: "Equal", value: 3},
                    { name: "Not Equal", value: 4},
                ]
            }),
            /// Functions
            before_show: function before_show() {
                try {
                    var debug = false;
                    var loc = "main_pane_search_screen >> before_show >> ";

                    // 1. get data
                    var search_in_progress = this.get("search_in_progress");

                    if (search_in_progress) {
                        return;
                    }
                    else {
                        this.cancel_button_click();
                    }
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            after_show: function after_show() {
                try {
                    var combobox = $("#main_pane_search_screen_topic_num").data("kendoComboBox");
                    combobox.focus();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            cancel_button_click: function cancel_button_click() {
                try {
                    var debug = false;
                    var loc = "main_pane_search_screen >> cancel_button_click >> "

                    this.set("topic_id", null);
                    this.set("tags", null);
                    this.set("topic_id_words", null);
                    this.set("search_logic_index", 0);
                    this.set("search_in_progress", false);

                    // reset listview added searches
                    var listView = $("#main_pane_search_screen_listview").data("kendoMobileListView");
                    var dataSource = new kendo.data.DataSource();
                    listView.setDataSource(dataSource);

                    this.set("search_words_1", "");
                    this.set("search_word_in_use_1", false);

                    this.set("search_words_2", "");
                    this.set("search_word_in_use_2", false);

                    this.set("search_words_3", "");
                    this.set("search_word_in_use_3", false);

                    this.set("search_words_4", "");
                    this.set("search_word_in_use_4", false);

                    this.set("search_words_5", "");
                    this.set("search_word_in_use_5", false);

                    this.set("search_words_6", "");
                    this.set("search_word_in_use_6", false);

                    this.set("search_words_7", "");
                    this.set("search_word_in_use_7", false);

                    this.set("search_words_8", "");
                    this.set("search_word_in_use_8", false);

                    this.set("search_words_9", "");
                    this.set("search_word_in_use_9", false);

                    this.set("search_words_10", "");
                    this.set("search_word_in_use_10", false);

                    // update dataSources
                    this.topics_ds.read();
                    this.topic_tags_ds.read();

                    this.topic_search_add();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            topic_navigate_tags: function topic_navigate_tags(e) {
                try {
                    var loc = "main_pane_search_screen >> topic_navigate_tags >> ";
                    var debug = false;
                    var topic_id = this.get("topic_id");

                    if (debug) console.info(loc + "topic_id = " + topic_id);

                    // 1. validate data
                    if (!topic_id) {
                        screen_popup.warning("Topic Name is blank.  Please retry.");
                        console.warn(loc + "topic number not selected");
                        return;
                    }

                    // 2. get data
                    app.showLoading();
                    var query = new Everlive.Query();
                    query.where()
                            .eq("Id", topic_id)
                    .done();
                    query.select("Content", "Name");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var content = data.result[0].Content;
                                var editor = $("#main_pane_topic_content_editor").data("kendoEditor");
                                var item_id = data.result[0].Id;
                                var name = data.result[0].Name;

                                // 2. set data
                                if (content) {
                                    editor.value(content);
                                }
                                else {
                                    editor.value("");
                                }	// no content, so set a blank string
                                APP.models.main_pane_topic_content.set("item_id", item_id);
                                APP.models.main_pane_topic_content.set("title", name);

                                APP.models.main_pane_search_screen.set("search_in_progress", true);
                            }
                            else {
                                console.log(arguments.callee.name + " >> ERROR >> Topic does not exist in cloud");
                                screen_popup.error("Internal error.  Please see help.");
                            }

                            main_pane.navigate("main_pane_topic_content");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            // search by words
            topic_search_add: function topic_search_add() {
                try {
                    var debug = false;
                    var loc = "main_pane_search_screen >> topic_search_add >> "
                    var idx = 0;

                    // 1. get data
                    var listView = $("#main_pane_search_screen_listview").data("kendoMobileListView");

                    // 2. find unused search word
                    for (var i = 1; i < max_num_search_words; i++) {
                        var search_word_in_use = this.get("search_word_in_use_" + i.toString());
                        if (!search_word_in_use) {
                            idx = i;
                            this.set("search_word_in_use_" + i.toString(), true);
                            break;
                        }
                    }
                    if (debug) console.log(loc + "idx = " + idx.toString());

                    // 2. validate data
                    if (!idx) {
                        console.warn(loc + "maximum number of search words reached");
                        screen_popup.warning("Maximum number of search words reached (" + max_num_search_words.toString() + ").");
                        return;
                    }

                    // 3. append listView item
                    listView.append([{ idx: idx }]);

                    // 4. rebind listView to model
                    kendo.bind($("#main_pane_search_screen_listview"), APP.models.main_pane_search_screen);
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            topic_search: function topic_search() {
                try {
                    // http://dojo.telerik.com/AdIVoh
                    var debug = false;
                    var loc = "main_pane_search_screen >> topic_search >> "
                    var search_words_arr = [], filters_obj;
                    var ds_filter = { logic: "", filters: [] };
                    var index_str, search_words, search_logic_index, search_filter_index, search_logic, search_filter;

                    // 1. get data
                    var search_logic_index = this.get("search_logic_index");
                    var dataSource = this.get("topics_ds");
                    for (var i = 1; i < max_num_search_words; i++) {
                        var search_word_in_use = this.get("search_word_in_use_" + i.toString());
                        if (search_word_in_use) {
                            search_words_arr.push(i);
                        }
                    }
                    if (debug) console.info(loc + "search_words_arr = " + JSON.stringify(search_words_arr));

                    // 2. build filter
                    switch (search_logic_index) {
                        case 0: {
                            search_logic = "and";
                            break;
                        }
                        case 1: {
                            search_logic = "or";
                            break;
                        }
                        default: {
                            console.info(loc + "ERROR >> search_logic_index unhandled >> " + search_logic_index);
                            screen_popup.error("Internal error.  Please see help.");
                            break;
                        }
                    }
                    ds_filter.logic = search_logic;
                    for (var i = 0; i < search_words_arr.length; i++) {
                        // a. get data
                        index_str = search_words_arr[i].toString();
                        search_words = this.get("search_words_" + index_str);

                        // b. create filter object
                        filters_obj = {
                            field: "Content", operator: "contains", value: search_words
                        };

                        // c. push to filter
                        ds_filter.filters.push(filters_obj);
                    }
                    if (debug) console.info(loc + "ds_filter = " + JSON.stringify(ds_filter));

                    // 3. filter data
                    dataSource.filter(ds_filter);

                    // 4. open dropDownList
                    var dropdownlist = $("#main_pane_search_screen_topic_id_words").data("kendoDropDownList");
                    dropdownlist.open();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            remove_search_words: function remove_search_words(e) {
                try {
                    var debug = false;
                    var loc = "main_pane_search_screen >> remove_search_words >> "

                    // 1. get data
                    var idx = $(event.currentTarget).data('id');
                    var idx_str = idx.toString();
                    if (debug) console.info(loc + "idx = " + idx_str);

                    // 2. remove item
                    $("#main_pane_search_screen_listview_template_" + idx_str).parent().remove();

                    // 3. set data
                    this.set("search_word_in_use_" + idx_str, false);
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            topic_navigate_words: function topic_navigate_words(e) {
                try {
                    var loc = "main_pane_search_screen >> topic_navigate_words >> ";
                    var debug = false;
                    var topic_id_words = this.get("topic_id_words");

                    if (debug) console.info(loc + "topic_id_words = " + topic_id_words);

                    // 1. validate data
                    if (!topic_id_words) {
                        screen_popup.warning("Search is blank.  Please retry.");
                        console.warn(loc + "topic_id_words not selected");
                        return;
                    }

                    // 2. get data
                    app.showLoading();
                    var query = new Everlive.Query();
                    query.where()
                            .eq("Id", topic_id_words)
                    .done();
                    query.select("Content", "Name");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var content = data.result[0].Content;
                                var editor = $("#main_pane_topic_content_editor").data("kendoEditor");
                                var item_id = data.result[0].Id;
                                var name = data.result[0].Name;

                                // 2. set data
                                if (content) {
                                    editor.value(content);
                                }
                                else {
                                    editor.value("");
                                }	// no content, so set a blank string
                                APP.models.main_pane_topic_content.set("item_id", item_id);
                                APP.models.main_pane_topic_content.set("title", name);

                                APP.models.main_pane_search_screen.set("search_in_progress", true);
                            }
                            else {
                                console.log(loc + " >> ERROR >> Topic does not exist in cloud");
                                screen_popup.error("Internal error.  Please see help.");
                            }

                            main_pane.navigate("main_pane_topic_content");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            // combobox
            topic_num_change: function topic_num_change(e) {
                try {
                    var found = false;
                    var combobox = $("#main_pane_search_screen_topic_num").data("kendoComboBox");
                    var topic_id = e.data.topic_id;
                    var dataSource = this.get("topics_ds");
                    var data = dataSource.data();
                    var data_length = data.length;
                    if (data_length) {
                        for (var i = 0; i < data_length; i++) {
                            if (data[i].Id === topic_id) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            this.set("topic_id", data[0].Id);
                            combobox.select(0);
                        }
                    }
                    else {
                        this.set("topic_id", null);
                    }
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
                    screen_popup.error("Internal Error.  Please see help.");
                }
            },
            tags_change: function tags_change() {
                try {
                    var loc = "main_pane_search_screen >> tags_change >> ";
                    var debug = false;

                    // 1. get data
                    var dataSource = this.get("topics_ds");
                    var tags = this.get("tags");
                    var combobox = $("#main_pane_search_screen_topic_num").data("kendoComboBox");

                    // 2. filter dataSource and search its first field
                    if (tags.length > 0) {
                        // a. filter dataSource
                        dataSource.filter({
                            field: "Tags",
                            operator: "eq",
                            value: tags,
                        });
                        // b. search first field
                        var dataItem = combobox.dataItem(0);
                        if (dataItem != null) {
                            combobox.search(dataItem.Name);
                        }
                    }
                    else {
                        dataSource.filter({});
                        combobox.close();
                    }   // remove filter if tags are empty
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            // buttongroup
            search_logic_select: function search_logic_select(e) {
                try {
                    var loc = "main_pane_search_screen >> search_logic_select >> ";
                    var debug = false;

                    // 1. get data
                    var index = this.current().index();
                    if (debug) console.info(loc + "index = " + index.toString());

                    // 2. set data
                    APP.models.main_pane_search_screen.set("search_logic_index", index);
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            // DropDownList
            replaceMobileDropdownList: function () {
                var popups = $("body").find("div[data-role='popup']");
                // bind open event
                $.each(popups, function (i, element) {
                    $(element).data("kendoPopup").bind("open", function (e) {
                        var w = $(e.sender.wrapper);
                        w.switchClass("km-popup km-widget", "k-popup k-widget", 0);
                    });
                });
            },
        }),
        main_pane_edit_quicklinks_screen: kendo.observable({
            quicklinks_ds: new kendo.data.DataSource({
                type: 'everlive',
                transport: {
                    typeName: "Topics"
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            Id: { editable: false },
                            CreatedAt: { editable: false },
                            ModifiedAt: { editable: false },
                            Owner: { editable: false },
                            Content: { editable: true },
                            Name: { editable: true },
                            Tags: { editable: true },
                            ParentTopicId: { editable: true },
                        }
                    }
                },
                serverSorting: true,
                sort: {
                    field: "Name",
                    dir: "asc", // (asc)ending, (desc)ending
                },
                serverFiltering: true,
            }),
            topics_ds: new kendo.data.DataSource({
                type: 'everlive',
                transport: {
                    typeName: "Topics"
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            Id: { editable: false },
                            CreatedAt: { editable: false },
                            ModifiedAt: { editable: false },
                            Owner: { editable: false },
                            Content: { editable: true },
                            Name: { editable: true },
                            Tags: { editable: true },
                            ParentTopicId: { editable: true },
                        }
                    }
                },
                serverSorting: true,
                sort: {
                    field: "Name",
                    dir: "asc", // (asc)ending, (desc)ending
                },
                serverFiltering: true,
            }),
            // functions
            before_show: function before_show() {
                try {
                    this.quicklinks_ds.read();
                    this.topics_ds.read();

                    this.filter_dataSources();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            filter_dataSources: function filter_dataSources() {
                try {
                    var debug = false;
                    var loc = "main_pane_edit_quicklinks_screen >> filter_dataSources >> ";
                    var quicklinks_ds_filter = { logic: "or", filters: [] };
                    var topics_ds_filter = { logic: "and", filters: [] };

                    // 1. get data
                    var quicklinks_ds = this.get("quicklinks_ds");
                    var topics_ds = this.get("topics_ds");
                    var quicklinks = APP.models.login_window.get("quicklinks");
                    if (debug) console.log(loc + "quicklinks = " + JSON.stringify(quicklinks));

                    if (quicklinks.length) {
                        // 2. build filter arrays
                        for (var i = 0; i < quicklinks.length; i++) {
                            quicklinks_ds_filter.filters.push({
                                field: "Id", operator: "eq", value: quicklinks[i]
                            });
                            topics_ds_filter.filters.push({
                                field: "Id", operator: "neq", value: quicklinks[i]
                            });
                        }

                        // 3. filter data
                        quicklinks_ds.filter(quicklinks_ds_filter);
                        topics_ds.filter(topics_ds_filter);
                    }
                    else {
                        quicklinks_ds.filter({
                            field: "Id", operator: "eq", value: "DNE"
                        });
                    }   // filter quicklinks dataSource to zero items
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            delete_quicklink: function delete_quicklink(e) {
                try {
                    var loc = "main_pane_edit_quicklinks_screen >> delete_quicklink >> ";
                    var debug = false;

                    // 1. get data
                    var topic_id = $(event.currentTarget).data('id');
                    var quicklinks = APP.models.login_window.get("quicklinks");

                    // 2. remove number from array
                    quicklinks = quicklinks.filter(function (e) { return e !== topic_id })
                    if (debug) console.info(loc + "topic_id = " + topic_id + "; quicklinks = " + JSON.stringify(quicklinks));

                    // 3. set data
                    app.showLoading();
                    var data = el.data("Users");
                    data.updateSingle({ Id: user_id, Quicklinks: quicklinks },
                        function (data) {
                            if (debug) console.info(loc + "SUCCESS >> " + JSON.stringify(data));
                            var empty_array = [];

                            // a. set quicklinks
                            if (quicklinks != null) {
                                APP.models.login_window.set("quicklinks", quicklinks);
                            }
                            else {
                                APP.models.login_window.set("quicklinks", empty_array);
                            }   // set quicklinks to an empty array, not null

                            // b. update quicklinks
                            APP.models.main_pane_edit_quicklinks_screen.filter_dataSources();

                            // c. display popup
                            screen_popup_short.success("Delete successful.");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            add_quicklink: function add_quicklink(e) {
                try {
                    var loc = "main_pane_edit_quicklinks_screen >> add_quicklink >> ";
                    var debug = false;

                    // 1. get data
                    var topic_id = $(event.currentTarget).data('id');
                    var quicklinks = APP.models.login_window.get("quicklinks");

                    // 2. add number to array
                    quicklinks.push(topic_id);
                    if (debug) console.info(loc + "topic_id = " + topic_id + "; quicklinks = " + JSON.stringify(quicklinks));

                    // 3. set data
                    app.showLoading();
                    var data = el.data("Users");
                    data.updateSingle({ Id: user_id, Quicklinks: quicklinks },
                        function (data) {
                            if (debug) console.info(loc + "SUCCESS >> " + JSON.stringify(data));
                            var empty_array = [];

                            // a. set quicklinks
                            if (quicklinks != null) {
                                APP.models.login_window.set("quicklinks", quicklinks);
                            }
                            else {
                                APP.models.login_window.set("quicklinks", empty_array);
                            }   // set quicklinks to an empty array, not null

                            // b. update quicklinks
                            APP.models.main_pane_edit_quicklinks_screen.filter_dataSources();

                            // c. display popup
                            screen_popup_short.success("Add successful.");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),
        main_pane_troubleshooting_screen: kendo.observable({
            // functions
            after_show: function after_show() {
                try {
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            // subgrid detailInit
            grid_detail: function grid_detail(e) {
                try {
                    var loc = "main_pane_troubleshooting_screen >> grid_detail >> ";
                    var parent_id = e.data.id;
                    var grid = $("<div/>").appendTo(e.detailCell).kendoGrid({
                        dataSource: {
                            type: 'everlive',
                            transport: {
                                typeName: 'SubThreads'
                            },
                            schema: {
                                model: {
                                    id: Everlive.idField,
                                    fields: {
                                        Name: { editable: true, validation: { required: true } },
                                        ParentThread: { editable: true },
                                        CreatedAt: { editable: false },
                                        ModifiedAt: { editable: false },
                                    }
                                }
                            },
                            errors: "error",
                            serverSorting: true,
                            sort: {
                                field: "Name",
                                dir: "asc", // (asc)ending, (desc)ending
                            },
                            serverPaging: true,
                            pageSize: 20,
                            serverFiltering: true,
                            serverSorting: true,
                            filter: {
                                logic: "and",
                                filters: [
							        // align children with parents
							        { field: "ParentThread", operator: "eq", value: parent_id }   // http://docs.telerik.com/kendo-ui/api/javascript/data/datasource#configuration-filter.operator
                                ]
                            },
                        },
                        error: function (e) {
                            console.log(loc + e.errors);
                        },
                        detailInit: APP.models.main_pane_troubleshooting_screen.grid_detail_1,
                        columns: [
							{ field: "Name", title: "Description" },
							{ field: "ParentThread", title: "Parent Thread", hidden: true },
							{
							    command: [
									{ name: "edit" },
									{ name: "destroy" },
							    ],
							    width: 250,
							},
                        ],
                        edit: function (e) {
                            try {
                                // 1. get data
                                var model = e.model;

                                // 2. set data
                                model.set("ParentThread", parent_id);
                            }
                            catch (e) {
                                console.log(loc + "edit >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                    });
                    grid = grid.data("kendoGrid");
                    grid.setOptions(grid_common_options);
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            grid_detail_1: function grid_detail_1(e) {
                try {
                    var loc = "main_pane_troubleshooting_screen >> grid_detail_1 >> ";
                    var parent_id = e.data.id;
                    var grid = $("<div/>").appendTo(e.detailCell).kendoGrid({
                        dataSource: {
                            type: 'everlive',
                            transport: {
                                typeName: 'SubThreads1'
                            },
                            schema: {
                                model: {
                                    id: Everlive.idField,
                                    fields: {
                                        Name: { editable: true, validation: { required: true } },
                                        ParentThread: { editable: true },
                                        CreatedAt: { editable: false },
                                        ModifiedAt: { editable: false },
                                    }
                                }
                            },
                            errors: "error",
                            serverSorting: true,
                            sort: {
                                field: "Name",
                                dir: "asc", // (asc)ending, (desc)ending
                            },
                            serverPaging: true,
                            pageSize: 20,
                            serverFiltering: true,
                            serverSorting: true,
                            filter: {
                                logic: "and",
                                filters: [
							        // align children with parents
							        { field: "ParentThread", operator: "eq", value: parent_id }   // http://docs.telerik.com/kendo-ui/api/javascript/data/datasource#configuration-filter.operator
                                ]
                            },
                        },
                        error: function (e) {
                            console.log(loc + e.errors);
                        },
                        detailInit: APP.models.main_pane_troubleshooting_screen.grid_detail_2,
                        columns: [
							{ field: "Name", title: "Description" },
							{ field: "ParentThread", title: "Parent Thread", hidden: true },
							{
							    command: [
									{ name: "edit" },
									{ name: "destroy" },
							    ],
							    width: 250,
							},
                        ],
                        edit: function (e) {
                            try {
                                // 1. get data
                                var model = e.model;

                                // 2. set data
                                model.set("ParentThread", parent_id);
                            }
                            catch (e) {
                                console.log(loc + "edit >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                    });
                    grid = grid.data("kendoGrid");
                    grid.setOptions(grid_common_options);
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            grid_detail_2: function grid_detail_2(e) {
                try {
                    var loc = "main_pane_troubleshooting_screen >> grid_detail_2 >> ";
                    var parent_id = e.data.id;
                    var grid = $("<div/>").appendTo(e.detailCell).kendoGrid({
                        dataSource: {
                            type: 'everlive',
                            transport: {
                                typeName: 'SubThreads2'
                            },
                            schema: {
                                model: {
                                    id: Everlive.idField,
                                    fields: {
                                        Name: { editable: true, validation: { required: true } },
                                        ParentThread: { editable: true },
                                        CreatedAt: { editable: false },
                                        ModifiedAt: { editable: false },
                                    }
                                }
                            },
                            errors: "error",
                            serverSorting: true,
                            sort: {
                                field: "Name",
                                dir: "asc", // (asc)ending, (desc)ending
                            },
                            serverPaging: true,
                            pageSize: 20,
                            serverFiltering: true,
                            serverSorting: true,
                            filter: {
                                logic: "and",
                                filters: [
							        // align children with parents
							        { field: "ParentThread", operator: "eq", value: parent_id }   // http://docs.telerik.com/kendo-ui/api/javascript/data/datasource#configuration-filter.operator
                                ]
                            },
                        },
                        error: function (e) {
                            console.log(loc + e.errors);
                        },
                        columns: [
							{ field: "Name", title: "Description" },
							{ field: "ParentThread", title: "Parent Thread", hidden: true },
							{
							    command: [
									{ name: "edit" },
									{ name: "destroy" },
							    ],
							    width: 250,
							},
                        ],
                        edit: function (e) {
                            try {
                                // 1. get data
                                var model = e.model;

                                // 2. set data
                                model.set("ParentThread", parent_id);
                            }
                            catch (e) {
                                console.log(loc + "edit >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                    });
                    grid = grid.data("kendoGrid");
                    grid.setOptions(grid_common_options);
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            // grid buttons
            goto_details: function goto_details(subthread_row_id) {
                try {
                    var loc = "main_pane_troubleshooting_screen >> goto_details >> ";
                    var debug = false;

                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("SubThreadId", subthread_row_id)
                    .done();
                    query.select("Content", "Author");
                    var data = el.data("SubThreadPosts");
                    data.get(query)
                        .then(function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var author_id = data.result[0].Author;
                                var editor = $("#post_content_editor").data("kendoEditor");

                                // 2. set content
                                if (data.result[0].Content) {
                                    editor.value(data.result[0].Content);
                                }
                                else {
                                    editor.value("");
                                }	// no content, so set a blank string
                                APP.models.post_content.set("content_id", data.result[0].Id)

                                // 3. set readonly or not
                                if (author_id === user_id) {
                                    APP.models.post_content.set("set_readonly", false);
                                    console.log(loc + "content editing is allowed");
                                }
                                else {
                                    APP.models.post_content.set("set_readonly", true);
                                    console.log(loc + "content editing is not allowed");
                                }   // set editor as readonly
                            }	// post found
                            else {
                                console.log(loc + "create new post");
                                APP.models.home_screen.create_post(subthread_row_id);
                            }	// post not found, so create one

                            app.navigate("post_content");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            create_post: function create_post(subthread_row_id) {
                try {
                    var loc = "main_pane_troubleshooting_screen >> create_post >> ";
                    var debug = false;

                    app.showLoading();

                    var data = el.data("SubThreadPosts");
                    var data_obj = [
						{
						    "SubThreadId": subthread_row_id,
						    "Author": user_id,
						},
                    ];
                    data.create(data_obj,
                        function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            APP.models.home_screen.goto_details(subthread_row_id);
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),
        main_pane_profile_screen: kendo.observable({
            display_name: "", password: "", new_password: "", theme_num: null, skin_num: null,
            // dataSource
            theme_num_ds: new kendo.data.DataSource({
                data: [
                    { text: "Default Theme of Skin", value: 1 },
                    { text: "Red Theme", value: 2 },
                    { text: "Green Theme", value: 3 },
                    { text: "Blue Theme", value: 4 },
                    { text: "Light Theme", value: 5 },
                    { text: "Dark Theme", value: 6 },
                ],
            }),
            skin_num_ds: new kendo.data.DataSource({ data: app_skins }),
            // functions
            after_show: function after_show() {
                try {
                    this.change_password_cancel();
                    this.change_theme_cancel();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            change_password_cancel: function change_password_cancel() {
                try {
                    this.set("password", "");
                    this.set("new_password", "");
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            change_password_submit: function change_password_submit() {
                try {
                    var debug = false;
                    var loc = "main_pane_profile_screen >> change_password_submit >> ";

                    // 1. get data
                    var user_name = APP.models.login_window.get("user_name");
                    var password = this.get("password");
                    var new_password = this.get("new_password");

                    // 2. validate data
                    if (!password) {
                        screen_popup.warning("Current Password is blank.  Please retry.");
                        return;
                    }
                    else if (!new_password) {
                        screen_popup.warning("New Password is blank.  Please retry.");
                        return;
                    }

                    // 3. send data
                    el.Users.changePassword(user_name, password, new_password, true,	// keep the user's tokens					
						function (data) {
						    try {
						        console.log(loc + "SUCCESS >> " + JSON.stringify(data));
						        screen_popup_short.success("Password changed.");
						        APP.models.profile_screen.cancel();
						    }
						    catch (e) {
						        console.error(loc + e.toString());
						        screen_popup.error("Internal error.  Please see help.");
						    }
						},
						function (error) {
						    try {
						        console.log(loc + "ERROR >> " + JSON.stringify(error));
						        screen_popup.error(error.message);
						    }
						    catch (e) {
						        console.error(loc + e.toString());
						        screen_popup.error("Internal error.  Please see help.");
						    }
						});
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            change_theme_submit: function change_theme_submit(e) {
                try {
                    var loc = "main_pane_profile_screen >> change_theme_submit >> ";
                    var debug = false;

                    // 1. get data
                    var theme_num = this.get("theme_num");
                    var skin_num = this.get("skin_num");

                    // 2. set data
                    app.showLoading();
                    var data = el.data("Users");
                    data.updateSingle({ Id: user_id, ThemeNumber: theme_num, AppSkinNumber: skin_num },
                        function (data) {
                            if (debug) console.info(loc + "SUCCESS >> " + JSON.stringify(data));

                            screen_popup_short.success("Theme and Skin updated.  Please refresh the page.");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            change_theme_cancel: function change_theme_cancel() {
                try {
                    var loc = "main_pane_profile_screen >> change_theme_cancel >> ";
                    var debug = false;

                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("Id", user_id)
                    .done();
                    query.select("ThemeNumber", "AppSkinNumber");
                    var data = el.data("Users");
                    data.get(query)
                        .then(function (data) {
                            if (debug) console.info(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var theme_num = data.result[0].ThemeNumber;
                                var skin_num = data.result[0].AppSkinNumber;

                                // 2. set user information
                                APP.models.main_pane_profile_screen.set("theme_num", theme_num);
                                APP.models.main_pane_profile_screen.set("skin_num", skin_num);
                            }
                            else {
                                console.log(loc + "ERROR >> no data");
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            // change
            theme_num_change: function theme_num_change(e) {
                try {
                    var found = false;
                    var combobox = $("#main_pane_profile_screen_theme_num").data("kendoComboBox");
                    var theme_num = e.data.theme_num;
                    var dataSource = this.get("theme_num_ds");
                    var data = dataSource.data();
                    var data_length = data.length;
                    if (data_length) {
                        for (var i = 0; i < data_length; i++) {
                            if (data[i].value === theme_num) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            this.set("station_type", data[0].value);
                            combobox.select(0);
                        }
                    }
                    else {
                        this.set("theme_num", null);
                    }
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
                    screen_popup.error("Internal Error.  Please see help.");
                }
            },
            skin_num_change: function skin_num_change(e) {
                try {
                    var found = false;
                    var combobox = $("#main_pane_profile_screen_skin_num").data("kendoComboBox");
                    var skin_num = e.data.skin_num;
                    var dataSource = this.get("skin_num_ds");
                    var data = dataSource.data();
                    var data_length = data.length;
                    if (data_length) {
                        for (var i = 0; i < data_length; i++) {
                            if (data[i].value === skin_num) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            this.set("skin_num", data[0].value);
                            combobox.select(0);
                        }
                    }
                    else {
                        this.set("skin_num", null);
                    }
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
                    screen_popup.error("Internal Error.  Please see help.");
                }
            },
        }),
        // Topics
        main_pane_topic_content: kendo.observable({
            title: "", item_id: "", editor_changed: false,
            // events
            before_show: function before_show() {
                try {
                    // 1. reset
                    this.set("editor_changed", false);

                    // 2. get data
                    var editor = $("#main_pane_topic_content_editor").data("kendoEditor");

                    // 3. refresh editor
                    editor.refresh();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            save_post: function save_post() {
                try {
                    var loc = "main_pane_topic_content >> save_post >> ";
                    var debug = false;

                    // 1. get data
                    var item_id = this.get("item_id");
                    var editor = $("#main_pane_topic_content_editor").data("kendoEditor");
                    var content = editor.value();

                    // 2. set data
                    app.showLoading();
                    var data = el.data("Topics");
                    data.updateSingle({ Id: item_id, Content: content },
                        function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            APP.models.main_pane_topic_content.set("editor_changed", false);
                            screen_popup_short.success("Changes saved.");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            back_button_click: function back_button_click() {
                try {
                    var loc = "main_pane_topic_content >> back_button_click >> ";
                    var debug = false;

                    // 1. get data
                    var editor_changed = this.get("editor_changed");

                    // 2. check for editor edits
                    if (editor_changed) {
                        var response = confirm("You have unsaved changes.  Are you sure you want to leave this page?");
                        if (!response) return;
                    }

                    // 3. navigate
                    main_pane.navigate('#:back');
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            edit_tags_button_click: function edit_tags_button_click() {
                try {
                    var debug = false;
                    var loc = "main_pane_topic_content >> edit_tags_button_click >> ";

                    // 1. get data
                    var item_id = this.get("item_id");
                    var title = this.get("title");
                    var editor_changed = this.get("editor_changed");

                    // 2. check for editor edits
                    if (editor_changed) {
                        var response = confirm("You have unsaved changes.  Are you sure you want to leave this page?");
                        if (!response) return;
                    }

                    // 3. alter data
                    var new_title = title + " Edit Tags";

                    // 4. set data
                    APP.models.main_pane_topic_tags_screen.set("item_id", item_id);
                    APP.models.main_pane_topic_tags_screen.set("title", new_title);

                    // 5. navigate
                    main_pane.navigate("main_pane_topic_tags_screen");
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            diagram_button_click: function diagram_button_click() {
                try {
                    var debug = false;
                    var loc = "main_pane_topic_content >> diagram_button_click >> ";

                    // 1. get data
                    var item_id = this.get("item_id");
                    var title = this.get("title");
                    var editor_changed = this.get("editor_changed");

                    // 2. check for editor edits
                    if (editor_changed) {
                        var response = confirm("You have unsaved changes.  Are you sure you want to leave this page?");
                        if (!response) return;
                    }

                    // 3. alter data
                    var new_title = title + " Diagram";

                    // 4. set data
                    APP.models.main_pane_topic_diagram.set("item_id", item_id);
                    APP.models.main_pane_topic_diagram.set("title", new_title);

                    // 5. navigate
                    main_pane.navigate("main_pane_topic_diagram");
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            editor_keydown: function editor_keydown() {
                try {
                    var debug = false;
                    var loc = "main_pane_topic_content >> editor_keydown >> ";

                    this.set("editor_changed", true);
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),
        main_pane_edit_topics_screen: kendo.observable({
            // functions
            before_show: function before_show() {
                try {
                    var grid = $("#main_pane_edit_topics_screen_grid").data("kendoGrid");
                    grid.refresh();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            // subgrid detailInit
            grid_detail: function grid_detail(e) {
                try {
                    var loc = "main_pane_edit_topics_screen >> grid_detail >> ";
                    var parent_id = e.data.id;
                    var grid = $("<div/>").appendTo(e.detailCell).kendoGrid({
                        dataSource: {
                            type: 'everlive',
                            transport: {
                                typeName: "Topics"
                            },
                            schema: {
                                model: {
                                    id: Everlive.idField,
                                    fields: {
                                        Id: { editable: false },
                                        CreatedAt: { editable: false },
                                        ModifiedAt: { editable: false },
                                        Owner: { editable: false },
                                        Content: { editable: true },
                                        Name: { editable: true, validation: { required: true } },
                                        Tags: { editable: true },
                                        ParentTopicId: { editable: true },
                                    }
                                }
                            },
                            errors: "error",
                            serverSorting: true,
                            sort: {
                                field: "Name",
                                dir: "asc", // (asc)ending, (desc)ending
                            },
                            serverPaging: true,
                            pageSize: 20,
                            serverFiltering: true,
                            filter: {
                                logic: "and",
                                filters: [
							        // align children with parents
							        { field: "ParentTopicId", operator: "eq", value: parent_id }   // http://docs.telerik.com/kendo-ui/api/javascript/data/datasource#configuration-filter.operator
                                ]
                            },
                        },
                        error: function (e) {
                            console.log(loc + e.errors);
                        },
                        detailInit: APP.models.main_pane_edit_topics_screen.grid_detail_1,
                        columns: [
							{ field: "Name", title: "Description" },
							{ field: "ParentTopicId", title: "Parent Thread", hidden: true },
							{
							    command: [
									{ name: "edit" },
									{ name: "destroy" },
							    ],
							    width: 250,
							},
                        ],
                        dataBound: function (e) {
                            try {
                                var grid = e.sender;
                                var items = e.sender.items();
                                items.each(function () {
                                    if (role == role_default) {
                                        $(this).find(".k-grid-edit").hide();
                                        $(this).find(".k-grid-delete").hide();
                                    }
                                    else if (role == role_editor) {
                                        $(this).find(".k-grid-delete").hide();
                                    }
                                });
                            }
                            catch (e) {
                                console.log("main_pane_edit_topics_screen >> grid_detail >> ERROR >> dataBound >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        edit: function (e) {
                            try {
                                // 1. get data
                                var model = e.model;

                                // 2. set data
                                model.set("ParentTopicId", parent_id);
                            }
                            catch (e) {
                                console.log(loc + "edit >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        cancel: function (e) {
                            try {
                                var grid = $("#main_pane_edit_topics_screen_grid").data("kendoGrid");
                                grid.refresh();
                            }
                            catch (e) {
                                console.log(loc + "cancel >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        remove: function (e) {
                            try {
                                var screen = left_pane.view().id;
                                switch (screen) {
                                    case "#left_pane_home_screen": {
                                        APP.models.left_pane_home_screen.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_1": {
                                        APP.models.left_pane_subtopics_1.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_2": {
                                        APP.models.left_pane_subtopics_2.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_3": {
                                        APP.models.left_pane_subtopics_3.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_4": {
                                        APP.models.left_pane_subtopics_4.before_show();
                                        break;
                                    }
                                    default: {
                                        console.log(loc + "ERROR >> screen unhandled >> " + screen);
                                        screen_popup.error("Internal error.  Please see help.");
                                        break;
                                    }
                                }
                            }
                            catch (e) {
                                console.log(loc + "ERROR >> remove >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        save: function (e) {
                            try {
                                var screen = left_pane.view().id;
                                switch (screen) {
                                    case "#left_pane_home_screen": {
                                        APP.models.left_pane_home_screen.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_1": {
                                        APP.models.left_pane_subtopics_1.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_2": {
                                        APP.models.left_pane_subtopics_2.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_3": {
                                        APP.models.left_pane_subtopics_3.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_4": {
                                        APP.models.left_pane_subtopics_4.before_show();
                                        break;
                                    }
                                    default: {
                                        console.log(loc + "ERROR >> screen unhandled >> " + screen);
                                        screen_popup.error("Internal error.  Please see help.");
                                        break;
                                    }
                                }
                            }
                            catch (e) {
                                console.log(loc + "ERROR >> save >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                    });
                    grid = grid.data("kendoGrid");
                    grid.setOptions(grid_common_options);
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            grid_detail_1: function grid_detail_1(e) {
                try {
                    var loc = "main_pane_edit_topics_screen >> grid_detail_1 >> ";
                    var parent_id = e.data.id;
                    var grid = $("<div/>").appendTo(e.detailCell).kendoGrid({
                        dataSource: {
                            type: 'everlive',
                            transport: {
                                typeName: "Topics"
                            },
                            schema: {
                                model: {
                                    id: Everlive.idField,
                                    fields: {
                                        Id: { editable: false },
                                        CreatedAt: { editable: false },
                                        ModifiedAt: { editable: false },
                                        Owner: { editable: false },
                                        Content: { editable: true },
                                        Name: { editable: true, validation: { required: true } },
                                        Tags: { editable: true },
                                        ParentTopicId: { editable: true },
                                    }
                                }
                            },
                            errors: "error",
                            serverSorting: true,
                            sort: {
                                field: "Name",
                                dir: "asc", // (asc)ending, (desc)ending
                            },
                            serverPaging: true,
                            pageSize: 20,
                            serverFiltering: true,
                            filter: {
                                logic: "and",
                                filters: [
							        // align children with parents
							        { field: "ParentTopicId", operator: "eq", value: parent_id }   // http://docs.telerik.com/kendo-ui/api/javascript/data/datasource#configuration-filter.operator
                                ]
                            },
                        },
                        error: function (e) {
                            console.log(loc + e.errors);
                        },
                        detailInit: APP.models.main_pane_edit_topics_screen.grid_detail_2,
                        columns: [
							{ field: "Name", title: "Description" },
							{ field: "ParentTopicId", title: "Parent Thread", hidden: true },
							{
							    command: [
									{ name: "edit" },
									{ name: "destroy" },
							    ],
							    width: 250,
							},
                        ],
                        dataBound: function (e) {
                            try {
                                var grid = e.sender;
                                var items = e.sender.items();
                                items.each(function () {
                                    if (role == role_default) {
                                        $(this).find(".k-grid-edit").hide();
                                        $(this).find(".k-grid-delete").hide();
                                    }
                                });
                            }
                            catch (e) {
                                console.log("main_pane_edit_topics_screen >> grid_detail_1 >> ERROR >> dataBound >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        edit: function (e) {
                            try {
                                // 1. get data
                                var model = e.model;

                                // 2. set data
                                model.set("ParentTopicId", parent_id);
                            }
                            catch (e) {
                                console.log(loc + "edit >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        cancel: function (e) {
                            try {
                                var grid = $("#main_pane_edit_topics_screen_grid").data("kendoGrid");
                                grid.refresh();
                            }
                            catch (e) {
                                console.log(loc + "cancel >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        remove: function (e) {
                            try {
                                var screen = left_pane.view().id;
                                switch (screen) {
                                    case "#left_pane_home_screen": {
                                        APP.models.left_pane_home_screen.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_1": {
                                        APP.models.left_pane_subtopics_1.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_2": {
                                        APP.models.left_pane_subtopics_2.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_3": {
                                        APP.models.left_pane_subtopics_3.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_4": {
                                        APP.models.left_pane_subtopics_4.before_show();
                                        break;
                                    }
                                    default: {
                                        console.log(loc + "ERROR >> screen unhandled >> " + screen);
                                        screen_popup.error("Internal error.  Please see help.");
                                        break;
                                    }
                                }
                            }
                            catch (e) {
                                console.log(loc + "ERROR >> remove >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        save: function (e) {
                            try {
                                var screen = left_pane.view().id;
                                switch (screen) {
                                    case "#left_pane_home_screen": {
                                        APP.models.left_pane_home_screen.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_1": {
                                        APP.models.left_pane_subtopics_1.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_2": {
                                        APP.models.left_pane_subtopics_2.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_3": {
                                        APP.models.left_pane_subtopics_3.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_4": {
                                        APP.models.left_pane_subtopics_4.before_show();
                                        break;
                                    }
                                    default: {
                                        console.log(loc + "ERROR >> screen unhandled >> " + screen);
                                        screen_popup.error("Internal error.  Please see help.");
                                        break;
                                    }
                                }
                            }
                            catch (e) {
                                console.log(loc + "ERROR >> save >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                    });
                    grid = grid.data("kendoGrid");
                    grid.setOptions(grid_common_options);
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            grid_detail_2: function grid_detail_2(e) {
                try {
                    var loc = "main_pane_edit_topics_screen >> grid_detail_2 >> ";
                    var parent_id = e.data.id;
                    var grid = $("<div/>").appendTo(e.detailCell).kendoGrid({
                        dataSource: {
                            type: 'everlive',
                            transport: {
                                typeName: "Topics"
                            },
                            schema: {
                                model: {
                                    id: Everlive.idField,
                                    fields: {
                                        Id: { editable: false },
                                        CreatedAt: { editable: false },
                                        ModifiedAt: { editable: false },
                                        Owner: { editable: false },
                                        Content: { editable: true },
                                        Name: { editable: true, validation: { required: true } },
                                        Tags: { editable: true },
                                        ParentTopicId: { editable: true },
                                    }
                                }
                            },
                            errors: "error",
                            serverSorting: true,
                            sort: {
                                field: "Name",
                                dir: "asc", // (asc)ending, (desc)ending
                            },
                            serverPaging: true,
                            pageSize: 20,
                            serverFiltering: true,
                            filter: {
                                logic: "and",
                                filters: [
							        // align children with parents
							        { field: "ParentTopicId", operator: "eq", value: parent_id }   // http://docs.telerik.com/kendo-ui/api/javascript/data/datasource#configuration-filter.operator
                                ]
                            },
                        },
                        error: function (e) {
                            console.log(loc + e.errors);
                        },
                        detailInit: APP.models.main_pane_edit_topics_screen.grid_detail_3,
                        columns: [
							{ field: "Name", title: "Description" },
							{ field: "ParentTopicId", title: "Parent Thread", hidden: true },
							{
							    command: [
									{ name: "edit" },
									{ name: "destroy" },
							    ],
							    width: 250,
							},
                        ],
                        dataBound: function (e) {
                            try {
                                var grid = e.sender;
                                var items = e.sender.items();
                                items.each(function () {
                                    if (role == role_default) {
                                        $(this).find(".k-grid-edit").hide();
                                        $(this).find(".k-grid-delete").hide();
                                    }
                                });
                            }
                            catch (e) {
                                console.log("main_pane_edit_topics_screen >> grid_detail_2 >> ERROR >> dataBound >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        edit: function (e) {
                            try {
                                // 1. get data
                                var model = e.model;

                                // 2. set data
                                model.set("ParentTopicId", parent_id);
                            }
                            catch (e) {
                                console.log(loc + "edit >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        cancel: function (e) {
                            try {
                                var grid = $("#main_pane_edit_topics_screen_grid").data("kendoGrid");
                                grid.refresh();
                            }
                            catch (e) {
                                console.log(loc + "cancel >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        remove: function (e) {
                            try {
                                var screen = left_pane.view().id;
                                switch (screen) {
                                    case "#left_pane_home_screen": {
                                        APP.models.left_pane_home_screen.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_1": {
                                        APP.models.left_pane_subtopics_1.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_2": {
                                        APP.models.left_pane_subtopics_2.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_3": {
                                        APP.models.left_pane_subtopics_3.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_4": {
                                        APP.models.left_pane_subtopics_4.before_show();
                                        break;
                                    }
                                    default: {
                                        console.log(loc + "ERROR >> screen unhandled >> " + screen);
                                        screen_popup.error("Internal error.  Please see help.");
                                        break;
                                    }
                                }
                            }
                            catch (e) {
                                console.log(loc + "ERROR >> remove >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        save: function (e) {
                            try {
                                var screen = left_pane.view().id;
                                switch (screen) {
                                    case "#left_pane_home_screen": {
                                        APP.models.left_pane_home_screen.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_1": {
                                        APP.models.left_pane_subtopics_1.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_2": {
                                        APP.models.left_pane_subtopics_2.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_3": {
                                        APP.models.left_pane_subtopics_3.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_4": {
                                        APP.models.left_pane_subtopics_4.before_show();
                                        break;
                                    }
                                    default: {
                                        console.log(loc + "ERROR >> screen unhandled >> " + screen);
                                        screen_popup.error("Internal error.  Please see help.");
                                        break;
                                    }
                                }
                            }
                            catch (e) {
                                console.log(loc + "ERROR >> save >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                    });
                    grid = grid.data("kendoGrid");
                    grid.setOptions(grid_common_options);
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            grid_detail_3: function grid_detail_3(e) {
                try {
                    var loc = "main_pane_edit_topics_screen >> grid_detail_3 >> ";
                    var parent_id = e.data.id;
                    var grid = $("<div/>").appendTo(e.detailCell).kendoGrid({
                        dataSource: {
                            type: 'everlive',
                            transport: {
                                typeName: "Topics"
                            },
                            schema: {
                                model: {
                                    id: Everlive.idField,
                                    fields: {
                                        Id: { editable: false },
                                        CreatedAt: { editable: false },
                                        ModifiedAt: { editable: false },
                                        Owner: { editable: false },
                                        Content: { editable: true },
                                        Name: { editable: true, validation: { required: true } },
                                        Tags: { editable: true },
                                        ParentTopicId: { editable: true },
                                    }
                                }
                            },
                            errors: "error",
                            serverSorting: true,
                            sort: {
                                field: "Name",
                                dir: "asc", // (asc)ending, (desc)ending
                            },
                            serverPaging: true,
                            pageSize: 20,
                            serverFiltering: true,
                            filter: {
                                logic: "and",
                                filters: [
							        // align children with parents
							        { field: "ParentTopicId", operator: "eq", value: parent_id }   // http://docs.telerik.com/kendo-ui/api/javascript/data/datasource#configuration-filter.operator
                                ]
                            },
                        },
                        error: function (e) {
                            console.log(loc + e.errors);
                        },
                        columns: [
							{ field: "Name", title: "Description", validation: { required: true } },
							{ field: "ParentTopicId", title: "Parent Thread", hidden: true },
							{
							    command: [
									{ name: "edit" },
									{ name: "destroy" },
							    ],
							    width: 250,
							},
                        ],
                        dataBound: function (e) {
                            try {
                                var grid = e.sender;
                                var items = e.sender.items();
                                items.each(function () {
                                    if (role == role_default) {
                                        $(this).find(".k-grid-edit").hide();
                                        $(this).find(".k-grid-delete").hide();
                                    }
                                });
                            }
                            catch (e) {
                                console.log("main_pane_edit_topics_screen >> grid_detail_3 >> ERROR >> dataBound >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        edit: function (e) {
                            try {
                                // 1. get data
                                var model = e.model;

                                // 2. set data
                                model.set("ParentTopicId", parent_id);
                            }
                            catch (e) {
                                console.log(loc + "edit >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        cancel: function (e) {
                            try {
                                var grid = $("#main_pane_edit_topics_screen_grid").data("kendoGrid");
                                grid.refresh();
                            }
                            catch (e) {
                                console.log(loc + "cancel >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        remove: function (e) {
                            try {
                                var screen = left_pane.view().id;
                                switch (screen) {
                                    case "#left_pane_home_screen": {
                                        APP.models.left_pane_home_screen.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_1": {
                                        APP.models.left_pane_subtopics_1.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_2": {
                                        APP.models.left_pane_subtopics_2.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_3": {
                                        APP.models.left_pane_subtopics_3.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_4": {
                                        APP.models.left_pane_subtopics_4.before_show();
                                        break;
                                    }
                                    default: {
                                        console.log(loc + "ERROR >> screen unhandled >> " + screen);
                                        screen_popup.error("Internal error.  Please see help.");
                                        break;
                                    }
                                }
                            }
                            catch (e) {
                                console.log(loc + "ERROR >> remove >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        save: function (e) {
                            try {
                                var screen = left_pane.view().id;
                                switch (screen) {
                                    case "#left_pane_home_screen": {
                                        APP.models.left_pane_home_screen.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_1": {
                                        APP.models.left_pane_subtopics_1.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_2": {
                                        APP.models.left_pane_subtopics_2.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_3": {
                                        APP.models.left_pane_subtopics_3.before_show();
                                        break;
                                    }
                                    case "#left_pane_subtopics_4": {
                                        APP.models.left_pane_subtopics_4.before_show();
                                        break;
                                    }
                                    default: {
                                        console.log(loc + "ERROR >> screen unhandled >> " + screen);
                                        screen_popup.error("Internal error.  Please see help.");
                                        break;
                                    }
                                }
                            }
                            catch (e) {
                                console.log(loc + "ERROR >> save >> " + e.toString());
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                    });
                    grid = grid.data("kendoGrid");
                    grid.setOptions(grid_common_options);
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            // grid buttons
            create_post: function create_post(subthread_row_id) {
                try {
                    var loc = "main_pane_edit_topics_screen >> create_post >> ";
                    var debug = false;

                    app.showLoading();

                    var data = el.data("SubThreadPosts");
                    var data_obj = [
						{
						    "SubThreadId": subthread_row_id,
						    "Author": user_id,
						},
                    ];
                    data.create(data_obj,
                        function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            APP.models.home_screen.goto_details(subthread_row_id);
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),
        main_pane_topic_tags_screen: kendo.observable({
            title: "", item_id: "", tags: null,
            topic_tags_ds: new kendo.data.DataSource({
                type: 'everlive',
                transport: {
                    typeName: "TopicTags"
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            Id: { editable: false },
                            CreatedAt: { editable: false },
                            ModifiedAt: { editable: false },
                            Owner: { editable: false },
                            Name: { editable: true },
                        }
                    }
                },
                serverSorting: true,
                sort: {
                    field: "Name",
                    dir: "asc", // (asc)ending, (desc)ending
                },
            }),
            // functions
            before_show: function before_show() {
                try {
                    this.topic_tags_ds.read();
                    this.set_topic_tags();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            set_topic_tags: function set_topic_tags() {
                try {
                    var loc = "main_pane_topic_tags_screen >> set_topic_tags >> ";
                    var debug = false;

                    // 1. get data
                    var item_id = this.get("item_id");

                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("Id", item_id)
                    .done();
                    query.select("Tags");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            if (debug) console.info(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var tags = data.result[0].Tags;

                                // 2. set data
                                if (tags) {
                                    APP.models.main_pane_topic_tags_screen.set("tags", tags);
                                }
                                else {
                                    APP.models.main_pane_topic_tags_screen.set("tags", null);
                                }	// no content, so set a blank string
                            }
                            else {
                                console.error(arguments.callee.name + " >> ERROR >> Topic does not exist in cloud");
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            cancel_button_click: function cancel_button_click() {
                try {
                    this.set_topic_tags();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            save_button_click: function save_button_click() {
                try {
                    var loc = "main_pane_topic_tags_screen >> save_button_click >> ";
                    var debug = false;

                    // 1. get data
                    var item_id = this.get("item_id");
                    var tags = this.get("tags");
                    if (debug) console.info(loc + "tags = " + JSON.stringify(tags));

                    // 2. set data
                    app.showLoading();
                    var data = el.data("Topics");
                    data.updateSingle({ Id: item_id, Tags: tags },
                        function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            screen_popup_short.success("Tags updated.");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),
        main_pane_edit_topic_tags_screen: kendo.observable({
            // functions
            before_show: function before_show() {
                try {
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            query_topic_tag: function query_topic_tag(tag_delete_id) {
                try {
                    var loc = "main_pane_edit_topic_tags_screen >> query_topic_tag >> ";
                    var debug = false;

                    if (debug) console.info(loc + "tag_delete_id = " + tag_delete_id);

                    // 1. query topics that have the tag to be deleted
                    app.showLoading();
                    var query = new Everlive.Query();
                    query.where()
                            .eq("Tags", tag_delete_id)
                    .done();
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            if (debug) console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                for (var i = 0; i < data.result.length; i++) {
                                    // 1. get data
                                    var topic_id = data.result[i].Id;
                                    var topic_tags = data.result[i].Tags;
                                    // 2. update topic to not have tag
                                    APP.models.main_pane_edit_topic_tags_screen.update_topic_tag(topic_id, tag_delete_id, topic_tags);
                                }
                            }
                            else {
                                console.error(loc + " >> ERROR >> Topic does not exist in cloud");
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            update_topic_tag: function update_topic_tag(topic_id, tag_delete_id, topic_tags) {
                try {
                    var loc = "main_pane_edit_topic_tags_screen >> update_topic_tag >> ";
                    var debug = false;

                    // 1. remove tag to be deleted from topic tags
                    var index = topic_tags.indexOf(tag_delete_id);
                    if (index !== -1) {
                        topic_tags.splice(index, 1);
                    }

                    // 2. update topic tags
                    app.showLoading();
                    var data = el.data("Topics");
                    data.updateSingle({ Id: topic_id, Tags: topic_tags },
                        function (data) {
                            if (debug) console.info(loc + "SUCCESS >> " + JSON.stringify(data));
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),
        main_pane_topic_diagram: kendo.observable({
            title: "", item_id: "",
            // functions
            before_show: function before_show() {
                try {
                    this.set_diagram();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            set_diagram: function set_diagram() {
                try {
                    var loc = "main_pane_topic_diagram >> set_diagram >> ";
                    var debug = false;
                    var diagram_empty = "{\"shapes\":[],\"connections\":[]}";

                    // 1. get data
                    var item_id = this.get("item_id");

                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("Id", item_id)
                    .done();
                    query.select("DiagramContent");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            if (debug) console.info(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var diagram_data = data.result[0].DiagramContent;
                                var diagram = $("#main_pane_topic_diagram_diagram").getKendoDiagram();

                                // 2. set data
                                if (diagram_data) {
                                    if (debug) console.info(loc + "load diagram data");
                                    diagram.load(JSON.parse(diagram_data));
                                }
                                else {
                                    if (debug) console.info(loc + "no diagram data");
                                    diagram.load(JSON.parse(diagram_empty));
                                }	// no content, so set a blank string
                            }
                            else {
                                console.error(arguments.callee.name + " >> ERROR >> Topic does not exist in cloud");
                                screen_popup.error("Internal error.  Please see help.");
                            }
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            cancel_button_click: function cancel_button_click() {
                try {
                    this.set_diagram();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            save_button_click: function save_button_click() {
                try {
                    var loc = "main_pane_topic_diagram >> save_button_click >> ";
                    var debug = false;

                    // 1. get data
                    var item_id = this.get("item_id");
                    var diagram = $("#main_pane_topic_diagram_diagram").getKendoDiagram();
                    var diagram_data = JSON.stringify(diagram.save());
                    if (debug) console.info(loc + "diagram_data = " + diagram_data);

                    // 2. set data
                    app.showLoading();
                    var data = el.data("Topics");
                    data.updateSingle({ Id: item_id, DiagramContent: diagram_data },
                        function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            screen_popup_short.success("Diagram updated.");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            pdf_export_button_click: function pdf_export_button_click() {
                try {
                    var loc = "main_pane_topic_diagram >> pdf_export_button_click >> ";
                    var debug = false;

                    // 1. get data
                    var diagram = $("#main_pane_topic_diagram_diagram").getKendoDiagram();

                    // 2. export PDF
                    diagram.saveAsPDF();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),

        /******************** Left Pane ********************/
        left_pane_home_screen: kendo.observable({
            topics_ds: new kendo.data.DataSource({
                type: "everlive",
                transport: {
                    typeName: "Topics"
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            Id: { editable: false },
                            CreatedAt: { editable: false },
                            ModifiedAt: { editable: false },
                            Owner: { editable: false },
                            Content: { editable: true },
                            Name: { editable: true },
                            Tags: { editable: true },
                            ParentTopicId: { editable: true },
                        }
                    }
                },
                serverSorting: true,
                sort: {
                    field: "Name",
                    dir: "asc", // (asc)ending, (desc)ending
                },
                serverPaging: true,
                pageSize: 20,
                serverFiltering: true,
                filter: {
                    logic: "and",
                    filters: [
                        // only get topics without a parent ID
                        { field: "ParentTopicId", operator: "eq", value: "" }   // http://docs.telerik.com/kendo-ui/api/javascript/data/datasource#configuration-filter.operator
                    ]
                },
            }),
            // functions
            before_show: function before_show() {
                try {
                    this.topics_ds.read();
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            topic_click: function topic_click(e) {
                try {
                    var loc = "left_pane_home_screen >> topic_click >> ";
                    var debug = false;

                    // 1. get data
                    var editor_changed = APP.models.main_pane_topic_content.get("editor_changed");
                    var topic_id = $(event.currentTarget).data('id');
                    if (debug) console.info(loc + "topic_id = " + topic_id);

                    // 2. check for editor edits
                    if (editor_changed) {
                        var response = confirm("You have unsaved changes.  Are you sure you want to leave this page?");
                        if (!response) return;
                    }

                    // 3. query data
                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("Id", topic_id)
                    .done();
                    query.select("Content", "Name");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var content = data.result[0].Content;
                                var editor = $("#main_pane_topic_content_editor").data("kendoEditor");
                                var item_id = data.result[0].Id;
                                var name = data.result[0].Name;

                                // 2. set data
                                if (content) {
                                    editor.value(content);
                                }
                                else {
                                    editor.value("");
                                }	// no content, so set a blank string
                                APP.models.main_pane_topic_content.set("item_id", item_id);
                                APP.models.main_pane_topic_content.set("title", name);
                                APP.models.main_pane_topic_content.set("editor_changed", false);

                                // 3. navigate to sub-topics if they exist
                                APP.models.left_pane_home_screen.query_parent_topics(item_id);
                            }
                            else {
                                console.log(arguments.callee.name + " >> ERROR >> Topic does not exist in cloud");
                                screen_popup.error("Internal error.  Please see help.");
                            }

                            main_pane.navigate("main_pane_topic_content");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            query_parent_topics: function query_parent_topics(topic_id) {
                try {
                    var loc = "left_pane_home_screen >> query_parent_topics >> ";
                    var debug = false;

                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("ParentTopicId", topic_id)
                    .done();
                    query.select("Id");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var item_id = data.result[0].Id;

                                // 2. set data
                                APP.models.left_pane_subtopics_1.set("item_id", topic_id);

                                // 3. navigate
                                left_pane.navigate("#left_pane_subtopics_1");
                            }
                            else {
                                // No children with this parent, so don't navigate 
                            }
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),
        left_pane_subtopics_1: kendo.observable({
            item_id: "",
            topics_ds: new kendo.data.DataSource({
                type: "everlive",
                transport: {
                    typeName: "Topics"
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            Id: { editable: false },
                            CreatedAt: { editable: false },
                            ModifiedAt: { editable: false },
                            Owner: { editable: false },
                            Content: { editable: true },
                            Name: { editable: true },
                            Tags: { editable: true },
                            ParentTopicId: { editable: true },
                        }
                    }
                },
                serverSorting: true,
                sort: {
                    field: "Name",
                    dir: "asc", // (asc)ending, (desc)ending
                },
                serverPaging: true,
                pageSize: 20,
                serverFiltering: true,
            }),
            // functions
            before_show: function before_show() {
                try {
                    var loc = "left_pane_subtopics_1 >> before_show >> ";
                    var debug = false;

                    // 1. get data
                    var item_id = this.get("item_id");
                    var dataSource = this.get("topics_ds");
                    if (debug) console.info(loc + "item_id = " + item_id);

                    // 2. filter dataSource
                    dataSource.read().then(function () {
                        dataSource.filter({
                            field: "ParentTopicId",
                            operator: "eq",
                            value: item_id,
                        });
                    })
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            topic_click: function topic_click(e) {
                try {
                    var loc = "left_pane_subtopics_1 >> topic_click >> ";
                    var debug = false;

                    // 1. get data
                    var editor_changed = APP.models.main_pane_topic_content.get("editor_changed");
                    var topic_id = $(event.currentTarget).data('id');
                    if (debug) console.info(loc + "topic_id = " + topic_id);

                    // 2. check for editor edits
                    if (editor_changed) {
                        var response = confirm("You have unsaved changes.  Are you sure you want to leave this page?");
                        if (!response) return;
                    }

                    // 3. query data
                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("Id", topic_id)
                    .done();
                    query.select("Content", "Name");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var content = data.result[0].Content;
                                var editor = $("#main_pane_topic_content_editor").data("kendoEditor");
                                var item_id = data.result[0].Id;
                                var name = data.result[0].Name;

                                // 2. set data
                                if (content) {
                                    editor.value(content);
                                }
                                else {
                                    editor.value("");
                                }	// no content, so set a blank string
                                APP.models.main_pane_topic_content.set("item_id", item_id);
                                APP.models.main_pane_topic_content.set("title", name);
                                APP.models.main_pane_topic_content.set("editor_changed", false);

                                // 3. navigate to sub-topics if they exist
                                APP.models.left_pane_subtopics_1.query_parent_topics(item_id);
                            }
                            else {
                                console.log(arguments.callee.name + " >> ERROR >> Topic does not exist in cloud");
                                screen_popup.error("Internal error.  Please see help.");
                            }

                            main_pane.navigate("main_pane_topic_content");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            query_parent_topics: function query_parent_topics(topic_id) {
                try {
                    var loc = "left_pane_subtopics_1 >> query_parent_topics >> ";
                    var debug = false;

                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("ParentTopicId", topic_id)
                    .done();
                    query.select("Id");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var item_id = data.result[0].Id;

                                // 2. set data
                                APP.models.left_pane_subtopics_2.set("item_id", topic_id);

                                // 3. navigate
                                left_pane.navigate("#left_pane_subtopics_2");
                            }
                            else {
                                // No children with this parent, so don't navigate 
                            }
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),
        left_pane_subtopics_2: kendo.observable({
            item_id: "",
            topics_ds: new kendo.data.DataSource({
                type: "everlive",
                transport: {
                    typeName: "Topics"
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            Id: { editable: false },
                            CreatedAt: { editable: false },
                            ModifiedAt: { editable: false },
                            Owner: { editable: false },
                            Content: { editable: true },
                            Name: { editable: true },
                            Tags: { editable: true },
                            ParentTopicId: { editable: true },
                        }
                    }
                },
                serverSorting: true,
                sort: {
                    field: "Name",
                    dir: "asc", // (asc)ending, (desc)ending
                },
                serverPaging: true,
                pageSize: 20,
                serverFiltering: true,
            }),
            // functions
            before_show: function before_show() {
                try {
                    var loc = "left_pane_subtopics_2 >> before_show >> ";
                    var debug = false;

                    // 1. get data
                    var item_id = this.get("item_id");
                    var dataSource = this.get("topics_ds");
                    if (debug) console.info(loc + "item_id = " + item_id);

                    // 2. filter dataSource
                    dataSource.read().then(function () {
                        dataSource.filter({
                            field: "ParentTopicId",
                            operator: "eq",
                            value: item_id,
                        });
                    })
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            topic_click: function topic_click(e) {
                try {
                    var loc = "left_pane_subtopics_2 >> topic_click >> ";
                    var debug = false;

                    // 1. get data
                    var editor_changed = APP.models.main_pane_topic_content.get("editor_changed");
                    var topic_id = $(event.currentTarget).data('id');
                    if (debug) console.info(loc + "topic_id = " + topic_id);

                    // 2. check for editor edits
                    if (editor_changed) {
                        var response = confirm("You have unsaved changes.  Are you sure you want to leave this page?");
                        if (!response) return;
                    }

                    // 3. query data
                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("Id", topic_id)
                    .done();
                    query.select("Content", "Name");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var content = data.result[0].Content;
                                var editor = $("#main_pane_topic_content_editor").data("kendoEditor");
                                var item_id = data.result[0].Id;
                                var name = data.result[0].Name;

                                // 2. set data
                                if (content) {
                                    editor.value(content);
                                }
                                else {
                                    editor.value("");
                                }	// no content, so set a blank string
                                APP.models.main_pane_topic_content.set("item_id", item_id);
                                APP.models.main_pane_topic_content.set("title", name);
                                APP.models.main_pane_topic_content.set("editor_changed", false);

                                // 3. navigate to sub-topics if they exist
                                APP.models.left_pane_subtopics_2.query_parent_topics(item_id);
                            }
                            else {
                                console.log(arguments.callee.name + " >> ERROR >> Topic does not exist in cloud");
                                screen_popup.error("Internal error.  Please see help.");
                            }

                            main_pane.navigate("main_pane_topic_content");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            query_parent_topics: function query_parent_topics(topic_id) {
                try {
                    var loc = "left_pane_subtopics_2 >> query_parent_topics >> ";
                    var debug = false;

                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("ParentTopicId", topic_id)
                    .done();
                    query.select("Id");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var item_id = data.result[0].Id;

                                // 2. set data
                                APP.models.left_pane_subtopics_3.set("item_id", topic_id);

                                // 3. navigate
                                left_pane.navigate("#left_pane_subtopics_3");
                            }
                            else {
                                // No children with this parent, so don't navigate 
                            }
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),
        left_pane_subtopics_3: kendo.observable({
            item_id: "",
            topics_ds: new kendo.data.DataSource({
                type: "everlive",
                transport: {
                    typeName: "Topics"
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            Id: { editable: false },
                            CreatedAt: { editable: false },
                            ModifiedAt: { editable: false },
                            Owner: { editable: false },
                            Content: { editable: true },
                            Name: { editable: true },
                            Tags: { editable: true },
                            ParentTopicId: { editable: true },
                        }
                    }
                },
                serverSorting: true,
                sort: {
                    field: "Name",
                    dir: "asc", // (asc)ending, (desc)ending
                },
                serverPaging: true,
                pageSize: 20,
                serverFiltering: true,
            }),
            // functions
            before_show: function before_show() {
                try {
                    var loc = "left_pane_subtopics_3 >> before_show >> ";
                    var debug = false;

                    // 1. get data
                    var item_id = this.get("item_id");
                    var dataSource = this.get("topics_ds");
                    if (debug) console.info(loc + "item_id = " + item_id);

                    // 2. filter dataSource
                    dataSource.read().then(function () {
                        dataSource.filter({
                            field: "ParentTopicId",
                            operator: "eq",
                            value: item_id,
                        });
                    })
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            topic_click: function topic_click(e) {
                try {
                    var loc = "left_pane_subtopics_3 >> topic_click >> ";
                    var debug = false;

                    // 1. get data
                    var editor_changed = APP.models.main_pane_topic_content.get("editor_changed");
                    var topic_id = $(event.currentTarget).data('id');
                    if (debug) console.info(loc + "topic_id = " + topic_id);

                    // 2. check for editor edits
                    if (editor_changed) {
                        var response = confirm("You have unsaved changes.  Are you sure you want to leave this page?");
                        if (!response) return;
                    }

                    // 3. query data
                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("Id", topic_id)
                    .done();
                    query.select("Content", "Name");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var content = data.result[0].Content;
                                var editor = $("#main_pane_topic_content_editor").data("kendoEditor");
                                var item_id = data.result[0].Id;
                                var name = data.result[0].Name;

                                // 2. set data
                                if (content) {
                                    editor.value(content);
                                }
                                else {
                                    editor.value("");
                                }	// no content, so set a blank string
                                APP.models.main_pane_topic_content.set("item_id", item_id);
                                APP.models.main_pane_topic_content.set("title", name);
                                APP.models.main_pane_topic_content.set("editor_changed", false);

                                // 3. navigate to sub-topics if they exist
                                APP.models.left_pane_subtopics_3.query_parent_topics(item_id);
                            }
                            else {
                                console.log(arguments.callee.name + " >> ERROR >> Topic does not exist in cloud");
                                screen_popup.error("Internal error.  Please see help.");
                            }

                            main_pane.navigate("main_pane_topic_content");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            query_parent_topics: function query_parent_topics(topic_id) {
                try {
                    var loc = "left_pane_subtopics_3 >> query_parent_topics >> ";
                    var debug = false;

                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("ParentTopicId", topic_id)
                    .done();
                    query.select("Id");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var item_id = data.result[0].Id;

                                // 2. set data
                                APP.models.left_pane_subtopics_4.set("item_id", topic_id);

                                // 3. navigate
                                left_pane.navigate("#left_pane_subtopics_4");
                            }
                            else {
                                // No children with this parent, so don't navigate 
                            }
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),
        left_pane_subtopics_4: kendo.observable({
            item_id: "",
            topics_ds: new kendo.data.DataSource({
                type: "everlive",
                transport: {
                    typeName: "Topics"
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            Id: { editable: false },
                            CreatedAt: { editable: false },
                            ModifiedAt: { editable: false },
                            Owner: { editable: false },
                            Content: { editable: true },
                            Name: { editable: true },
                            Tags: { editable: true },
                            ParentTopicId: { editable: true },
                        }
                    }
                },
                serverSorting: true,
                sort: {
                    field: "Name",
                    dir: "asc", // (asc)ending, (desc)ending
                },
                serverPaging: true,
                pageSize: 20,
                serverFiltering: true,
            }),
            // functions
            before_show: function before_show() {
                try {
                    var loc = "left_pane_subtopics_4 >> before_show >> ";
                    var debug = false;

                    // 1. get data
                    var item_id = this.get("item_id");
                    var dataSource = this.get("topics_ds");
                    if (debug) console.info(loc + "item_id = " + item_id);

                    // 2. filter dataSource
                    dataSource.read().then(function () {
                        dataSource.filter({
                            field: "ParentTopicId",
                            operator: "eq",
                            value: item_id,
                        });
                    })
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            topic_click: function topic_click(e) {
                try {
                    var loc = "left_pane_subtopics_4 >> topic_click >> ";
                    var debug = false;

                    // 1. get data
                    var editor_changed = APP.models.main_pane_topic_content.get("editor_changed");
                    var topic_id = $(event.currentTarget).data('id');
                    if (debug) console.info(loc + "topic_id = " + topic_id);

                    // 2. check for editor edits
                    if (editor_changed) {
                        var response = confirm("You have unsaved changes.  Are you sure you want to leave this page?");
                        if (!response) return;
                    }

                    // 3. query data
                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("Id", topic_id)
                    .done();
                    query.select("Content", "Name");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var content = data.result[0].Content;
                                var editor = $("#main_pane_topic_content_editor").data("kendoEditor");
                                var item_id = data.result[0].Id;
                                var name = data.result[0].Name;

                                // 2. set data
                                if (content) {
                                    editor.value(content);
                                }
                                else {
                                    editor.value("");
                                }	// no content, so set a blank string
                                APP.models.main_pane_topic_content.set("item_id", item_id);
                                APP.models.main_pane_topic_content.set("title", name);
                                APP.models.main_pane_topic_content.set("editor_changed", false);

                                // 3. navigate to sub-topics if they exist
                                //APP.models.left_pane_subtopics_4.query_parent_topics(item_id);
                            }
                            else {
                                console.log(arguments.callee.name + " >> ERROR >> Topic does not exist in cloud");
                                screen_popup.error("Internal error.  Please see help.");
                            }

                            main_pane.navigate("main_pane_topic_content");
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            query_parent_topics: function query_parent_topics(topic_id) {
                try {
                    var loc = "left_pane_subtopics_4 >> query_parent_topics >> ";
                    var debug = false;

                    app.showLoading();

                    var query = new Everlive.Query();
                    query.where()
                            .eq("ParentTopicId", topic_id)
                    .done();
                    query.select("Id");
                    var data = el.data("Topics");
                    data.get(query)
                        .then(function (data) {
                            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
                            if (data.count) {
                                // 1. get data
                                var item_id = data.result[0].Id;

                                // 2. set data
                                APP.models.left_pane_subtopics_5.set("item_id", topic_id);

                                // 3. navigate
                                left_pane.navigate("#left_pane_subtopics_5");
                            }
                            else {
                                // No children with this parent, so don't navigate 
                            }
                        },
                        function (error) {
                            console.log(loc + "ERROR >> " + JSON.stringify(error));
                            var responseText = error["responseText"];
                            var responseText_data = JSON.parse(responseText);
                            var message = responseText_data["message"];
                            screen_popup.error("Internal error.  Please see help.  " + message);
                        });
                    app.hideLoading();
                }
                catch (e) {
                    app.hideLoading();
                    console.error(arguments.callee.name + " >> error = " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),
        /// Other
        about_window: kendo.observable({
            app_version: app_version,
            free_trial_exp_date: "", free_trial_days_left: null, free_trial_visible: false,
            support_lic_exp_date: "", support_lic_days_left: null, support_lic_visible: false,
            // functions
        }),
        help_window: kendo.observable({
            send_email_str: "", activ_code: "", portalogic_activated: false,
        }),
    }
};

$(document).ready(function document_ready () {  // this function never stops running
    try {
        // key events
        $("#login_window").keyup(function (event) {
            if (event.keyCode == 13) {  // enter
                APP.models.login_window.submit_button_click();
            }
            else if (event.keyCode == 27) {  // escape
                APP.models.login_window.cancel_button_click();
            }
        });

        $('.close-icon').on('click', function () {
            $(this).closest('.card').fadeOut();
        });
    }
    catch (e) {
        console.error(arguments.callee.name + " >> error = " + e.toString());
        screen_popup.error("Internal Error.  Please see help.");
    }
});

$(window).unload(function () {
    APP.models.login_window.logout();
}, false);

function app_init() {  // this function runs once, on ready
    try {
        app.showLoading();

        console.log(loc + "App Initializing >> app_version = " + app_version + "; app_testing = " + app_testing.toString() + "; kendo version = " + kendo.version);
        console.log(loc + "Browser Information >> CodeName = " + navigator.appCodeName + "; appName = " + navigator.appName + "; Version = " + navigator.appVersion);

        // binding
        kendo.bind($("#login_window"), APP.models.login_window);
        kendo.bind($("#main_splitter_header"), APP.models.main_splitter_header);
        kendo.bind($("#help_window"), APP.models.help_window);
        kendo.bind($("#about_window"), APP.models.about_window);

        // local_storage
        if (typeof (Storage) !== "undefined") {
            console.log("Browser has local storage.");
            local_storage_used = true;
        }
        else {
            console.log("Browser does not have local storage.");
            local_storage_used = false;
        }

        /// Popups and Windows
        screen_popup = $("#screen_popup").kendoNotification({
            show: show_popup_centered,
            autoHideAfter: 5000,
        }).data("kendoNotification");
        screen_popup_short = $("#screen_popup_short").kendoNotification({
            show: show_popup_centered,
            autoHideAfter: 2000,
        }).data("kendoNotification");
        screen_popup_no_hide = $("#screen_popup_no_hide").kendoNotification({
            show: show_popup_centered,
            autoHideAfter: 0,
            button: true,
        }).data("kendoNotification");
        fun_window = $("#fun_window").kendoWindow({
            height: "400px", width: "600px",
            title: false,
            open: function () {
                // Blockrain
                $("#tetris").blockrain({
                    theme: "modern",
                    autoBlockWidth: true,
                    autoplay: true,
                    autoplayRestart: true,
                    'custom': {
                        background: '#040304',
                        backgroundGrid: '#000',
                        complexBlocks: {
                            line: ['assets/blocks/custom/line.png', 'assets/blocks/custom/line.png'],
                            square: 'assets/blocks/custom/square.png',
                            arrow: 'assets/blocks/custom/arrow.png',
                            rightHook: 'assets/blocks/custom/rightHook.png',
                            leftHook: 'assets/blocks/custom/leftHook.png',
                            rightZag: 'assets/blocks/custom/rightZag.png',
                            leftZag: 'assets/blocks/custom/leftZag.png'
                        }
                    }
                });
            },
        }).data("kendoWindow");
        fun_window.open().maximize();
        $("#login_window").kendoWindow({
            height: "340px", width: "280px",
            title: "EleMech Wiki",
            actions: ["Close"],
            resizable: false,
            draggable: false,
            modal: true,
            open: function () {
                if (local_storage_used) {
                    var user_name = localStorage.getItem("user_name");
                    $("#login_window_user_name").data("kendoMaskedTextBox").value(user_name);   // more reliable than data-binding
                    // focus on the right input
                    if (user_name) {
                        $("#login_window_password").focus();
                    }
                    else {
                        $("#login_window_user_name").focus();
                    }
                }
            },
            close: function () {
                $("#tetris").blockrain("autoplay", false);
                $("#tetris").blockrain("gameover");
            },
        }).data("kendoWindow");
        login_window = $("#login_window").data("kendoWindow");
        login_window.open().center();
        $("#help_window").kendoWindow({
            width: "350px",
            height: "100px",
            title: "Help",
            actions: ["Close"],
            resizable: false,
            draggable: false,
            open: function () {
                // reset
                APP.models.help_window.set("activ_code", "");
            },
        }).data("kendoWindow").close();
        help_window = $("#help_window").data("kendoWindow");
        $("#about_window").kendoWindow({
            width: "350px",
            height: "100px",
            title: "About",
            actions: ["Close"],
            resizable: false,
            draggable: false,
        }).data("kendoWindow").close();
        about_window = $("#about_window").data("kendoWindow");
        /// Dialogs
        logout_dialog = $("#logout_dialog").data("kendoDialog");
        /// ListViews

        /// Panes
        left_pane = $("#left_pane").data("kendoMobilePane");
        main_pane = $("#main_pane").data("kendoMobilePane");
        right_pane = $("#right_pane").data("kendoMobilePane");

        /// Validators
        $("#login_window").kendoValidator();

        /********** Grids **********/
        // Initialize
        $("#main_pane_edit_topics_screen_grid").kendoGrid({
            dataSource: {
                type: 'everlive',
                transport: {
                    typeName: "Topics"
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            Id: { editable: false },
                            CreatedAt: { type: "date", editable: false },
                            ModifiedAt: { type: "date", editable: false },
                            Owner: { editable: false },
                            Content: { editable: true },
                            Name: { editable: true, validation: { required: true } },
                            Tags: { editable: true },
                            ParentTopicId: { editable: true },
                            DiagramContent: { editable: true },
                        }
                    }
                },
                errors: "error",
                serverSorting: true,
                sort: {
                    field: "Name",
                    dir: "asc", // (asc)ending, (desc)ending
                },
                serverPaging: true,
                pageSize: 20,
                serverFiltering: true,
                filter: {
                    logic: "and",
                    filters: [
                        // only get topics without a parent ID
                        { field: "ParentTopicId", operator: "eq", value: "" }   // http://docs.telerik.com/kendo-ui/api/javascript/data/datasource#configuration-filter.operator
                    ]
                },
            },
            error: function (e) {
                console.error("main_pane_edit_topics_screen_grid >> ERROR >> " + e.errors);
            },
            detailInit: APP.models.main_pane_edit_topics_screen.grid_detail,
            columns: [
				{ field: "Name", title: "Name" },
				{
				    command: [
						{ name: "edit" },
						{ name: "destroy" },
				    ],
				    width: 250,
				},
            ],
            dataBound: function (e) {
                try {
                    var grid = e.sender;
                    var items = e.sender.items();
                    items.each(function () {
                        if (role == role_default) {
                            $(this).find(".k-grid-edit").hide();
                            $(this).find(".k-grid-delete").hide();
                        }
                        else if (role == role_editor) {
                            $(this).find(".k-grid-delete").hide();
                        }
                    });
                }
                catch (e) {
                    console.log("main_pane_edit_topics_screen_grid >> ERROR >> dataBound >> " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            cancel: function (e) {
                try {
                    var grid = $("#main_pane_edit_topics_screen_grid").data("kendoGrid");
                    grid.refresh();
                }
                catch (e) {
                    console.log("main_pane_edit_topics_screen_grid >> ERROR >> cancel >> " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            remove: function (e) {
                try {
                    var screen = left_pane.view().id;
                    switch (screen) {
                        case "#left_pane_home_screen": {
                            APP.models.left_pane_home_screen.before_show();
                            break;
                        }
                        case "#left_pane_subtopics_1": {
                            APP.models.left_pane_subtopics_1.before_show();
                            break;
                        }
                        case "#left_pane_subtopics_2": {
                            APP.models.left_pane_subtopics_2.before_show();
                            break;
                        }
                        case "#left_pane_subtopics_3": {
                            APP.models.left_pane_subtopics_3.before_show();
                            break;
                        }
                        case "#left_pane_subtopics_4": {
                            APP.models.left_pane_subtopics_4.before_show();
                            break;
                        }
                        default: {
                            console.log("main_pane_edit_topics_screen_grid >> ERROR >> remove >> screen unhandled >> " + screen);
                            screen_popup.error("Internal error.  Please see help.");
                            break;
                        }
                    }
                }
                catch (e) {
                    console.log("main_pane_edit_topics_screen_grid >> ERROR >> remove >> " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
            save: function (e) {
                try {
                    var screen = left_pane.view().id;
                    switch (screen) {
                        case "#left_pane_home_screen": {
                            APP.models.left_pane_home_screen.before_show();
                            break;
                        }
                        case "#left_pane_subtopics_1": {
                            APP.models.left_pane_subtopics_1.before_show();
                            break;
                        }
                        case "#left_pane_subtopics_2": {
                            APP.models.left_pane_subtopics_2.before_show();
                            break;
                        }
                        case "#left_pane_subtopics_3": {
                            APP.models.left_pane_subtopics_3.before_show();
                            break;
                        }
                        case "#left_pane_subtopics_4": {
                            APP.models.left_pane_subtopics_4.before_show();
                            break;
                        }
                        default: {
                            console.log("main_pane_edit_topics_screen_grid >> ERROR >> save >> screen unhandled >> " + screen);
                            screen_popup.error("Internal error.  Please see help.");
                            break;
                        }
                    }
                }
                catch (e) {
                    console.log("main_pane_edit_topics_screen_grid >> ERROR >> remove >> " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        });
        $("#main_pane_troubleshooting_screen_grid").kendoGrid({
            dataSource: {
                type: 'everlive',
                transport: {
                    typeName: 'Threads'
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            Name: { editable: true, validation: { required: true } },
                            CreatedAt: { editable: false },
                            ModifiedAt: { editable: false },
                        }
                    }
                },
                errors: "error",
                serverSorting: true,
                sort: {
                    field: "Name",
                    dir: "asc", // (asc)ending, (desc)ending
                },
                serverPaging: true,
                pageSize: 20,
            },
            error: function (e) {
                console.error("main_pane_troubleshooting_screen_grid >> ERROR >> " + e.errors);
            },
            detailInit: APP.models.main_pane_troubleshooting_screen.grid_detail,
            columns: [
				{ field: "Name", title: "Description" },
				{
				    command: [
						{ name: "edit" },
						{ name: "destroy" },
				    ],
				    width: 250,
				},
            ],
            dataBound: function (e) {
                try {
                    var grid = e.sender;
                    var items = e.sender.items();
                    items.each(function () {
                        if (role == role_default) {
                            $(this).find(".k-grid-edit").hide();
                            $(this).find(".k-grid-delete").hide();
                        }
                        else if (role == role_editor) {
                            $(this).find(".k-grid-delete").hide();
                        }
                    });
                }
                catch (e) {
                    console.log("main_pane_edit_topic_tags_screen_grid >> ERROR >> dataBound >> " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        });
        $("#main_pane_edit_topic_tags_screen_grid").kendoGrid({
            dataSource: {
                type: 'everlive',
                transport: {
                    typeName: "TopicTags"
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            CreatedAt: { editable: false },
                            ModifiedAt: { editable: false },
                            Owner: { editable: false },
                            Name: { editable: true, validation: { required: true } },
                        }
                    }
                },
                errors: "error",
                serverSorting: true,
                sort: {
                    field: "Name",
                    dir: "asc", // (asc)ending, (desc)ending
                },
                serverPaging: true,
                pageSize: 20,
                change: function (e) {
                    try {
                        var loc = "main_pane_edit_topic_tags_screen_grid >> change >> ";
                        var debug = false;

                        // remove tag from all topics
                        if (e.action == "remove") {
                            var tag_delete_id = e.items[0].Id;
                            APP.models.main_pane_edit_topic_tags_screen.query_topic_tag(tag_delete_id);
                        }
                    }
                    catch (e) {
                        console.log(loc + "edit >> " + e.toString());
                        screen_popup.error("Internal error.  Please see help.");
                    }
                },
            },
            error: function (e) {
                console.error("main_pane_edit_topic_tags_screen_grid >> ERROR >> " + e.errors);
            },
            columns: [
				{ field: "Name", title: "Name" },
				{
				    command: [
						{ name: "edit" },
						{ name: "destroy" },
				    ],
				    width: 250,
				},
            ],
            dataBound: function (e) {
                try {
                    var grid = e.sender;
                    var items = e.sender.items();
                    items.each(function () {
                        if (role == role_default) {
                            $(this).find(".k-grid-edit").hide();
                            $(this).find(".k-grid-delete").hide();
                        }
                        else if (role == role_editor) {
                            $(this).find(".k-grid-delete").hide();
                        }
                    });
                }
                catch (e) {
                    console.log("main_pane_edit_topic_tags_screen_grid >> ERROR >> dataBound >> " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        });
        // Set Options
        var main_pane_edit_topics_screen_grid = $("#main_pane_edit_topics_screen_grid").data("kendoGrid");
        main_pane_edit_topics_screen_grid.setOptions(grid_common_options);
        var main_pane_troubleshooting_screen_grid = $("#main_pane_troubleshooting_screen_grid").data("kendoGrid");
        main_pane_troubleshooting_screen_grid.setOptions(grid_common_options);
        var main_pane_edit_topic_tags_screen_grid = $("#main_pane_edit_topic_tags_screen_grid").data("kendoGrid");
        main_pane_edit_topic_tags_screen_grid.setOptions(grid_common_options);

        /********** Editor **********/
        $("#main_pane_topic_content_editor").kendoEditor({
            resizable: {
                content: true,
                toolbar: true
            },
            tools: [
                "bold", "italic", "underline", "strikethrough", "subscript", "superscript",
                "fontName", "fontSize", "foreColor", "backColor",
                "justifyLeft", "justifyCenter", "justifyRight", "justifyFull",
                "insertUnorderedList", "insertOrderedList", "indent", "outdent",
                "createLink", "unlink", "insertImage", "insertFile",
                "createTable", "addColumnLeft", "addColumnRight", "addRowAbove", "addRowBelow", "deleteRow", "deleteColumn",
                "formatting", "cleanFormatting",
                "print", "pdf",
                {
                    name: "save_changes",
                    tooltip: "Save your changes.",
                    exec: function (e) {
                        APP.models.main_pane_topic_content.save_post();
                    },
                },
            ],
            pdf: {
                author: "EleMech, Inc.",
                creator: "EleMech, Inc.",
                fileName: "EleMech Wiki Topic.pdf",
                keywords: "EleMech Wiki",
                margin: {
                    left: "0.5in",
                    right: "0.5in",
                    top: "1in",
                    bottom: "1in"
                },
                subject: "EleMech Wiki",
                title: "EleMech Wiki",
            },
            //change: function main_pane_topic_content_editor_change() {
            //    try {

            //    }
            //    catch (e) {
            //        console.error(arguments.callee.name + " >> error = " + e.toString());
            //        screen_popup.error("Internal Error.  Please see help.");
            //    }
            //},
            imageBrowser: {
                messages: {
                    dropFilesHere: "Drop files here"
                },
                transport: {
                    read: "ImageBrowser/Read",
                    destroy: {
                        url: "ImageBrowser/Destroy",
                        type: "POST"
                    },
                    create: {
                        url: "ImageBrowser/Create",
                        type: "POST"
                    },
                    thumbnailUrl: "ImageBrowser/Thumbnail",
                    uploadUrl: "ImageBrowser/Upload",
                    imageUrl: "ImageBrowser/Image?path={0}"
                }
            },
            fileBrowser: {
                messages: {
                    dropFilesHere: "Drop files here"
                },
                transport: {
                    read: "FileBrowser/Read",
                    destroy: {
                        url: "FileBrowser/Destroy",
                        type: "POST"
                    },
                    create: {
                        url: "FileBrowser/Create",
                        type: "POST"
                    },
                    uploadUrl: "FileBrowser/Upload",
                    fileUrl: "FileBrowser/File?fileName={0}"
                }
            },
        });

        /********** Diagram **********/
        //Method 1: using cloud
        // E.X data >> {"shapes":[{"id":"v5i4Wd9Cuj","hover":{"opacity":0.2},"cursor":"pointer","content":{"align":"center middle","color":"#2e2e2e","template":"#= dataItem.Title #","fontSize":17,"text":"Testing 123"},"selectable":true,"serializable":true,"enable":true,"type":"rectangle","path":"","autoSize":true,"x":50,"y":50,"minWidth":20,"minHeight":20,"width":240,"height":67,"editable":{"connect":true,"tools":[],"drag":{"snap":{"size":10,"angle":10}},"remove":true},"connectors":[{"name":"Top"},{"name":"Bottom"},{"name":"Left"},{"name":"Right"},{"name":"Auto"}],"rotation":{"angle":0},"stroke":{"width":0},"fill":{"color":"#e15613"},"connectorDefaults":{"fill":{"color":"#282828"},"stroke":{"color":"#fff"},"hover":{"fill":{"color":"#fff"},"stroke":{"color":"#282828"}}},"undoable":true,"dataItem":{"id":0,"Title":"Testing 123","Color":"red","__kendo_devtools_id":195}}],"connections":[]}
        $("#main_pane_topic_diagram_diagram").kendoDiagram({
            dataSource: {
                type: "everlive",
                transport: {
                    typeName: "TopicDiagrams"
                },
                schema: {
                    model: {
                        id: Everlive.idField,
                        fields: {
                            CreatedAt: { type: "date", editable: false },
                            ModifiedAt: { type: "date", editable: false },
                            Owner: { editable: false },
                            Title: { type: "string", editable: true },
                            Color: { type: "string", editable: true },
                        }
                    }
                }
            },
            shapeDefaults: {
                visual: function visualTemplate(options) {
                    var dataviz = kendo.dataviz;
                    var g = new dataviz.diagram.Group();
                    var dataItem = options.dataItem;
                    g.append(new dataviz.diagram.Rectangle({
                        width: 240,
                        height: 67,
                        stroke: {
                            width: 0
                        },
                        fill: "#e8eff7"
                    }));
                    g.append(new dataviz.diagram.Rectangle({
                        width: 8,
                        height: 67,
                        fill: dataItem.Color,
                        stroke: {
                            width: 0
                        }
                    }));
                    return g;
                },
                content: {
                    template: "#= dataItem.Title #",
                    fontSize: 17
                }
            },
            editable: {
                tools: [
                    {
                        name: "edit"
                    },
                    {
                        name: "createShape"
                    },
                    {
                        name: "createConnection"
                    },
                    {
                        name: "undo"
                    },
                    {
                        name: "redo"
                    },
                    {
                        name: "rotateClockwise"
                    },
                    {
                        name: "rotateAnticlockwise"
                    },
                    {
                        name: "delete"
                    },
                ]
            },
            pdf: {
                author: "EleMech, Inc.",
                creator: "EleMech, Inc.",
                fileName: "EleMech Wiki Diagram.pdf",
                keywords: "EleMech Wiki Diagram",
                subject: "Diagram",
                title: "Diagram",
                landscape: true,
                margin: {
                    left: "0.5in",
                    right: "0.5in",
                    top: "1in",
                    bottom: "1in"
                },
            },
        });

        // Method 2: using CRUD
        //var shapesDataSource = {
        //    batch: false,
        //    transport: {
        //        read: {
        //            url: "DiagramShapes",
        //            dataType: "jsonp"
        //        },
        //        update: {
        //            url: "DiagramShapes/Update",
        //            dataType: "jsonp"
        //        },
        //        destroy: {
        //            url: "DiagramShapes/Destroy",
        //            dataType: "jsonp"
        //        },
        //        create: {
        //            url: "DiagramShapes/Create",
        //            dataType: "jsonp"
        //        },
        //        parameterMap: function (options, operation) {
        //            if (operation !== "read") {
        //                return { models: kendo.stringify(options.models || [options]) };
        //            }
        //        }
        //    },
        //    schema: {
        //        model: {
        //            id: "id",
        //            fields: {
        //                id: { from: "Id", type: "number", editable: false },
        //                JobTitle: { type: "string" },
        //                Color: { type: "string" }
        //            }
        //        }
        //    }
        //};
        //var connectionsDataSource = {
        //    batch: false,
        //    transport: {
        //        read: {
        //            url: "DiagramConnections",
        //            dataType: "jsonp"
        //        },
        //        update: {
        //            url: "DiagramConnections/Update",
        //            dataType: "jsonp"
        //        },
        //        destroy: {
        //            url: "DiagramConnections/Destroy",
        //            dataType: "jsonp"
        //        },
        //        create: {
        //            url: "DiagramConnections/Create",
        //            dataType: "jsonp"
        //        },
        //        parameterMap: function (options, operation) {
        //            if (operation !== "read") {
        //                return { models: kendo.stringify(options.models || [options]) };
        //            }
        //        }
        //    },
        //    schema: {
        //        model: {
        //            id: "id",
        //            fields: {
        //                id: { from: "Id", type: "number", editable: false },
        //                from: { from: "FromShapeId", type: "number" },
        //                to: { from: "ToShapeId", type: "number" },
        //                fromX: { from: "FromPointX", type: "number" },
        //                fromY: { from: "FromPointY", type: "number" },
        //                toX: { from: "ToPointX", type: "number" },
        //                toY: { from: "ToPointY", type: "number" }
        //            }
        //        }
        //    }
        //};
        //$("#main_pane_topic_diagram_diagram").kendoDiagram({
        //    dataSource: shapesDataSource,
        //    connectionsDataSource: connectionsDataSource,
        //    layout: {
        //        type: "tree",
        //        subtype: "tipover",
        //        underneathHorizontalOffset: 140
        //    },
        //    shapeDefaults: {
        //        visual: function visualTemplate(options) {
        //            var dataviz = kendo.dataviz;
        //            var g = new dataviz.diagram.Group();
        //            var dataItem = options.dataItem;
        //            if (dataItem.JobTitle === "President") {
        //                g.append(new dataviz.diagram.Circle({
        //                    radius: 60,
        //                    stroke: {
        //                        width: 2,
        //                        color: dataItem.Color || "#586477"
        //                    },
        //                    fill: "#e8eff7"
        //                }));
        //            } else {
        //                g.append(new dataviz.diagram.Rectangle({
        //                    width: 240,
        //                    height: 67,
        //                    stroke: {
        //                        width: 0
        //                    },
        //                    fill: "#e8eff7"
        //                }));
        //                g.append(new dataviz.diagram.Rectangle({
        //                    width: 8,
        //                    height: 67,
        //                    fill: dataItem.Color,
        //                    stroke: {
        //                        width: 0
        //                    }
        //                }));
        //            }
        //            return g;
        //        },
        //        content: {
        //            template: "#= dataItem.JobTitle #",
        //            fontSize: 17
        //        }
        //    },
        //    connectionDefaults: {
        //        stroke: {
        //            color: "#586477",
        //            width: 2
        //        }
        //    },
        //    dataBound: function onDataBound(e) {
        //        var that = this;
        //        setTimeout(function () {
        //            that.bringIntoView(that.shapes);
        //        }, 0);
        //    },
        //});

        //Method 3: using everlive
        //var shapesDataSource = {
        //    type: "everlive",
        //    transport: {
        //        typeName: "TopicDiagrams"
        //    },
        //    schema: {
        //        model: {
        //            id: Everlive.idField,
        //            fields: {
        //                CreatedAt: { type: "date", editable: false },
        //                ModifiedAt: { type: "date", editable: false },
        //                Owner: { editable: false },
        //                Title: { type: "string", editable: true },
        //                Color: { type: "string", editable: true },
        //            }
        //        }
        //    }
        //};
        //var connectionsDataSource = {
        //    type: "everlive",
        //    transport: {
        //        typeName: "TopicDiagrams"
        //    },
        //    schema: {
        //        model: {
        //            id: Everlive.idField,
        //            fields: {
        //                id: { from: "Id", type: "number", editable: false },
        //                from: { from: "FromShapeId", type: "number" },
        //                to: { from: "ToShapeId", type: "number" },
        //                fromX: { from: "FromPointX", type: "number" },
        //                fromY: { from: "FromPointY", type: "number" },
        //                toX: { from: "ToPointX", type: "number" },
        //                toY: { from: "ToPointY", type: "number" }
        //            }
        //        }
        //    }
        //};
        //$("#main_pane_topic_diagram_diagram").kendoDiagram({
        //    dataSource: shapesDataSource,
        //    connectionsDataSource: connectionsDataSource,
        //    layout: {
        //        type: "tree",
        //        subtype: "tipover",
        //        underneathHorizontalOffset: 140
        //    },
        //    shapeDefaults: {
        //        visual: function visualTemplate(options) {
        //            var dataviz = kendo.dataviz;
        //            var g = new dataviz.diagram.Group();
        //            var dataItem = options.dataItem;
        //            g.append(new dataviz.diagram.Rectangle({
        //                width: 240,
        //                height: 67,
        //                stroke: {
        //                    width: 0
        //                },
        //                fill: "#e8eff7"
        //            }));
        //            g.append(new dataviz.diagram.Rectangle({
        //                width: 8,
        //                height: 67,
        //                fill: dataItem.Color,
        //                stroke: {
        //                    width: 0
        //                }
        //            }));
        //            return g;
        //        },
        //        content: {
        //            template: "#= dataItem.Title #",
        //            fontSize: 17
        //        }
        //    },
        //    connectionDefaults: {
        //        stroke: {
        //            color: "#586477",
        //            width: 2
        //        }
        //    },
        //    editable: {
        //        tools: [
        //            {
        //                name: "createShape"
        //            },
        //            {
        //                name: "createConnection"
        //            },
        //            {
        //                name: "undo"
        //            },
        //            {
        //                name: "redo"
        //            },
        //        ]
        //    },
        //    pdf: {
        //        author: "EleMech, Inc.",
        //        creator: "EleMech, Inc.",
        //        fileName: "EleMech Wiki Diagram.pdf",
        //        keywords: "EleMech Wiki Diagram",
        //        subject: "Diagram",
        //        title: "Diagram",
        //        landscape: true,
        //        margin: {
        //            left: "0.5in",
        //            right: "0.5in",
        //            top: "1in",
        //            bottom: "1in"
        //        },
        //    },
        //});

        // Method 4: using custom CRUD
        //var shapesDataSource = {
        //    batch: false,
        //    transport: {
        //        read: function (e) {
        //            e.success();
        //        },
        //        update: function (e) {
        //            e.success();
        //        },
        //        destroy: function (e) {
        //            e.success();
        //        },
        //        create: function (e) {
        //            e.success();
        //        },
        //    },
        //    schema: {
        //        model: {
        //            id: "id",
        //            fields: {
        //                id: { from: "Id", type: "number", editable: false },
        //                JobTitle: { type: "string" },
        //                Color: { type: "string" }
        //            }
        //        }
        //    }
        //};
        //var connectionsDataSource = {
        //    batch: false,
        //    transport: {
        //        read: function (e) {
        //            e.success();
        //        },
        //        update: function (e) {
        //            e.success();
        //        },
        //        destroy: function (e) {
        //            e.success();
        //        },
        //        create: function (e) {
        //            e.success();
        //        },
        //    },
        //    schema: {
        //        model: {
        //            id: "id",
        //            fields: {
        //                id: { from: "Id", type: "number", editable: false },
        //                from: { from: "FromShapeId", type: "number" },
        //                to: { from: "ToShapeId", type: "number" },
        //                fromX: { from: "FromPointX", type: "number" },
        //                fromY: { from: "FromPointY", type: "number" },
        //                toX: { from: "ToPointX", type: "number" },
        //                toY: { from: "ToPointY", type: "number" }
        //            }
        //        }
        //    }
        //};
        //$("#main_pane_topic_diagram_diagram").kendoDiagram({
        //    dataSource: shapesDataSource,
        //    connectionsDataSource: connectionsDataSource,
        //    layout: {
        //        type: "tree",
        //        subtype: "tipover",
        //        underneathHorizontalOffset: 140
        //    },
        //    shapeDefaults: {
        //        visual: function visualTemplate(options) {
        //            var dataviz = kendo.dataviz;
        //            var g = new dataviz.diagram.Group();
        //            var dataItem = options.dataItem;
        //            g.append(new dataviz.diagram.Rectangle({
        //                width: 240,
        //                height: 67,
        //                stroke: {
        //                    width: 0
        //                },
        //                fill: "#e8eff7"
        //            }));
        //            g.append(new dataviz.diagram.Rectangle({
        //                width: 8,
        //                height: 67,
        //                fill: dataItem.Color,
        //                stroke: {
        //                    width: 0
        //                }
        //            }));
        //            return g;
        //        },
        //        content: {
        //            template: "#= dataItem.Title #",
        //            fontSize: 17
        //        }
        //    },
        //    connectionDefaults: {
        //        stroke: {
        //            color: "#586477",
        //            width: 2
        //        }
        //    },
        //    editable: {
        //        tools: [
        //            {
        //                name: "createShape"
        //            },
        //            {
        //                name: "createConnection"
        //            },
        //            {
        //                name: "undo"
        //            },
        //            {
        //                name: "redo"
        //            },
        //        ]
        //    },
        //    pdf: {
        //        author: "EleMech, Inc.",
        //        creator: "EleMech, Inc.",
        //        fileName: "EleMech Wiki Diagram.pdf",
        //        keywords: "EleMech Wiki Diagram",
        //        subject: "Diagram",
        //        title: "Diagram",
        //        landscape: true,
        //        margin: {
        //            left: "0.5in",
        //            right: "0.5in",
        //            top: "1in",
        //            bottom: "1in"
        //        },
        //    },
        //});

        // skip login
        if (skip_login) {
            setTimeout(function () {
                $("#login_window_user_name").val("admin");
                $("#login_window_password").val("wikifire");
                APP.models.login_window.submit_button_click();
            }, 500);
        }

        // check internet
        try {
            // will throw exception if script source was not downloaded
            el = new Everlive({ appId: el_app_id, scheme: 'https' });
            online = true;
            console.log("Browser has internet.");
        }
        catch (e) {
            online = false;
            console.log("Browser does not have internet.");
        }

        // Converse Chat
        if (chat_used) {
            converse.plugins.add("wiki_chat_plugin", {
                initialize: function () {
                    window.converse_logout = function () {
                        this._converse.logout();
                    }
                },
                logout: function () {
                    this._converse.api.user.logout();
                    console.log("user logged out of chat");
                },
            });
        }

        app.hideLoading();
        console.log("Program initialized.");
    }
    catch (e) {
        console.error(arguments.callee.name + " >> error = " + e.toString());
        screen_popup.error("Internal Error.  Please see help.");
        app.hideLoading();
    }
};

app = new kendo.mobile.Application($(document.body), {
    initial: "main_splitter",
    skin: "default",
    statusBarStyle: "black-translucent",
    init: app_init,
});

// Saved Code
/* 
    console.log(arguments.callee.name + ": ");
*******************************************************************************************
        blank_model: kendo.observable({
            // functions
            empty_function: function empty_function() {
                try {
                    var debug = false;
                    var loc = " >>  >> ";
                   
                }
                catch (e) {
                    console.error(arguments.callee.name + " >> ERROR >> " + e.toString());
                    screen_popup.error("Internal error.  Please see help.");
                }
            },
        }),
*******************************************************************************************
try {

} 
catch (e) {
    console.log(" >> ERROR >> " + e.toString());
}
*******************************************************************************************
switch (param) {
    case '': {
        break;
    }
    default: {
        console.log(loc + "ERROR >> param unhandled >> " + param);
        screen_popup.error("Internal error.  Please see help.");
        break;
    }
}
*******************************************************************************************
screen_popup_short.info("information");
screen_popup_short.success("success");
screen_popup.warning("warning");
screen_popup.error("error");
*******************************************************************************************
    var url = "";
    $.post({ url: url, dataType: "json", data: data_obj, crossOrigin: true, cache: false}, function (data) {
        try {
            console.log(loc + "SUCCESS >> " + JSON.stringify(data));
            var ret = data.ReturnCode;
            if (ret < 0) {
                console.log(loc + "ERROR >> " + data.FunctionResult);
                if (ret === -1) {
                    screen_popup.error("Internal Error.  Please see help.");
                }
                else if (ret === -2) {
                    screen_popup.warning(data.FunctionResult);
                }
                else {
                    screen_popup.error("Internal Error.  Please see help.");
                    console.log(loc + "ERROR >> return unhandled >> " + ret.toSring());
                }
            }
            else {
                
            }
        }
        catch (e) {
            console.error(loc + e.toString());
            screen_popup.error("Internal Error.  Please see help.");
        }
    });
*******************************************************************************************
        var url = URL + "";
        if (debug) console.log(loc + "url = " + url);
        $.getJSON(url, function (data) {
			try {
				console.log(loc + "SUCCESS >> " + JSON.stringify(data));

			}
			catch (e) {
				console.error(loc + e.toString());
                screen_popup.error("Internal Error.  Please see help.");
			}
		});
*******************************************************************************************
    var url = "";
    var loc = " >>  >> ";
    $.ajax({
        url: url,
        type: 'GET',
        dataType: "text",
        timeout: 5000,
        beforeSend: function (jqXHR, settings) {
            app.showLoading();
            jqXHR.url = settings.url;
            myglobal.ajax_in_use = true;
        },
        success: function (data) {
            try {
                console.log(loc + "SUCCESS >> " + JSON.stringify(data));
            } 
            catch (e) {
                console.error(loc + e.toString());
                screen_popup.error("Internal Error.  Please see help.");
            }
        },
        error: function (jqXHR, exception) {
            var msg = '';
            if (jqXHR.status === 0) {
                msg = 'No connection.';
            } 
            else if (jqXHR.status === 404) {
                msg = 'Requested page not found. [404]';
            } 
            else if (jqXHR.status === 500) {
                msg = 'Internal Server Error [500].';
            } 
            else if (exception === 'parsererror') {
                msg = 'Requested JSON parse failed.';
            } 
            else if (exception === 'timeout') {
                msg = 'Time out error.';
            } 
            else if (exception === 'abort') {
                msg = 'Ajax request aborted.';
            } 
            else {
                msg = 'Uncaught Error = ' + jqXHR.responseText;
            }
            console.log(loc + "ERROR >> " + msg + "; url: " + jqXHR.url);
            screen_popup.error(msg);
        },
        complete: function (jqXHR, textStatus) {
            app.hideLoading();
            myglobal.ajax_in_use = false;
        },
    }); 
*******************************************************************************************
*/
// Notes
/*
*******************************************************************************************
dataSource >> schema >> model >> fields >> types >> string, number, boolean, date, default (no conversion)
source: http://docs.telerik.com/kendo-ui/api/javascript/data/model#methods-Model.define
*******************************************************************************************
dataSource filter operators: http://docs.telerik.com/kendo-ui/api/javascript/data/datasource#configuration-filter.operator
*******************************************************************************************
*/
