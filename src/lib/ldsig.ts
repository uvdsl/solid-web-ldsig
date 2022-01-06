import { canonRDF, hashRDF, signRDF } from "./canon";
import { importKey } from "./crypt";

export const createLDSignature = async (rdf: string, privateKey: { uri: string; label: string; pubKeyLoc: string, jwk: string }, creator: string, dateTime: Date) => {
  const coverage = "";
  const key = await importKey(JSON.parse(privateKey.jwk));
  const pubKeyLoc = privateKey.pubKeyLoc;
  const canonicalRDF = canonRDF(rdf);
  const hash = await hashRDF(canonicalRDF)
  const signature = await signRDF(canonicalRDF, key);
  return {
    rdf: `
<#signature> a <https://w3id.org/security#Signature> ; # does not exist but should
    <http://purl.org/dc/terms/created> "${dateTime.toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
    <http://purl.org/dc/terms/creator> <${creator}> ;
    <https://w3id.org/security#publicKey> <${pubKeyLoc}> ;
    <https://w3id.org/security#canonicalizationAlgorithm> "Hogan2017"; # Object should be URI
    <https://w3id.org/security#digestAlgorithm> "SHA-256" ; # Object should be URI
    <https://w3id.org/security#digestValue> "${hash}"^^<http://www.w3.org/2001/XMLSchema#hexBinary> ;
    <https://w3id.org/security#signatureAlgorithm> "ECDSA" ; # Object should be URI
    <https://w3id.org/security#signatureValue> "${signature}"^^<http://www.w3.org/2001/XMLSchema#hexBinary> .
`, hash, signature
  };
}
// https://raw.githubusercontent.com/w3c-ccg/security-vocab/main/contexts/security-v3-unstable.jsonld