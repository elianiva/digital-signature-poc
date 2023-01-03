export function toArrayBuffer(str: string) {
    const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    const bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

export function dataURItoBlob(dataURI: string) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    const byteString = atob(dataURI.split(",")[1]);

    // separate out the mime component
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

    // write the bytes of the string to an ArrayBuffer
    const arrayBuffer = new ArrayBuffer(byteString.length);

    // create a view into the buffer
    const bufferView = new Uint8Array(arrayBuffer);

    // set the bytes of the buffer to the correct values
    for (let i = 0; i < byteString.length; i++) {
        bufferView[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    const blob = new Blob([arrayBuffer], { type: mimeString });
    return blob;
}
