#!/usr/bin/env python3
import os
import subprocess
import sys

# Get the current directory of this script (tests/)
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))

def print_banner():
    print("==================================================")
    print("      Portfolio Comprehensive Test Orchestrator   ")
    print("==================================================")

def run_test_file(filename):
    filepath = os.path.join(TESTS_DIR, filename)
    print(f"\n🚀 Running test module: {filename}...\n")
    
    try:
        # Run and stream output directly to terminal
        result = subprocess.run([sys.executable, filepath], check=False)
        return result.returncode == 0
    except Exception as e:
        print(f"\033[91m✘ Failed to execute {filename}: {e}\033[0m")
        return False

def main():
    print_banner()
    
    test_files = [
        "test_structure.py",
        "test_assets.py",
        "test_links.py"
    ]
    
    results = {}
    
    for f in test_files:
        success = run_test_file(f)
        results[f] = success
        
    print("\n==================================================")
    print("                 Test Summary                     ")
    print("==================================================")
    
    all_passed = True
    for f, passed in results.items():
        status_str = "\033[92mPASSED\033[0m" if passed else "\033[91mFAILED\033[0m"
        print(f" - {f:<20} : {status_str}")
        if not passed:
            all_passed = False
            
    print("==================================================")
    if all_passed:
        print("\033[92m✔ All test suites passed successfully!\033[0m")
        sys.exit(0)
    else:
        print("\033[91m✘ Some test suites failed. Review the logs above.\033[0m")
        sys.exit(1)

if __name__ == "__main__":
    main()
