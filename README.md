# Collaboration Instructions

To clone the repository:
- Navigate to the directory you want the project to be in
- run "git clone https://github.com/Wingo206/Mr-Pizza.git"
- input your github credentials

required node modules:
- jasmine
- mysql2
- supertest

Setup node environemnt
- cd into the project directory
- run "npm ci". This will install the exact same versions of each required module, as specified in the package-lock.json file.
- run unit tests to ensure everything is working (npm test)

Directory Structure:
- server.js: entry point. Run "node server.js" from the Mr-Pizza/ directory.
- lib: backend code.
- public: files which are accessable for the frontend to request. Eg: front-end script, css, images that display on the webpages.
- routes: files that specify how to route api calls and fetching resources.
- views: HTML files

routing:
- api routes eg: "/stores/72/delete" -> routes to a function being run
- page routes eg: "/views/test.html" -> ending in .html routes to a file in the views folder (/Mr-Pizza/views/homepage.html)
- public file routes eg: "/public/scripts/testScript.js" -> routes to the public folder

<!-- if a route starts with "/views/" or "/public/", then those folders will be prioritized. Then, it will check if it matches an api route. Otherwise, it will return 404 resource not found. -->

To add a route:
- Create a file in the "routes/" directory
- export a list of JSON objects with the following properties:
    - method (GET, POST, etc)
    - path (eg: "/stores", "/delivery/123")
        - can be either a string (exact match), or a regex (use for when an input is added to the url, like "/delivery/123")
    - handler (async function/lambda with inputs (req, res))
    - <optional> validator (function (req) => {true/false}). If present, the server will run the validator on req before running your handler. Use your own, or one of the validators from utils/validators.js (TODO) 
- *anything that is put into /views/ and /public/ will be handled automatically*

# Mr Pizza
