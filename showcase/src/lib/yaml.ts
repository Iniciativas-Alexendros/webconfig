export interface CompositionComponent {
  id: string;
  type: string;
  parentId: string | null;
  props: Record<string, unknown>;
}

export interface BundlePage {
  slug: string;
  components: CompositionComponent[];
}

type YamlScalar = string | number | boolean | null;
type YamlNode = YamlScalar | YamlScalar[] | { [key: string]: YamlNode } | Array<{ [key: string]: YamlNode }>;

function parseScalar(raw: string): YamlScalar {
  const v = raw.trim();
  if (v === "" || v === "null" || v === "~") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

export function parseSimpleYaml(text: string): YamlNode {
  const lines = text.split("\n").map((l) => l.replace(/\r$/, ""));
  const root: Record<string, YamlNode> = {};
  const stack: Array<{ indent: number; node: unknown }> = [{ indent: -1, node: root }];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();
    while (stack.length > 1 && (stack[stack.length - 1] as { indent: number }).indent >= indent) stack.pop();
    const parent = (stack[stack.length - 1] as { node: unknown }).node;
    if (trimmed.startsWith("- ")) {
      const arr = parent as YamlNode[];
      const rest = trimmed.slice(2).trim();
      if (rest === "") {
        const obj: Record<string, YamlNode> = {};
        arr.push(obj as YamlNode);
        stack.push({ indent, node: obj });
      } else if (rest.includes(":")) {
        const obj: Record<string, YamlNode> = {};
        arr.push(obj as YamlNode);
        stack.push({ indent, node: obj });
        const ci = rest.indexOf(":");
        const k = rest.slice(0, ci).trim();
        const v = rest.slice(ci + 1).trim();
        if (v !== "") obj[k] = parseScalar(v);
        else {
          const child: Record<string, YamlNode> = {};
          obj[k] = child as YamlNode;
          stack.push({ indent: indent + 1, node: child });
        }
      } else {
        arr.push(parseScalar(rest) as YamlNode);
      }
      continue;
    }
    const ci = trimmed.indexOf(":");
    if (ci === -1) continue;
    const key = trimmed.slice(0, ci).trim();
    const rest = trimmed.slice(ci + 1).trim();
    const obj = parent as Record<string, YamlNode>;
    if (rest !== "") {
      obj[key] = parseScalar(rest) as YamlNode;
    } else {
      let j = i + 1;
      while (j < lines.length && (!(lines[j] as string).trim() || (lines[j] as string).trimStart().startsWith("#")))
        j++;
      if (j < lines.length && (lines[j] as string).trimStart().startsWith("- ")) {
        const arr: YamlNode[] = [];
        obj[key] = arr as YamlNode;
        stack.push({ indent, node: arr });
      } else {
        const child: Record<string, YamlNode> = {};
        obj[key] = child as YamlNode;
        stack.push({ indent, node: child });
      }
    }
  }
  return root as YamlNode;
}

export function parseCompositionYaml(text: string): { components: CompositionComponent[]; page: string } {
  const doc = parseSimpleYaml(text) as Record<string, YamlNode>;
  const raw = (doc["components"] as Array<Record<string, YamlNode>>) ?? [];
  const components: CompositionComponent[] = raw.map((c) => ({
    id: String(c["id"] ?? ""),
    type: String(c["type"] ?? ""),
    parentId: c["parentId"] === null || c["parentId"] === undefined ? null : String(c["parentId"]),
    props: (c["props"] as Record<string, unknown>) ?? {},
  }));
  return { components, page: String(doc["page"] ?? "") };
}
