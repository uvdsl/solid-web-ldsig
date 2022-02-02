# Solid - Web - Linked Data Signatures

Creating resources with Linkded Data Signatures on Solid. 

We have a live demo with an in-app tutorial available [here](https://km.aifb.kit.edu/services/solid-web-ldsig/)! 

## Requirement
The app needs to be served in an HTTPS context (or from localhost). Otherwise, `crypto.subtle` is not accessible (which is by design).

## Gotcha!
The current parser of [N3.js](https://github.com/rdfjs/N3.js) does not like RDF lists of RDF-star triples (see [here](https://github.com/rdfjs/N3.js/issues/256#issuecomment-1024447424)).

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

