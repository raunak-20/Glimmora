import os
import re

def scale_fonts(paths, scale=1/1.5):
    for path in paths:
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
        
        def repl_inline_num(m):
            val = float(m.group(1)) * scale
            val = round(val, 1)
            if val == int(val): val = int(val)
            return f"fontSize: {val}{m.group(2)}"
        new_content = re.sub(r'fontSize:\s*(\d+(?:\.\d+)?)(\s*[,}])', repl_inline_num, new_content)

        def repl_inline_str(m):
            val = float(m.group(1)) * scale
            unit = m.group(2)
            if val.is_integer() or unit == 'px':
                val = round(val, 1)
                if val == int(val): val = int(val)
            else:
                val = round(val, 2)
            return f'fontSize: "{val}{unit}"'
        new_content = re.sub(r'fontSize:\s*["\'](\d+(?:\.\d+)?)(px|rem|em)["\']', repl_inline_str, new_content)

        if new_content != content:
            with open(path, 'w') as f:
                f.write(new_content)
            print(f"Reverted {path}")

scale_fonts([
    '/Users/raunak/Downloads/Glimmora_FS/frontend/src/pages/Login.jsx',
    '/Users/raunak/Downloads/Glimmora_FS/frontend/src/pages/Register.jsx'
])
