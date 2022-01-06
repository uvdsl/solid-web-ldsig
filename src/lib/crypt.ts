export const createECDSAKeyPair = async () => {
    return window.crypto.subtle.generateKey(
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        true,
        ["sign", "verify"]
      );
}

export const importKey = async (jwk: any) => {
    // I know, I know, but typescript is confused here.
    return crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "ECDSA",
            namedCurve: jwk.crv as string,
        },
        jwk.ext as boolean,
        jwk.key_ops as any // I know, I know, but typescript is confused here.
    );
};

// signature creation
export const sign = async (message: string, privateKey: CryptoKey) => {
    const encMsg = new TextEncoder().encode(message);
    return window.crypto.subtle
        .sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" },
            },
            privateKey,
            encMsg
        )
        .then((arrBuf) =>
            Array.from(new Uint8Array(arrBuf))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("")
        );
};

// on GET of message
export const verify = async (
    message: string,
    signature: Buffer,
    publicKey: CryptoKey
) => {
    const encMsg = new TextEncoder().encode(message);
    // retrieve pubKey from LDProof

    return window.crypto.subtle.verify(
        {
            name: "ECDSA",
            hash: { name: "SHA-256" },
        },
        publicKey,
        signature,
        encMsg
    );
};