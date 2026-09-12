import os, re, collections
t = open("js/levels.js", encoding="utf-8").read()
imgs = re.findall(r'img:\s*"([^"]+)"', t)
miss = [p for p in imgs if not os.path.exists(p)]
print("refs", len(imgs))
print("missing", miss)
files = set("assets/items/" + f for f in os.listdir("assets/items") if f.endswith(".png"))
print("disk", len(files))
print("extra", sorted(files - set(imgs)))
cats = re.findall(r'category:\s*"(\w+)"', t)
print(dict(collections.Counter(cats)))
cat_keys = set(re.findall(r'^\s{2}(\w+):\s*\{', t, re.M))
# crude; better: parse CATEGORIES block
m = re.search(r"const CATEGORIES = \{([\s\S]*?)\n\};", t)
cat_defs = re.findall(r"^\s{2}(\w+):", m.group(1), re.M)
print("cat_defs", cat_defs)
used = set(cats)
print("cats_used_not_defined", used - set(cat_defs))
print("cats_defined_unused", set(cat_defs) - used)
