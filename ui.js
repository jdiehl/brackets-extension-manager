/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */

define(function (require, exports, module) {
	'use strict';

	// Sadly hardcoded for now
	var extensionDir = "extensions/user/";
	var extensionManagerDir = extensionDir + "ExtensionManager/";
	
	// Brackets modules
	var EditorManager           = brackets.getModule("editor/EditorManager"),
		ProjectManager          = brackets.getModule("project/ProjectManager"),
		Commands                = brackets.getModule("command/Commands"),
		CommandManager          = brackets.getModule("command/CommandManager"),
		KeyBindingManager       = brackets.getModule("command/KeyBindingManager"),
		ExtensionLoader         = brackets.getModule("utils/ExtensionLoader");

	// Extension modules
	var client = require("extensions-manager-client");
	
	var _init = false;
	var $dialog,
		$extensions,
		$item;


	function _preventUserAction($element, callback) {
		var $targets = $element.find(":input").andSelf();
		function release() {
			$targets.attr("disabled", false);
		}
		$targets.attr("disabled", true);
		callback(release);
		if (callback.length === 0) release();
	}

	// click handler: switch between installed and active extensions
	function _onTabClick(event) {
		var $this = $(event.currentTarget);
		$this.siblings().removeClass("active");
		$this.addClass("active");
		$extensions.toggleClass("installed", $this.is(".installedTab"));
	}

	// click handler: update all
	function _onUpdateAllClick(event) {
		var $this = $(event.currentTarget);
		_preventUserAction($this, function (release) {
			client.updateAll(function () {
				release();
			});
		});
	}

	// click handler: update
	function _onUpdateClick(event) {
		var $this = $(event.currentTarget);
		var $extension = $this.parent().parent();
		var name = $extension.data("name");
		_preventUserAction($extension, function (release) {
			client.update(name, function () {
				//$extension.removeClass("outdated");
				release();
			});
		});
	}

	// click handler: uninstall
	function _onUninstallClick(event) {
		var $this = $(event.currentTarget);
		var $extension = $this.parent().parent();
		var name = $extension.data("name");
		_preventUserAction($extension, function (release) {
			function runUninstall() {
				client.uninstall(name, function () {
					$extension.removeClass("installed").removeClass("enabled");
					$extension.find(".installationCheckbox").attr('checked', false);
					release();
				});
			}
			if ($extension.is(".enabled")) {
				client.disable(name, runUninstall);
			} else {
				runUninstall();
			}
		});
	}
	// change handler: install / enable / disable an extension
	function _onExtensionChange(event) {
		var $this = $(event.currentTarget);
		var enable = $this.attr("checked");
		var $extension = $this.parent();
		var name = $extension.data("name");

		// deativate all input elements for the extension while we are doing something
		_preventUserAction($extension, function (release) {
			// install the extension
			if (!$extension.is(".installed")) {
				client.install(name, function () {
					$extension.addClass("installed").addClass("enabled");
					release();
				});
			} else {
				client[enable ? "enable" : "disable"](name, function () {
					$extension.toggleClass("enabled", enable);
					release();
				});
			}

		});
	}

	// populate the dialog with extensions
	function _populate(extensions) {
		$.each(extensions, function (index, extension) {
			var $extension = $item.clone().appendTo($extensions);
			
			// configure the css classes
			$extension
				.toggleClass("installed", typeof extension.status !== "undefined")
				.toggleClass("enabled", extension.status === 1)
				// Updating for now means git pull
				.toggleClass("outdated", true);
			
			// configure the check box
			$extension.find(".installationCheckbox")
				.attr("checked", $extension.is(".enabled"));
			
			// fill the content text
			$extension.find(".titleField").text(extension.title);
			$extension.find(".descriptionField").text(extension.description);
			$extension.find(".versionField").text(extension.version);

			// save the extension name
			$extension.data("name", extension.name);
		});
	}

	function _reset() {
		$dialog.find(".tabSwitcher li").removeClass("active").first().click();
		$extensions.children().remove();
	}

	function _loadStyle() {
		$("<link rel='stylesheet' type='text/css'>").attr("href", extensionManagerDir + "ui.css").appendTo(window.document.head);
	}
		
	function _loadTemplate(callback) {
		$.get(extensionManagerDir + "ui.html", callback);
	}

	function _setupTemplate(template) {
		// Append template to a DIV to make .find() work
		$dialog = $("<div>").append(template).find(".modal");
		$extensions = $dialog.find(".extensions").addClass("installed");
		$item = $extensions.find("> div:first").remove();

		// set up the click handlers
		$dialog.find(".tabSwitcher").on("click", "li", _onTabClick);
		$dialog.find(".updateAllButton").click(_onUpdateAllClick);
		$extensions.on("click", ".updateButton", _onUpdateClick);
		$extensions.on("click", ".uninstallButton", _onUninstallClick);
		$extensions.on("change", ".installationCheckbox", _onExtensionChange);

		// add to DOM
		$dialog.hide().appendTo(window.document.body);
		$dialog.modal({ backdrop: "static", keyboard: true, show: false });
	}

	// reset, show, and populate the dialog
	function show() {
		if (!_init) return;
		_reset();
		$dialog.modal();
		client.list(_populate);
	}

	// Init the UI
	function init(callback) {
        $(function () {
			client.init(function () {
				_loadStyle();
				_loadTemplate(function (template) {
					_setupTemplate(template);
					_init = true;
					callback();
				});
			});
        });
	}

	exports.init = init;
	exports.show = show;
});
