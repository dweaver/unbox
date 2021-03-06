# Unbox

Unbox is an example of a customer registration site for [Exosite](https://exosite.com)-connected products. It's a seed project intended to be a starting point for a product website.

This is in development and an experiment rather than an official/supported Exosite product. That said, please do let me know if you use it and have suggestions.

## Setup

Here's how to clone the project and run locally.

```
$ git clone git@github.com:dweaver/unbox.git
$ cd unbox
$ npm install
$ # create .env file with keys specified in app.json
$ heroku addons:add auth0 --type=nodejs
$ heroku addons:add heroku-postgresql
$ foreman start
```

Or, press this button to do all this automatically:

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Authorization

Unbox requires an admin username and password in order to get the client models for a domain with the Portals API. You may use any Portals domain admin account, but we recommend creating a separate user account for Unbox so that you can track what actions Unbox took. Here's how to make an admin account that may be used with Unbox.

First, log in as an admin and create a new user for Unbox here: https://YOUR_DOMAIN.exosite.com/admin/userlist

Next, activate that user by pressing "Activate" button next to that user's address.

Finally, make that user a domain admin by going selecting the user and pressing "Grant Access" here: https://YOUR_DOMAIN.exosite.com/admin/admincontrols
