import { DC, JWK, RDF, RDFS, SEC, XSD } from "./namespaces";
import { BlankNode, Literal, NamedNode, Quad, Quad_Object, Store, Term, Writer } from "n3";

import { getResource, parseToN3 } from "./solidRequests";
import { canonRDF, hashString, signString, verifyString } from "./canon";
import { canonicaliseTerm } from "./n3Extensions";
import { importKey } from "./crypt";


// embed keys in RDF
export const createRDFofKey = (
  label: string,
  webId: string,
  jwk: JsonWebKey,
  pubKeyLoc?: string
) => {

  const rdf_key = `
@prefix rdfs: <${RDFS("")}>.
@prefix xsd: <${XSD("")}> . 
@prefix sec: <${SEC("")}>.
@prefix jwk: <${JWK("")}>.

<#key> rdfs:label "${label}" ;
  sec:controller <${webId}> ;
  sec:${pubKeyLoc ? "private" : "public"}KeyJwk <#jwk> ${pubKeyLoc ? ";\n  sec:publicKey <" + pubKeyLoc + "> " : ""}.

<#jwk> jwk:alg "${jwk.alg}" ;
  jwk:crv "${jwk.crv}"  ${pubKeyLoc ? ";\n  jwk:d  \"" + jwk.d + "\"" : ""};
  jwk:ext ${jwk.ext} ;
  jwk:kty "${jwk.kty}" ;
  jwk:x "${jwk.x}" ;
  jwk:y "${jwk.y}" ${(jwk.key_ops as string[]).length == 0 ? '.' : ';\n  jwk:key_ops ' + (jwk.key_ops as string[]).map(e => `"${e}"`).join(", ") + ' '}.
  `;
  return rdf_key;
};

export const signLD = async (base_uri: string, content_rdf: string, privateKeyJwk: JsonWebKey, pubKeyLoc: string, creator: string, dateTime: Date) => {
  // create SignatureValue of base LD
  const privkey = await importKey(privateKeyJwk);
  const { store: base_store, prefixes: base_prefixes } = await parseToN3(content_rdf, base_uri); // use this one for canon hashing
  const canonicalRDF = canonRDF(base_store);
  const hash = await hashString(canonicalRDF);
  const signature = await signString(canonicalRDF, privkey);
  // create LDSignature
  const { store: asIs_store } = await parseToN3(content_rdf, "");
  const rdf_sig = `
  @prefix rdf: <${RDF("")}> .
  @prefix rdfs: <${RDFS("")}>.
  @prefix dc:  <${DC("")}> .
  @prefix xsd: <${XSD("")}> . 
  @prefix sec: <${SEC("")}>.

_:signature a sec:Signature ; # does not exist but should
    dc:created "${dateTime.toISOString()}"^^xsd:dateTime ;
    dc:creator <${creator}> ;
    sec:publicKey <${pubKeyLoc}> ;
    sec:canonicalizationAlgorithm "Hogan2017"; # Object should be URI
    sec:digestAlgorithm "SHA-256" ; # Object should be URI
    sec:digestValue "${hash}"^^xsd:hexBinary ;
    sec:signatureAlgorithm "ECDSA" ; # Object should be URI
    sec:signatureValue "${signature}"^^xsd:hexBinary .
`;
  // consolidate RDF
  const { store: sig_store, prefixes: sig_prefixes } = await parseToN3(rdf_sig, "");
  // const ref_store = await reifyTriples(base_store); // reification
  const quotedTriples = await quoteTriples(asIs_store); // rdf-star // was (base_store) not (asIs_store)
  Object.assign(base_prefixes, sig_prefixes);

  const writer = new Writer({ format: "turtle*", prefixes: base_prefixes })
  writer.addQuads(asIs_store.getQuads(null, null, null, null));// was (base_store) not (asIs_store)
  writer.addQuads(sig_store.getQuads(null, null, null, null));
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




export const verifyLDSignature = async (store: Store, sigValUri: string, fetch?: (url: RequestInfo, init?: RequestInit) => Promise<Response>) => {
  const sig = store.getSubjects(RDF('type'), SEC('Signature'), null)[0];
  if (!sig) return {isVerified:false};
  const pubKeyURI = store.getObjects(sig, SEC('publicKey'), null)[0].id;
  const pubKey = getResource(pubKeyURI, fetch)
    .then(resp => resp.text())
    .then(txt => parseToN3(txt, pubKeyURI))
    .then(parsedN3 => {
      const jwkTerm = parsedN3.store.getObjects(pubKeyURI, SEC('publicKeyJwk'), null)[0] as Term;
      const jwk = {
        alg: parsedN3.store.getObjects(jwkTerm, JWK('alg'), null)[0].value,
        crv: parsedN3.store.getObjects(jwkTerm, JWK('crv'), null)[0].value,
        ext: parsedN3.store.getObjects(jwkTerm, JWK('ext'), null)[0].value === "true",
        kty: parsedN3.store.getObjects(jwkTerm, JWK('kty'), null)[0].value,
        x: parsedN3.store.getObjects(jwkTerm, JWK('x'), null)[0].value,
        y: parsedN3.store.getObjects(jwkTerm, JWK('y'), null)[0].value,
        key_ops: parsedN3.store.getObjects(jwkTerm, JWK('key_ops'), null).map(e => e.value)
      }
      return jwk
    })
    .then(jwk => importKey(jwk));

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

  // check if signature matches signedURI
  const uriOK = (sigValUri == sigVal);

  return {
    isVerified: assertedOK && signatureOK && uriOK,
    details: { assertedOK,
    signatureOK,
    uriOK
    }
  };
}


export const addSuffix = (uri: string, suffix: string) => {
  if (uri.includes("__0x")) {
    const end_index = uri.lastIndexOf("__0x");
    uri = uri.substring(0, end_index);
    console.log(uri);
  }
  uri += "__0x" + suffix;
  return uri;
};