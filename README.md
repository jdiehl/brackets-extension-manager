# Brackets Extension Manager

This extension manages Brackets extensions from a central repository. It requires a seperate [Node.js](http://nodejs.org/) server.

## Install

- Install [Node.js](http://nodejs.org/) and npm
- In Brackets, click on Help > Show Extensions Folder
- Open the `user` folder
- Open a shell and navigate to that folder
- Clone the extension manager:

        git clone git://github.com/jdiehl/brackets-extension-manager.git extension-manager

- Install the necessary node modules

        cd extension-manager
        npm install
    
## Run

- Open a shell in the extension manager folder
- Run the [Node.js](http://nodejs.org/) server:

        node server

- Start Brackets

Open the extension manager via the Tools menu or by using the shortcut **Ctrl-Shift-E** (**Command-Shift-E** on the Mac).

## Compatibility

Combinations known to work:

- Mac OS X 10.7 and Node.js 0.6
- Windows XP SP3 and Node.js 0.8

Please contact us for results with different combinations - working or not!

## License

Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
