#!/usr/bin/env python3
import os
import json
import sys

# Get the root directory of the repository
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I18N_DIR = os.path.join(ROOT_DIR, "assets", "i18n")

def print_success(message):
    print(f"\033[92m✔ {message}\033[0m")

def print_failure(message):
    print(f"\033[91m✘ {message}\033[0m")

def load_json(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print_failure(f"Failed to parse JSON file {os.path.basename(filepath)}: {e}")
        sys.exit(1)
    except Exception as e:
        print_failure(f"Failed to read file {os.path.basename(filepath)}: {e}")
        sys.exit(1)

def compare_keys(base_dict, target_dict, path=""):
    """Recursively checks if target_dict has the exact same keys as base_dict."""
    errors = []
    
    # Check for missing keys in target_dict
    for k in base_dict:
        current_path = f"{path}.{k}" if path else k
        if k not in target_dict:
            errors.append(f"Missing key in target: '{current_path}'")
        elif isinstance(base_dict[k], dict):
            if not isinstance(target_dict[k], dict):
                errors.append(f"Type mismatch at '{current_path}': expected dict, got {type(target_dict[k]).__name__}")
            else:
                errors.extend(compare_keys(base_dict[k], target_dict[k], current_path))
        elif isinstance(base_dict[k], list):
            if not isinstance(target_dict[k], list):
                errors.append(f"Type mismatch at '{current_path}': expected list, got {type(target_dict[k]).__name__}")
    
    # Check for extra keys in target_dict
    for k in target_dict:
        current_path = f"{path}.{k}" if path else k
        if k not in base_dict:
            errors.append(f"Extra key in target: '{current_path}'")
            
    return errors

def main():
    print("==================================================")
    print("   Test Suite: Localization Structure Checks      ")
    print("==================================================\n")
    
    en_path = os.path.join(I18N_DIR, "en.json")
    if not os.path.exists(en_path):
        print_failure("Baseline file 'en.json' not found!")
        sys.exit(1)
        
    en_data = load_json(en_path)
    json_files = [f for f in os.listdir(I18N_DIR) if f.endswith(".json")]
    json_files.sort()
    
    overall_success = True
    
    for f_name in json_files:
        f_path = os.path.join(I18N_DIR, f_name)
        data = load_json(f_path)
        
        print(f"Checking structure for: '{f_name}'")
        
        # 1. Compare recursive dictionary keys
        errors = compare_keys(en_data, data)
        if errors:
            print_failure(f"Structural mismatches in '{f_name}':")
            for err in errors:
                print(f"  - {err}")
            overall_success = False
            continue
            
        # 2. Detailed projects metadata alignment checking
        array_errors = []
        if "projects" in data and "projects" in en_data:
            if len(data["projects"]) != len(en_data["projects"]):
                array_errors.append(f"Projects length mismatch: {len(data['projects'])} vs {len(en_data['projects'])}")
            else:
                for idx, (proj_target, proj_base) in enumerate(zip(data["projects"], en_data["projects"])):
                    for field in ["id", "featured", "image", "githubUrl", "liveUrl"]:
                        if proj_target.get(field) != proj_base.get(field):
                            array_errors.append(f"Project index {idx} field '{field}' mismatch: '{proj_target.get(field)}' vs '{proj_base.get(field)}'")
                    if len(proj_target.get("tags", [])) != len(proj_base.get("tags", [])):
                        array_errors.append(f"Project index {idx} 'tags' length mismatch: {len(proj_target.get('tags'))} vs {len(proj_base.get('tags'))}")
                        
        # 3. Detailed experience metadata alignment checking
        if "experience" in data and "experience" in en_data:
            if len(data["experience"]) != len(en_data["experience"]):
                array_errors.append(f"Experience length mismatch: {len(data['experience'])} vs {len(en_data['experience'])}")
            else:
                for idx, (exp_target, exp_base) in enumerate(zip(data["experience"], en_data["experience"])):
                    for field in ["logo", "logoWide", "logoDark", "logoLight"]:
                        if exp_target.get(field) != exp_base.get(field):
                            array_errors.append(f"Experience index {idx} field '{field}' mismatch: '{exp_target.get(field)}' vs '{exp_base.get(field)}'")
                    
                    # Verify experience links match
                    target_links = exp_target.get("links", [])
                    base_links = exp_base.get("links", [])
                    if len(target_links) != len(base_links):
                        array_errors.append(f"Experience index {idx} 'links' length mismatch: {len(target_links)} vs {len(base_links)}")
                    else:
                        for l_idx, (link_target, link_base) in enumerate(zip(target_links, base_links)):
                            if link_target.get("url") != link_base.get("url"):
                                array_errors.append(f"Experience index {idx} link {l_idx} 'url' mismatch: '{link_target.get('url')}' vs '{link_base.get('url')}'")
        
        if array_errors:
            print_failure(f"Metadata field value mismatches in '{f_name}':")
            for err in array_errors:
                print(f"  - {err}")
            overall_success = False
        else:
            print_success(f"Structure and array metadata match perfectly")
        print()
        
    if overall_success:
        print_success("Structure test completed successfully!")
        sys.exit(0)
    else:
        print_failure("Structure test failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
