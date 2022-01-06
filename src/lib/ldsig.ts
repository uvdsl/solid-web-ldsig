import { BlankNode, NamedNode, Quad, Store, Writer } from "n3";
import { canonRDF, hashRDF, signRDF } from "./canon";
import { importKey } from "./crypt";
import { RDF } from "./namespaces";
import { parseToN3 } from "./solidRequests";

export const createLDSignature = async (rdf: string, privateKey: { uri: string; label: string; pubKeyLoc: string, jwk: string }, creator: string, dateTime: Date) => {

  const key = await importKey(JSON.parse(privateKey.jwk));
  const pubKeyLoc = privateKey.pubKeyLoc;
  const canonicalRDF = canonRDF(rdf);
  const hash = await hashRDF(canonicalRDF)
  const signature = await signRDF(canonicalRDF, key);
  const rdf_sig = `
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix dc:  <http://purl.org/dc/terms/> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> . 
  @prefix sec: <https://w3id.org/security#> .

<#signature> a sec:Signature ; # does not exist but should
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
  const { store, prefixes } = await parseToN3(rdf_sig, "");
  const { ref_store, ref_prefixes } = await createReferenceToTriples(rdf);
  Object.assign(prefixes, ref_prefixes);
  
  const writer = new Writer({ format: "turtle*", prefixes })
  writer.addQuads(store.getQuads(null, null, null, null))
  // link RDF
  const new_blanknodes = ref_store.getSubjects(null, null, null) // there should only be blank nodes in this
  writer.addQuad(
    new NamedNode('#signature'),
    new NamedNode('https://w3id.org/security#proofOf'),
    writer.list(new_blanknodes)
  );
  writer.addQuads(ref_store.getQuads(null, null, null, null));

  // write it
  let message = "";
  writer.end((err, res) => (message = res));
  return { rdf_signature: message, hash, signature }
}
// https://raw.githubusercontent.com/w3c-ccg/security-vocab/main/contexts/security-v3-unstable.jsonld

const createReferenceToTriples = async (rdf: string) => {
  const { store, prefixes } = await parseToN3(rdf, "")
  const ref_store = new Store(store.getQuads(null, null, null, null).map(quad =>
  // either reification
  {
    const bn = store.createBlankNode();
    return [
      new Quad(bn, new NamedNode(RDF("type")), new NamedNode(RDF("Statement"))),
      new Quad(bn, new NamedNode(RDF("subject")), quad.subject),
      new Quad(bn, new NamedNode(RDF("predicate")), quad.predicate),
      new Quad(bn, new NamedNode(RDF("object")), quad.object),
    ]
  }
  ).flat());
  // or RDF-star
  // ... simply to text and enquote
  return { ref_store, ref_prefixes: prefixes }
}


export const verifyLDSignature = async (rdf: Store) => {
  return false;
}