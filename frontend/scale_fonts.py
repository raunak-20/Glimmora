import os
import re

def scale_fonts(dir_path, scale=1.5):
    for root, _, files in os.walk(dir_path):
        for file in files:
            if file.endswith(('.css', '.jsx', '.js')):
                path = os.path.join(root, file)
                with open(path, 'r') as f:
                    content = f.read()

                # Replace CSS font-size: 14px;
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
                
                # Replace inline fontSize: 14 or fontSize: "14px" or fontSize: "1.2rem"
                def repl_inline_num(m):
                    val = float(m.group(1)) * scale
                    val = round(val, 1)
                    if val == int(val): val = int(val)
                    return f"fontSize: {val}"
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
                    print(f"Updated {path}")

scale_fonts('/Users/raunak/Downloads/Glimmora_FS/frontend/src')
