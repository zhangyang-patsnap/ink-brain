import { crc32 } from "node:zlib";
import { deflateRawSync } from "node:zlib";

// 测试用最小 ZIP 构造器。entry: {name, data, store?, mode?, declaredSize?, declaredCompressed?}
export function buildZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const raw = Buffer.isBuffer(entry.data)
      ? entry.data
      : Buffer.from(entry.data ?? "", "utf8");
    const store = entry.store ?? false;
    const body = store ? raw : deflateRawSync(raw);
    const crc = crc32(raw);
    const uncompressed = entry.declaredSize ?? raw.length;
    const compressed = entry.declaredCompressed ?? body.length;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(entry.flags ?? 0, 6);
    local.writeUInt16LE(store ? 0 : 8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed, 18);
    local.writeUInt32LE(uncompressed, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, body);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(entry.flags ?? 0, 8);
    central.writeUInt16LE(store ? 0 : 8, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed, 20);
    central.writeUInt32LE(uncompressed, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(((entry.mode ?? 0o100644) << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += local.length + name.length + body.length;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

export const skillZip = (root = "demo-skill", body = "# 示例\n\n正文。") =>
  buildZip([
    {
      name: `${root}/SKILL.md`,
      data: `---\nname: demo-skill\ndescription: 示例说明\nversion: 2.1.0\n---\n\n${body}\n`,
    },
    {
      name: `${root}/skill.manifest.json`,
      data: JSON.stringify({ name: "demo-skill", version: "2.1.0" }),
    },
  ]);
