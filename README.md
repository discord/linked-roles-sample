
# Discord Verified Role Bot Example
This repository contains the documentation and example for a verified role bot.

## Preparing the code
```
$ git clone https://github.com/JustinBeckwith/verified-role-bot
$ cd verified-role-bot
$ npm install
```

## Configuration
This sample uses [nconf](https://www.npmjs.com/package/nconf) to manage configuration.  This allows you to read configuration from a file, environment variables, or the command line.  When developing locally, create a `config.json` and make sure it's added to your `.gitignore`.  

```
{
  "DISCORD_CLIENT_ID": "...",
  "DISCORD_CLIENT_SECRET": "...",
  "DISCORD_TOKEN": "...",
  "DISCORD_REDIRECT_URI": "http://localhost:3000/discord-oauth-callback",
  "COOKIE_SECRET": "..."
}
```

To generate a unique cookie secret, make sure you're running at least Node.js 18, and run the following from the command line:

```
$ node
crypto.randomUUID()
'5ced6897-0286-4bfd-844d-649c339582a7'
```

Copy the randomly generated UUID, and use it for your cookie secret.  

## Create the app in the developer portal


## Token Storage
This bot largely relies on Discord's [OAuth2](https://discord.com/developers/docs/topics/oauth2) implementation to obtain access tokens. This model of user based authentication relies on storing refresh tokens, and using them to acquire access tokens.  The example code in [src/storage.js](src/storage.js) uses in-memory storage to manage these tokens, but for any production deployment a database with persistent storage should be used. 


