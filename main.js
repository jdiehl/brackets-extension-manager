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

    // Brackets modules
    var EditorManager           = brackets.getModule("editor/EditorManager"),
        ProjectManager          = brackets.getModule("project/ProjectManager"),
        Commands                = brackets.getModule("command/Commands"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        KeyBindingManager       = brackets.getModule("command/KeyBindingManager"),
        Menus                   = brackets.getModule("command/Menus"),
        ExtensionLoader         = brackets.getModule("utils/ExtensionLoader");

    // Extension modules
    var extensionManager = require("extensionManager");
    
    function _addMenuEntry() {
        var commandId = "i10.extension_manager.show";
        CommandManager.register("Extension Manager", commandId, extensionManager.show);
        
        var menuId = "tools-menu";
        var menu = Menus.getMenu(menuId);
        if (!menu) {
            menu = Menus.addMenu("Tools", menuId);
        }
        
        var args = [commandId, "Ctrl-Shift-E"];
        try {
            menu.addMenuItem.apply(menu, args);
        } catch (err) {
            // Backwards compatibility: first parameter of addMenuItem was an id, prior to commit ea3d26f
            console.log("Using addMenuItem() the old way");
            args.unshift("menu-tools-extension-manager");
            menu.addMenuItem.apply(menu, args);
        }
    }
    
    // Init the UI
    function init() {
        extensionManager.init(function () {
            _addMenuEntry();
        });
    }

    init();
});
