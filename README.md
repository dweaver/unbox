# Unbox

Unbox is an example of a customer registration site for [Exosite](https://exosite.com)-connected products.

This is an in progress project, and not ready for use yet.

## Setup

```
$ git clone git@github.com:dweaver/unbox.git
$ cd unbox
$ npm install
$ # create .env file with VENDOR_TOKEN=<your vendor token>
$ foreman start
```

## Authorization

Unbox requires an admin username and password in order to get the client models for a domain with the Portals API. Here's how to make an admin account that may be used with Unbox. You may use any Portals domain admin account, but we recommend creating a separate user account for Unbox so that you can track what actions Unbox took. Here's how to do that.

First, log in as an admin and create a new user for Unbox here: https://YOUR_DOMAIN.exosite.com/admin/userlist

Next, activate that user by pressing "Activate" button next to that user's address.

Finally, make that user a domain admin by going selecting the user and pressing "Grant Access" here: https://YOUR_DOMAIN.exosite.com/admin/admincontrols
