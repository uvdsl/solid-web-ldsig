import { RDF, SEC } from "./namespaces";
import { BlankNode, NamedNode, OTerm, Quad, Quad_Object, Store, Term, Writer } from "n3";

import { getResource, parseToN3 } from "./solidRequests";
import { canonRDF, hashString, signString, verifyString } from "./canon";
import { canonicaliseTerm, getListItems } from "./n3Extensions";
import { importKey } from "./crypt";

export const createLDSignature = async (uri: string, rdf: string, privateKey: { uri: string; label: string; pubKeyLoc: string, jwk: string }, creator: string, dateTime: Date) => {

  const key = await importKey(JSON.parse(privateKey.jwk));
  const pubKeyLoc = privateKey.pubKeyLoc;
  const { store: base_store, prefixes: base_prefixes } = await parseToN3(rdf, uri)
  const canonicalRDF = canonRDF(base_store);
  const hash = await hashString(canonicalRDF)
  const signature = await signString(canonicalRDF, key);
  const rdf_sig = `
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
  @prefix dc:  <http://purl.org/dc/terms/> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> . 
  @prefix sec: <https://w3id.org/security#> .

_:signature a sec:Signature ; # does not exist but should
    dc:created "${dateTime.toISOString()}"^^xsd:dateTime ;
    dc:creator <${creator}> ;
    sec:publicKey <${pubKeyLoc}> ;
    sec:canonicalizationAlgorithm "Hogan2017"; # Object should be URI
    sec:digestAlgorithm "SHA-256" ; # Object should be URI
    sec:digestValue "${hash}"^^xsd:hexBinary ;
    sec:signatureAlgorithm "ECDSA" ; # Object should be URI
    sec:signatureValue "${signature}"^^xsd:hexBinary .
`


  // consolidate RDF
  const { store: sig_store, prefixes: sig_prefixes } = await parseToN3(rdf_sig, "");
  // const ref_store = await reifyTriples(base_store); // reification
  const quotedTriples = await quoteTriples(base_store) // rdf-star
  Object.assign(base_prefixes, sig_prefixes);

  const writer = new Writer({ format: "turtle*", prefixes: base_prefixes })
  writer.addQuads(base_store.getQuads(null, null, null, null))
  writer.addQuads(sig_store.getQuads(null, null, null, null))
  // link RDF
  // const new_blanknodes = ref_store.getSubjects(null, null, null) // reification
  // writer.addQuad(// reification
  // new BlankNode('signature'),// reification
  // new NamedNode(SEC('proofOf')), // reification
  // writer.list(new_blanknodes) // reification
  // ); // reification
  writer.addQuads(quotedTriples.map(quoted => new Quad(new BlankNode('signature'), new NamedNode(SEC('proofOf')), quoted))); // rdf-star
  // writer.addQuads(ref_store.getQuads(null, null, null, null)); // refication

  // write it
  let message = "";
  writer.end((err, res) => (message = res));
  return { rdf_string: message, hash, signature }
}
// https://raw.githubusercontent.com/w3c-ccg/security-vocab/main/contexts/security-v3-unstable.jsonld

const quoteTriples = async (store: Store) => {
  const quotedTriples = store.getQuads(null, null, null, null).map(quad =>
  (
    {
      id: `<< ${canonicaliseTerm(quad.subject)} ${canonicaliseTerm(quad.predicate)} ${canonicaliseTerm(quad.object)} >>`,
      value: `<< ${canonicaliseTerm(quad.subject)} ${canonicaliseTerm(quad.predicate)} ${canonicaliseTerm(quad.object)} >>`
    } as Quad_Object
  )
  );
  return quotedTriples;
}

const reifyTriples = async (store: Store) => {
  const ref_store = new Store(store.getQuads(null, null, null, null).map(quad => {
    const bn = store.createBlankNode();
    return [
      new Quad(bn, new NamedNode(RDF("type")), new NamedNode(RDF("Statement"))),
      new Quad(bn, new NamedNode(RDF("subject")), quad.subject),
      new Quad(bn, new NamedNode(RDF("predicate")), quad.predicate),
      new Quad(bn, new NamedNode(RDF("object")), quad.object),
    ]
  }
  ).flat());
  return ref_store;
}




export const verifyLDSignature = async (store: Store, fetch?: (url: RequestInfo, init?: RequestInit) => Promise<Response>) => {
  const sig = store.getSubjects(RDF('type'), SEC('Signature'), null)[0];
  if (!sig) return false;
  const pubKeyURI = store.getObjects(sig, SEC('publicKey'), null)[0].id;
  const pubKey = getResource(pubKeyURI, fetch)
    .then(resp => resp.text())
    .then(txt => parseToN3(txt, pubKeyURI))
    .then(parsedN3 => parsedN3.store.getObjects(pubKeyURI, SEC('publicKeyJwk'), null)[0].value)
    .then(jwk => importKey(JSON.parse(jwk)));

  // check if reified statements are asserted  
  // const ref = getListItems(store, store.getObjects(sig, SEC('proofOf'), null)[0]).map(stmt => {
  //   const s = store.getObjects(stmt, RDF('subject'), null)[0];
  //   const p = store.getObjects(stmt, RDF('predicate'), null)[0];
  //   const o = store.getObjects(stmt, RDF('object'), null)[0];
  //   return new Quad(s, p, o)
  // });
 
    // check if quoted statements are asserted  
  const ref = store.getObjects(sig, SEC('proofOf'), null).map(star => star.toJSON() as Quad)

  const areAsserted = ref.map(quad => store.has(quad));
  const assertedOK = !areAsserted.includes(false) && areAsserted.length != 0;

  // check if signature checks out
  const sigVal = store.getObjects(sig, SEC('signatureValue'), null)[0].value;
  const refStore = new Store(ref);
  const canon = canonRDF(refStore);
  const signatureOK = await verifyString(canon, sigVal, await pubKey);

  return assertedOK && signatureOK;
}
