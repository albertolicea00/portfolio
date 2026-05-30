#!/usr/bin/env python3
import os
import json
import re
import sys
import time

# Get the root directory of the repository
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I18N_DIR = os.path.join(ROOT_DIR, "assets", "i18n")

# Try to import deep-translator, with friendly diagnostic help if not installed
try:
    from deep_translator import GoogleTranslator, MyMemoryTranslator
    DEEP_TRANSLATOR_AVAILABLE = True
except ImportError:
    DEEP_TRANSLATOR_AVAILABLE = False

def print_banner():
    print("==================================================")
    print("      Portfolio Semantic Translation Validator    ")
    print("==================================================\n")

# Common proper nouns, technical tags, dates, and brand names that are expected
# to be identical across all translations.
EXCEPTIONS = {
    "Svelte", "Node.js", "CSS", "Astro", "TypeScript", "Tailwind CSS", "Swift", "iOS", "Xcode",
    "HTML5", "Alpine.js", "JavaScript", "Extension", "Present", "PinkzebraHome", "Ladetec",
    "TOWIT Houston", "Wateke Soluciones", "Wateke Travel", "Universidad de Camagüey",
    "BettaHVAC Services", "Las Locuras de Miguelín", "Kristoff Landing Page", "Banca Remota — Cuba",
    "Mivio Ecosystem", "Hide & Seek — Block Media Extension", "Wateke Soluciones Tecnológicas",
    "Wateke Travel", "PinkzebraHome", "Ladetec", "TOWIT Houston", "Universidad de Camagüey",
    "albertolicea00", "Henry Cruz", "Google", "Vercel", "GitHub", "Jellyfin", "Plex", "SMB", "WebDAV",
    "Manifest V3", "MutationObserver", "AJAX", "Firefox", "Chrome Web Store",
    "Name", "Email", "Message", "Apps", "Contact", "Home"
}

def is_valid_duplicate(val):
    """Determines if a duplicate string is acceptable (proper nouns, tech, numbers, etc.)."""
    if not isinstance(val, str):
        return True
    
    val_stripped = val.strip()
    if not val_stripped:
        return True
        
    # Emojis only, or common tech/brands
    if val_stripped in EXCEPTIONS:
        return True
        
    # Is it a URL?
    if val_stripped.startswith("http://") or val_stripped.startswith("https://"):
        return True
        
    # Is it a local file path or asset?
    if val_stripped.endswith((".webp", ".svg", ".png", ".jpg", ".pdf")):
        return True
        
    # Is it an email address?
    if "@" in val_stripped and "." in val_stripped:
        return True
        
    # Is it just numbers and punctuation (e.g. dates, id numbers, etc.)?
    if re.match(r'^[0-9\s\-\.,\/#@\(\)\:\!\?\+\*&%•\w]*$', val_stripped):
        # If it contains alphabetical characters, check if it looks like an English phrase
        if any(c.isalpha() for c in val_stripped):
            # If the only letters form a known exception, it's valid
            words = re.findall(r'\b\w+\b', val_stripped)
            if all(w in EXCEPTIONS or w.lower() in [e.lower() for e in EXCEPTIONS] or w.isdigit() for w in words):
                return True
        else:
            return True
            
    return False

class SmartTranslator:
    def __init__(self, source='en', target='es'):
        self.source = source
        self.target = target
        
        # Map specific codes if needed
        google_source = source
        google_target = 'zh-CN' if target == 'zh' else target
        
        mymemory_source = 'en-US' if source == 'en' else source
        mymemory_target = 'zh-CN' if target == 'zh' else target
        if target == 'es':
            mymemory_target = 'es-ES'
        elif target == 'de':
            mymemory_target = 'de-DE'
        elif target == 'fr':
            mymemory_target = 'fr-FR'
        elif target == 'it':
            mymemory_target = 'it-IT'
        elif target == 'pt':
            mymemory_target = 'pt-PT'
        elif target == 'ru':
            mymemory_target = 'ru-RU'
        elif target == 'ja':
            mymemory_target = 'ja-JP'
        elif target == 'ko':
            mymemory_target = 'ko-KR'
            
        self.translators = [
            GoogleTranslator(source=google_source, target=google_target),
            MyMemoryTranslator(source=mymemory_source, target=mymemory_target)
        ]
        self.current_index = 0

    def translate(self, text):
        """Attempts translation with deep-translator fallback list."""
        for i in range(len(self.translators)):
            idx = (self.current_index + i) % len(self.translators)
            try:
                result = self.translators[idx].translate(text)
                if result and result.strip() != text.strip():
                    self.current_index = idx
                    return result
            except Exception as e:
                continue
        return None

def find_untranslated_keys(base, target, path=""):
    """Recursively compares base and target, returning key paths of untranslated items."""
    untranslated = []
    
    if isinstance(base, dict) and isinstance(target, dict):
        for k in base:
            if k in target:
                curr_path = f"{path}.{k}" if path else k
                untranslated.extend(find_untranslated_keys(base[k], target[k], curr_path))
    elif isinstance(base, list) and isinstance(target, list):
        # Elements are matched by order
        for idx, (b_item, t_item) in enumerate(zip(base, target)):
            # Formulate friendly array key path
            item_desc = f"index {idx}"
            if isinstance(b_item, dict):
                if "title" in b_item:
                    item_desc = f"'{b_item['title']}'"
                elif "id" in b_item:
                    item_desc = f"id {b_item['id']}"
            curr_path = f"{path}[{item_desc}]"
            untranslated.extend(find_untranslated_keys(b_item, t_item, curr_path))
    elif isinstance(base, str) and isinstance(target, str):
        # Compare strings
        if base.strip() == target.strip() and not is_valid_duplicate(base):
            untranslated.append((path, base))
            
    return untranslated

