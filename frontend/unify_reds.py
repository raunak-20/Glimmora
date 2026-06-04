import os
import re

def unify_reds(dir_path):
    for root, _, files in os.walk(dir_path):
        for file in files:
            if file.endswith(('.css', '.jsx', '.js')):
                path = os.path.join(root, file)
                with open(path, 'r') as f:
                    content = f.read()

                # Change 220,130,100 to 220,120,90
                new_content = re.sub(r'220,\s*130,\s*100', '220,120,90', content)
                # Change 230,150,130 to 230,140,110
                new_content = re.sub(r'230,\s*150,\s*130', '230,140,110', new_content)

                if new_content != content:
                    with open(path, 'w') as f:
                        f.write(new_content)
                    print(f"Updated {path}")

unify_reds('/Users/raunak/Downloads/Glimmora_FS/frontend/src')
