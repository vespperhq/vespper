# API

This repo contains the code for the api that serves the Merlinn RCaaS product.

## Prerequisites

- [Docker](https://docs.docker.com/engine/install/)
- [nvm](https://github.com/nvm-sh/nvm)
- [yarn](https://yarnpkg.com/)
- [MongoDB Compass](https://www.mongodb.com/try/download/compass) (for viewing the DB)
- [ngrok](https://ngrok.com/) (for debugging 3rd party integrations)

After you download nvm, install Node.js and use that globally:

```bash
nvm install 18.18.2
nvm use 18.18.2
```

## Setup

1. Clone this repo.
2. Install dependencies using Yarn:

```bash
yarn install
```

## Run

You can run the API in various ways. All of them support automatic reloading using `nodemon`.

### Docker (recommended)

You can use `docker` and `docker-compose` to spin up the API with MongoDB:

```bash
docker-compose up
```

### NPM Script

You can run the API using the `dev` script. First, make sure the DB is up:

```bash
docker-compose up mongo redis
```

Then, run the API usign `yarn`:

```
yarn run dev
```

That's it. You should see the logs saying the server is listening on port 3000.

## Debugging

You can use our VS Code launch config to debug the API.
First, make sure the DB is up:

```bash
docker-compose up mongo
```

Then, go to "Run and Debug" in VS Code and run the "Debug Server" run. You should see the
logs saying the server is listening on port 3000.
