// Test-only ZIP writer. Lives outside test/*.test.js so the runner does not treat it as a test.
import zlib from "node:zlib";

const le16 = (n) => {
	const b = Buffer.alloc(2);
	b.writeUInt16LE(n);
	return b;
};
const le32 = (n) => {
	const b = Buffer.alloc(4);
	b.writeUInt32LE(n >>> 0);
	return b;
};

// files: [{ name, data, method = 8, flags = 0x0800, declaredSize }]. declaredSize lets a test lie about the size.
export function makeZip(files, comment = "") {
	const body = [];
	const central = [];
	let offset = 0;
	for (const f of files) {
		const name = Buffer.from(f.name, "utf8");
		const raw = Buffer.from(f.data ?? "");
		const method = f.method ?? 8;
		const flags = f.flags ?? 0x0800;
		const comp = method === 8 ? zlib.deflateRawSync(raw) : raw;
		const size = f.declaredSize ?? raw.length;
		const local = Buffer.concat([le32(0x04034b50), le16(20), le16(flags), le16(method), le16(0), le16(0), le32(0), le32(comp.length), le32(size), le16(name.length), le16(0), name, comp]);
		central.push(Buffer.concat([le32(0x02014b50), le16(20), le16(20), le16(flags), le16(method), le16(0), le16(0), le32(0), le32(comp.length), le32(size), le16(name.length), le16(0), le16(0), le16(0), le16(0), le32(0), le32(offset), name]));
		body.push(local);
		offset += local.length;
	}
	const cd = Buffer.concat(central);
	const note = Buffer.from(comment);
	const eocd = Buffer.concat([le32(0x06054b50), le16(0), le16(0), le16(files.length), le16(files.length), le32(cd.length), le32(offset), le16(note.length), note]);
	return new Uint8Array(Buffer.concat([...body, cd, eocd]));
}