def update_translation_value(data, path_str, new_value):
    """Mutates the data dictionary/list structure to set new_value at path_str."""
    # Parse path_str, handling both dot notation and index notations like '[index 0]' or '['BettaHVAC Services']'
    # Simple parser: extract tokens
    parts = []
    # Match dots or bracket notations
    scanner = re.finditer(r'([^.\[]+)|\[([^\]]+)\]', path_str)
    for match in scanner:
        dot_part, bracket_part = match.groups()
        if dot_part:
            parts.append(dot_part)
        elif bracket_part:
            parts.append(bracket_part)
            
    # Traversal
    curr = data
    for i, part in enumerate(parts[:-1]):
        if isinstance(curr, dict):
            curr = curr[part]
        elif isinstance(curr, list):
            # We have a friendly description like "index 0" or "'BettaHVAC Services'"
            # Parse out index
            idx_match = re.match(r'index (\d+)', part)
            if idx_match:
                curr = curr[int(idx_match.group(1))]
            else:
                # Find matching item by title or id
                found = False
                for item in curr:
                    if isinstance(item, dict):
                        if "title" in item and f"'{item['title']}'" == part:
                            curr = item
                            found = True
                            break
                        elif "id" in item and f"id {item['id']}" == part:
                            curr = item
                            found = True
                            break
                if not found:
                    raise KeyError(f"Could not traverse array path element: {part}")
                    
    # Set final value
    last_part = parts[-1]
    if isinstance(curr, dict):
        curr[last_part] = new_value
    elif isinstance(curr, list):
        idx_match = re.match(r'index (\d+)', last_part)
        if idx_match:
            curr[int(idx_match.group(1))] = new_value
        else:
            raise KeyError("Final element of path in list must be index-based")

def main():
    print_banner()
    
    # 1. Verification of library presence
    if not DEEP_TRANSLATOR_AVAILABLE:
        print("\033[93m⚠ Optional dependency 'deep-translator' is not installed!\033[0m")
        print("To run semantic validation and enable interactive translation fixing, please run:")
        print("    \033[1mpip install deep-translator\033[0m\n")
        print("Skipping active translation. Performing duplicate detection only (mock-translation).\n")
        
    # 2. Check for "--fix" flag
    fix_mode = "--fix" in sys.argv
    if not fix_mode:
        print("Tip: Run this script with the \033[1m--fix\033[0m flag to automatically translate")
        print("     and repair any untranslated fields using Google & MyMemory translation fallback.\n")
        
    en_path = os.path.join(I18N_DIR, "en.json")
    if not os.path.exists(en_path):
        print(f"\033[91mError: Baseline en.json not found at {en_path}!\033[0m")
        sys.exit(1)
        
    with open(en_path, "r", encoding="utf-8") as f:
        en_data = json.load(f)
        
    target_files = [f for f in os.listdir(I18N_DIR) if f.endswith(".json") and f not in ["en.json", "en.cav.json", "es.cav.json"]]
    target_files.sort()
    
    all_clean = True
    
    for f_name in target_files:
        lang_code = f_name.split(".")[0]
        f_path = os.path.join(I18N_DIR, f_name)
        
        with open(f_path, "r", encoding="utf-8") as f:
            target_data = json.load(f)
            
        print(f"Checking translations in \033[1m{f_name}\033[0m (Language: {lang_code})...")
        untranslated = find_untranslated_keys(en_data, target_data)
        
        if not untranslated:
            print(f"  \033[92m✔ 100% Translated! No anomalies found.\033[0m\n")
            continue
            
        all_clean = False
        print(f"  \033[91m⚠ Found {len(untranslated)} untranslated fields:\033[0m")
        for path, english_val in untranslated:
            val_preview = english_val[:40] + "..." if len(english_val) > 40 else english_val
            print(f"    - {path}: \"{val_preview}\"")
            
        if fix_mode and DEEP_TRANSLATOR_AVAILABLE:
            print(f"\n  ⚙ Auto-translating {len(untranslated)} fields for {f_name}...")
            translator = SmartTranslator(source='en', target=lang_code)
            
            repaired_count = 0
            for idx, (path, english_val) in enumerate(untranslated, 1):
                print(f"    [{idx}/{len(untranslated)}] Translating: \"{english_val[:30]}...\" -> ", end="", flush=True)
                
                # Perform translation with fallback
                translation = translator.translate(english_val)
                
                if translation:
                    # Update local data structure
                    update_translation_value(target_data, path, translation)
                    print(f"\033[92m\"{translation[:30]}...\"\033[0m")
                    repaired_count += 1
                else:
                    print("\033[91mFAILED (No translators succeeded)\033[0m")
                    
                # Pause to respect API rate limits (1 second)
                time.sleep(1.0)
                
            if repaired_count > 0:
                # Save changes back to target file
                with open(f_path, "w", encoding="utf-8") as f:
                    json.dump(target_data, f, ensure_ascii=False, indent=4)
                print(f"  \033[92m✔ Successfully updated {repaired_count} translations in {f_name}!\033[0m\n")
            else:
                print(f"  \033[91m⚠ No fields were successfully translated in {f_name}.\033[0m\n")
        else:
            print()
            
    if all_clean:
        print("\033[92m✔ All standard multilingual translation files are fully translated!\033[0m")
        sys.exit(0)
    else:
        if not fix_mode:
            print("\033[91mTranslation checking complete. Anomalies were found.\033[0m")
            print("Please fix the fields listed above or run \033[1mpython3 scripts/validate_translations.py --fix\033[0m to auto-resolve.")
            sys.exit(1)
        else:
            print("\033[92mAuto-fix phase complete. Run script again without --fix to verify.\033[0m")
            sys.exit(0)

if __name__ == "__main__":
    main()
