export interface ClientData {
  // This interface is incomplete. 
  // add more members as needed by our application
  origin: string
}

function parseClientDataBase64(clientDataBase64: string): ClientData {
  const clientDataJSONString = Buffer.from(clientDataBase64, 'base64').toString()
  const clientDataObj = JSON.parse(clientDataJSONString) as unknown as ClientData

  // feel free to add more strict parsing as required
  if (!clientDataObj.origin) {
    throw new Error('ClientData is missing .origin field')
  }

  return clientDataObj;
}

function stringToArrayBuffer(input: string): ArrayBuffer {
  // base64url to base64
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  // base64 to Buffer
  const buf = Buffer.from(input, "base64");
  const bufUint8Array = new Uint8Array(buf);
  const ab = bufUint8Array.buffer;

  return ab;
}


export default {
  parseClientDataBase64,
  stringToArrayBuffer
}