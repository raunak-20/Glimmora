import os
import re

scale = 1.5
path = '/Users/raunak/Downloads/Glimmora_FS/frontend/src/index.css'
with open(path, 'r') as f:
    content = f.read()

def repl_css(m):
    val = float(m.group(1)) * scale
    unit = m.group(2)
    if val.is_integer() or unit == 'px':
        val = round(val, 1)
        if val == int(val): val = int(val)
    else:
        val = round(val, 2)
    return f"font-size: {val}{unit}"

new_content = re.sub(r'font-size:\s*(\d+(?:\.\d+)?)(px|rem|em)', repl_css, content)

if new_content != content:
    with open(path, 'w') as f:
        f.write(new_content)
    print(f"Updated {path}")
