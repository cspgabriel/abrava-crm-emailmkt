import os
import re

# Character mapping for typical UTF-8 misinterpretations in Portuguese
# Mapping from mangled (UTF8-encoded as ISO8859) -> Correct characters
mangles = {
    'Ã¡': 'á',
    'Ã¢': 'â',
    'Ã£': 'ã',
    'Ã ': 'à',
    'Ã©': 'é',
    'Ãª': 'ê',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ã´': 'ô',
    'Ãµ': 'õ',
    'Ãº': 'ú',
    'Ã§': 'ç',
    'Ã': 'Á',
    'Ã‚': 'Â',
    'Ãƒ': 'Ã',
    'Ã€': 'À',
    'Ã‰': 'É',
    'Ã': 'Ê',
    'Ã': 'Í',
    'Ã“': 'Ó',
    'Ã”': 'Ô',
    'Ã•': 'Õ',
    'Ã': 'Ú',
    'Ã‡': 'Ç',
    'ðŸ”': '🔍',
    'ðŸ“±': '📱',
    'ðŸ“ˆ': '📈',
    'ðŸ”¥': '🔥',
    'âš¡': '⚡',
    'ðŸ‘¤': '👤',
    'âœ…': '✅',
    'ðŸ”„': '🔄',
    'ðŸ“¸': '📸',
    'â ³': '⏳',
    'âœ—': '❌',
    'âœ“': '✓',
    'âš ï¸': '⚠️',
    'â Œ': '❌',
    'ðŸ“¡': '📡',
    'â ¹ï¸': '⏳',
    'Ãª': 'ê',
}

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        try:
             with open(filepath, 'r', encoding='latin-1') as f:
                content = f.read()
        except:
            return

    new_content = content
    for mangled, fixed in mangles.items():
        new_content = new_content.replace(mangled, fixed)
    
    if content != new_content:
        print(f"Fixing {filepath}")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

def main():
    root_dir = r'c:\Users\cspga\Downloads\abravacom-main'
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if 'dist' in dirs:
            dirs.remove('dist')
            
        for file in files:
            if file.endswith(('.tsx', '.ts', '.html', '.js', '.json', '.css')):
                fix_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
