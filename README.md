# Solid - Web - Linked Data Signatures

Creating resources with Linkded Data Signatures on Solid. 

![screenshot](https://github.com/uvdsl/solid-web-ldsig/blob/main/img/preview.png?raw=true)

## Requirement
The app needs to be served in an HTTPS context (or from localhost). Otherwise, `crypto.subtle` is not accessible (which is by design).

## Build and run using Docker
```
docker build -t solid-web-ldsig:latest .
docker run -d -p 8080:80 --name SOLID-WEB-LDSIG solid-web-ldsig:latest
```

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

