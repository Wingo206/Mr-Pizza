# Setup Instructions

## To clone the repository:
- Navigate to the directory you want the project to be in
- run "git clone https://github.com/Wingo206/Mr-Pizza.git"
- input your github credentials

## Setup node environemnt
- cd into the project directory
- run ```npm ci```. This will install the exact same versions of each required module, as specified in the package-lock.json file.
<!-- - run unit tests to ensure everything is working (npm test) -->
- This will install the following packages
    - jasmine
    - mysql2
    - supertest
    - cookie
    - jsonwebtoken

## Setup MySQL Database
- To ensure that sql passwords and other sensitive information is specific to your computer and never uploaded to git, these details are kept in a separate config folder which is on the .gitignore. When you clone the repository, you will need to setup the config values and the database.
- make a copy of /lib/util/config_template.js
- rename it to "config.js", keep it in /lib/util/
- Set any values that are empty strings to the appropriate values (eg: choose a password for the different sql accounts)
- navigate to models/
- run ```node substitute.js```. This will take the template sql script and substitute in all the config values into the script, and make a copy called "setup.sql" in the temp folder
- open the /models/temp/setup.sql file and run it (I am doing it by running ```sudo mysql -u root``` inside the temp/ folder and "source ./setup.sql". you can use mysqlWorkbench if you want.)
- NOTE: If you are on Linux, you may need an alternative version of mysql. For Arch Linux, substitute mysql commands with the mariadb package.

## Setup HTTPS SSL Certificate
- To encrypt all data in requests, HTTPS is used. This requires an SSL certificate, which we also don't want to upload to git, so you need to generate one for your own copy of the repository.
- navigate to the ssl/ directory. If it's not there, make one directly under the Mr-Pizza directory.
- run ```openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout server.key -out server.crt``` to generate the certificate and key. These will be read when the server is started.

## Running the server:
- navigate to Mr-Pizza/
- run ```node ./server.js```
- to view the webpage, open your web browser and go to "https://127.0.0.1:8080/home/home.html".
- There will likely be a prompt saying that the server is not secure which is fine, go to advanced and click proceed.
- You can also try any of the other routes that are printed to the console.

# Collaboration Instructions
Directory Structure:
- lib: backend code.
- models: setup for sql database
- public: files which are accessable for the frontend to request. Eg: html files, front-end script, css, images that display on the webpages.
- spec: jasmine tests
- ssl: (Secure Sockets Layer) keys used for https secure communication

## General Workflow:
- Create a .js backend file and place this in the lib/ directory.
- Implement a function that takes (req, res) as the inputs and sends a response inside the body.
- Add the route to the module exports (**see the To add a route section. Do this step before moving on with the steps directly below.**).
- Create a .html frontend page and place this in the public/ directory.
- Create a .js frontend script and place this in the public/ directory.
- Include the frontend script in the html file by using a <script src = "..."> tag.
- Add frontend code that will send a request to your Api route using fetch when desired (eg: on load, clicking a button)
- Example workflow: exampleApi.js, example.html, examplePublicScript.js.
- Calling Apis using fetch example: customerLoginScript.js

### To add a route:
- **check the example in /lib/exampleApi.js**
- Within a file in the lib/ directory:
- add the the exports the routes property, which is a list of JSON objects with the following properties:
    - method (GET, POST, etc)
    - path (eg: "/stores", "/delivery/123")
        - can be either a string (exact match), or a regex (use for when an input is added to the url, like "/delivery/123")
    - handler (async function/lambda with inputs (req, res))
 
### routing:
- api routes eg: "/stores/72/delete" -> routes to a function being run
- public file routes eg: "/html/test.html" -> routes to a file in the public folder
- *anything that is put into "/public/" will be automatically given a route, relative to /Mr-Pizza/public/*

## Enforce Authorization:
- Wrap your handler with handleAuth to ensure that the request has a valid authorization cookie before running your handler.
    - example: authApi.js, /loggedInTest route.
- If you want to require authorization for a public/ file, then add the route of the file and the required authorization in the publicRouter.js file (See example: authProtectedExample.html).

# How to use git:
- This is assuming you are using git on the command line, but you can use the vscode sidebar if you would like instead of typing the commands. 
- You start with cloning a repository from an online source or creating a new one, which makes a local copy of the project on your computer.
- Before making changes, you should use ```git fetch``` to get any new changes that other people have committed.
- When you make changes on your computer, these changes are only for you, and you can continue to change things until you have something that is in a good state that doesn't break anything else.
- When you want to upload your changes, you can create a commit. Use the gui on vscode, or follow the command-line instructions below:
- First, you need to designate which files you want to include in the commit. Use ```git status``` to see what files you've changed, then use ```git add filepath``` to add one file or ```git add -A``` to add all. If you run git status again you will see that your files are now staged to be committed.
- Once you add the files to the staging area, then you can create a commit by running ```git commit -m "insert commit message here"```. Make sure to include an appropriate commit message.
- Now, the changes are committed on your local copy of the repository.
- Lastly, run ```git push``` to upload your changes to the remote repository.

## Branches
- When two people try to create a commit that edits the same lines of a file, this creates a "merge conflict". We will eventually need to resolve these, but it is much easier for each group to develop their features on their own branches, and then once they are ready then we can merge that branch with main.
- to view the branches, you can go to the github website, and select the dropdown at the top left. You can also view local branches by using ```git branch```.
- To create a branch, run ```git branch nameOfBranch```.
- Next, you need to switch to the branch by running ```git checkout nameOfBranch```. If you run ```git status```, you should see that you are on the branch that you switched to.
- Now when you create commits, they will be committed to the branch you are currently on.
- If you made changes on one branch and you realize that you wanted to put them on another branch, you can do ```git stash```, then checkout, then ```git stash pop``, and then commit as usual.

## Merging
- To merge your branch with main, start by being on your branch, and then run ```git fetch``` and then ```git merge main```. This will add the changes that were made to main into your branch.
- Next, go to the github website, branches, and then on your branch click "Create Pull Request".


# TODO
framework:
- database permissions for each table
- utilities to extract parameters from the path when matched with regex
- unit testability for loading routes (low prio)
- path redirects (low prio)

# Mr Pizza
- Example employee account login: employee1@mrpizza.com, pw: employee1
- Example admin account login: admin@mrpizza.com, pw: admin
