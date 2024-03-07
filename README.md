# Setup Instructions

To clone the repository:
- Navigate to the directory you want the project to be in
- run "git clone https://github.com/Wingo206/Mr-Pizza.git"
- input your github credentials

required node modules:
- jasmine
- mysql2
- supertest
- cookie
- jsonwebtoken

Setup node environemnt
- cd into the project directory
- run "npm ci". This will install the exact same versions of each required module, as specified in the package-lock.json file.
- run unit tests to ensure everything is working (npm test)

Setup MySQL Database
- To ensure that sql passwords and other sensitive information is specific to your computer and never uploaded to git, these details are kept in a separate config folder which is on the .gitignore. When you clone the repository, you will need to setup the config values and the database.
- make a copy of /lib/util/config_template.js
- rename it to "config.js", keep it in /lib/util/
- Set any values that are empty strings to the appropriate values (eg: choose a password for the different sql accounts)
- navigate to models/
- run "node substitute.js". This will take the template sql script and substitute in all the config values into the script, and make a copy called "setup.sql" in the temp folder
- open the /models/temp/setup.sql file and run it (I am doing it by running "sudo mysql -u root" inside the temp/ folder and "source ./setup.sql". you can use mysqlWorkbench if you want.)

Setup HTTPS SSL Certificate
- To encrypt all data in requests, HTTPS is used. This requires an SSL certificate, which we also don't want to upload to git, so you need to generate one for your own copy of the repository.
- navigate to the ssl/ directory. If it's not there, make one directly under the Mr-Pizza directory.
- run "openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
-keyout server.key -out server.crt" to generate the certificate and key. These will be read when the server is started.

Directory Structure:
- server.js: entry point. Run "node server.js" from the Mr-Pizza/ directory.
- lib: backend code.
- public: files which are accessable for the frontend to request. Eg: html files, front-end script, css, images that display on the webpages.
- routes: files that specify how to route api calls and fetching resources.

Running the server:
- navigate to Mr-Pizza/
- run "node server.js"
- to view the server, open your web browser and go to "https://127.0.0.1/html/example.html".
- There will likely be a prompt saying that the server is not secure which is fine, go to advanced and click proceed.

# Collaboration Instructions

routing:
- api routes eg: "/stores/72/delete" -> routes to a function being run
- public file routes eg: "/html/test.html" -> routes to a file in the public folder
- *anything that is put into "/public/" will be automatically given a route, relative to /Mr-Pizza/public/*

To add a route:
- Create a file in the "routes/" directory
- export a list of JSON objects with the following properties:
    - method (GET, POST, etc)
    - path (eg: "/stores", "/delivery/123")
        - can be either a string (exact match), or a regex (use for when an input is added to the url, like "/delivery/123")
    - handler (async function/lambda with inputs (req, res))
    - <optional> validator (function (req) => {true/false}). If present, the server will run the validator on req before running your handler. Use your own, or one of the validators from utils/validators.js (TODO) 

# TODO
framework:
- validators for routes
- authentication handling with login page and JWT tokens
- sql server setup with schema and permissions
- utilities to extract parameters from the path when matched with regex
- unit testability for loading routes (low prio)
- path redirects (low prio)

# Mr Pizza
