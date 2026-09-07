import os
import shutil
import zipfile

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dist = os.path.join(root, 'dist')
deploy = os.path.join(root, 'hostinger-deploy-agriheal')
pub_html = os.path.join(deploy, 'public_html')
zip_path = os.path.join(deploy, 'nearbin-agriheal.zip')

# Copy all dist files into pub_html
for item in os.listdir(dist):
    s = os.path.join(dist, item)
    d = os.path.join(pub_html, item)
    if os.path.isdir(s):
        if os.path.exists(d):
            shutil.rmtree(d)
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)

print('[Package] Updated public_html with fresh dist files.')

# Remove old zip if exists
if os.path.exists(zip_path):
    os.remove(zip_path)

# Create zip with POSIX forward slash paths
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root_dir, dirs, files in os.walk(pub_html):
        for f in files:
            full_path = os.path.join(root_dir, f)
            rel_path = os.path.relpath(full_path, pub_html).replace('\\', '/')
            zipf.write(full_path, rel_path)

print(f'[Package] Created {zip_path} successfully. ({os.path.getsize(zip_path)} bytes)')
