import { Parser, Quad, Store, Writer } from "n3";
import { isoCanonicalise } from "canonrdf";

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

export const hashRDF = async (rdf: string) => {
    let store = new Store();
    const parser = new Parser();
    store.addQuads(parser.parse(rdf));
    store = isoCanonicalise(store);
    const writer = new Writer({ format: "N-Triples" }); // N-Triple serialisation

    writer.addQuads(
        store.getQuads(null, null, null, null).sort(compareQuads)); // sort by ASCII
    let message = "";
    writer.end((err, res) => (message = res));
    const hashBuffer = await crypto.subtle.digest("SHA-256", Buffer.from(message));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
    return hashHex
}