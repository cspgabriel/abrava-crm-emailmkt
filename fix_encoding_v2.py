import os

# Ultra-aggressive mapping
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
    'Ã ': 'Á',
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
    'âš ï¸': '⚠️',
    'â Œ': '❌',
    'ðŸ“¡': '📡',
    'â ¹ï¸': '⏳',
    'Ã¢': 'â',
    'Ãª': 'ê',
    'Ã®': 'î',
    'Ã´': 'ô',
    'Ã»': 'û',
    'Ã€': 'À',
}

def fix_file(filepath):
    try:
        with open(filepath, 'rb') as f:
            raw = f.read()
        
        # Try different decodings to get the text
        content = None
        for enc in ['utf-8', 'latin-1', 'cp1252']:
            try:
                content = raw.decode(enc)
                break
            except:
                continue
        
        if content is None:
            return

        new_content = content
        for mangled, fixed in mangles.items():
            new_content = new_content.replace(mangled, fixed)
        
        if content != new_content:
            print(f"Fixed matching: {filepath}")
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")

def main():
    root_dir = r'.\\' # Start from CWD
    for root, dirs, files in os.walk(root_dir):
        if any(x in root for x in ['node_modules', '.git', 'dist', '.gemini']):
            continue
            
        for file in files:
            if file.endswith(('.tsx', '.ts', '.html', '.js', '.json', '.css')):
                fix_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
