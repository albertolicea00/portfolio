#!/usr/bin/env python3
import os
import json
import sys

# Get the root directory of the repository
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I18N_DIR = os.path.join(ROOT_DIR, "assets", "i18n")

sys.path.insert(0, os.path.join(ROOT_DIR, "scripts"))
from html_i18n_baseline import build_baseline_from_html

def print_success(message):
    print(f"\033[92m✔ {message}\033[0m")

def print_failure(message):
    print(f"\033[91m✘ {message}\033[0m")

def load_json(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print_failure(f"Failed to read file {os.path.basename(filepath)}: {e}")
        sys.exit(1)

def verify_assets_exist(data):
    """Checks that all local assets (images, logos) specified in the JSON exist on disk."""
    errors = []
    
    # Check projects images
    if "projects" in data:
        for idx, project in enumerate(data["projects"]):
            img_path = project.get("image")
            if img_path:
                full_path = os.path.join(ROOT_DIR, img_path)
                if not os.path.exists(full_path):
                    errors.append(f"Project '{project.get('title', idx)}' image path not found on disk: {img_path}")
                    
    # Check experience logos
    if "experience" in data:
        for idx, exp in enumerate(data["experience"]):
            logo_path = exp.get("logo")
            if logo_path:
                full_path = os.path.join(ROOT_DIR, logo_path)
                if not os.path.exists(full_path):
                    errors.append(f"Experience '{exp.get('title', idx)}' logo path not found on disk: {logo_path}")
                    
    return errors

def main():
    print("==================================================")
    print("   Test Suite: Local Asset Integrity Checks       ")
    print("==================================================\n")
    
    json_files = [f for f in os.listdir(I18N_DIR) if f.endswith(".json")]
    json_files.sort()

    overall_success = True

    # English isn't a JSON file to check anymore — it's read straight from
    # index.html/projects.html, which is also where its image/logo paths
    # live, so check those the same way as any other locale.
    print("Checking assets referenced in: 'index.html / projects.html (English)'")
    errors = verify_assets_exist(build_baseline_from_html(ROOT_DIR))
    if errors:
        print_failure("Local assets missing in the static English HTML:")
        for err in errors:
            print(f"  - {err}")
        overall_success = False
    else:
        print_success("All local assets exist on disk")
    print()

    for f_name in json_files:
        f_path = os.path.join(I18N_DIR, f_name)
        data = load_json(f_path)

        print(f"Checking assets referenced in: '{f_name}'")
        errors = verify_assets_exist(data)

        if errors:
            print_failure(f"Local assets missing in '{f_name}':")
            for err in errors:
                print(f"  - {err}")
            overall_success = False
        else:
            print_success("All local assets exist on disk")
        print()

    if overall_success:
        print_success("Asset integrity test completed successfully!")
        sys.exit(0)
    else:
        print_failure("Asset integrity test failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
