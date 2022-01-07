import {  Quad, Store, Writer } from "n3";
import { isoCanonicalise } from "canonrdf";
import { sign, verify } from "./crypt";

const _strcmp = (a: string, b: string) => {
    return a < b ? -1 : a > b ? 1 : 0;
};

const compareQuads = (quad_a: Quad, quad_b: Quad) => {
    let cmp = _strcmp(quad_a.subject.id, quad_b.subject.id);
    if (cmp != 0) return cmp;
    cmp = _strcmp(quad_a.predicate.id, quad_b.predicate.id);
    if (cmp != 0) return cmp;
    cmp = _strcmp(quad_a.object.id, quad_b.object.id);
    return cmp;
};

export const canonRDF = (store: Store) => {
    store = isoCanonicalise(store);
    const writer = new Writer({ format: "N-Triples" }); // N-Triple serialisation

    writer.addQuads(
        store.getQuads(null, null, null, null).sort(compareQuads)); // sort by ASCII
    let message = "";
    writer.end((err, res) => (message = res));
    return message;
}


export const hashString = async (rdf: string) => {
    const hashBuffer = await crypto.subtle.digest("SHA-256", Buffer.from(rdf));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
    return hashHex;
}


export const signString = async (rdf: string, key: CryptoKey) => {
    const signHex = sign(rdf, key)
    return signHex;
}

export const verifyString = async (rdf: string, sig: string, key: CryptoKey) => {
    const signHex = verify(rdf, Buffer.from(sig, 'hex'), key)
    return signHex;
}
