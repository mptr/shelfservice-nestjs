# ShelfService Backend

## Setup

1. install pnpm package manager
   ```
   $ sudo npm i -g pnpm
   ```
2. install the dependencies
   ```
   $ pnpm install
   ```
3. setup the dev-environment
   ```
   $ pnpm devenv:setup
   ```
   (you may need docker as well as docker-compose)  
   This will launch all required containers containing external services like the database and keycloak.
4. setup a kubernetes cluster of choiche ([docker-desktop](https://www.docker.com/products/docker-desktop/) recommended) and place the kubeconfig containing the credentials in your home directory: `~/.kube/config`

## Run

The application consists of two pieces:

**Backend**: can be started using this repo and following the setup inscructions above. Then run:

```
$ pnpm start
--- # separate terminal # ---
$ pnpm start:schedule
```

**Frontend**: can be launched using the setup instructions in the shelfservice-angular repo.

To use the Backend soleley, it exposes a Swagger-UI endpoint [on localhost:3000](http://localhost:3000/api).

## Test

The app has unit and end-to-end tests which can be executed seperateley (`pnpm test:unit` / `pnpm test:e2e`).  
Alternativeley the combining script can be used (`pnpm test:all-ci`), which will run both test suites and merge their coverage reports into a single one, which will be available [as html here](./coverage-all/html/index.html).
