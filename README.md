# Brackets Extension Manager

This extension manages Brackets extensions from a central repository. It requires a seperate node server.

## Install

Clone the extension manager into the disabled extensions folder from Brackets:

    git clone git://github.com/jdiehl/brackets-extension-manager.git brackets/src/extensions/disabled/ExtensionManager

Create a link to enable the extension manager:

    ln -s brackets/src/extensions/disabled/ExtensionManager brackets/src/extensions/user/ExtensionManager

Install [node.js](http://nodejs.org/) and npm, then install the necessary node modules:

    cd brackets/src/extensions/disabled/ExtensionManager
    npm install

## Run

First launch the node server:

    cd brackets/src/extensions/disabled/ExtensionManager
    npm start

Then start Brackets as usual. You can open the extension manager via the Tools menu or by using the shortcut **Ctrl-Shift-E** (**Command-Shift-E** on the Mac).

## License

Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 
Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction, including without limitation 
the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the 
Software is furnished to do so, subject to the following conditions:
 
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
DEALINGS IN THE SOFTWARE.
