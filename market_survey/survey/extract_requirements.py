# extract_requirements.py
# Usage: python extract_requirements.py "C:\chemin\vers\env"
import sys
import os
import re

def parse_dist_info(dist_info_path):
    name = None
    version = None
    metadata = os.path.join(dist_info_path, 'METADATA')
    if not os.path.exists(metadata):
        metadata = os.path.join(dist_info_path, 'PKG-INFO')
    try:
        with open(metadata, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                if line.lower().startswith('name:'):
                    name = line.split(':',1)[1].strip()
                elif line.lower().startswith('version:'):
                    version = line.split(':',1)[1].strip()
                if name and version:
                    break
    except Exception:
        pass
    return name, version

def main(env_path):
    site_packages = os.path.join(env_path, 'Lib', 'site-packages')
    if not os.path.isdir(site_packages):
        print("Impossible de trouver site-packages ici :", site_packages)
        return
    reqs = {}
    for entry in os.listdir(site_packages):
        if entry.endswith('.dist-info') or entry.endswith('.egg-info'):
            full = os.path.join(site_packages, entry)
            name, version = parse_dist_info(full)
            if name:
                if version:
                    reqs[name] = version
                else:
                    reqs[name] = None
    # Sort and write
    lines = []
    for name in sorted(reqs.keys(), key=lambda s: s.lower()):
        v = reqs[name]
        if v:
            lines.append(f"{name}=={v}")
        else:
            lines.append(name)
    out = os.path.join(os.getcwd(), 'requirements_from_old_env.txt')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"Fichier généré : {out}  ({len(lines)} paquets listés)")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        env = sys.argv[1]
    else:
        # try default
        env = os.path.join(os.getcwd(), 'env')
    main(env)
