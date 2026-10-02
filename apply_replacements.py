import json
import base64

with open('/Users/ramji/Desktop/ms-word-clone/base_1236.html', 'r') as f:
    text = f.read()

with open('/Users/ramji/.gemini/antigravity/brain/16dffc85-9c62-4f26-9456-300bcfd7d2f8/.system_generated/logs/transcript_full.jsonl', 'r') as f:
    for line in f:
        data = json.loads(line)
        idx = data.get('step_index', 0)
        if 1237 <= idx <= 1800 and 'tool_calls' in data:
            for call in data['tool_calls']:
                if call['name'] == 'replace_file_content':
                    args = call['args']
                    if 'index.html' in args.get('TargetFile', ''):
                        target = args['TargetContent']
                        replacement = args['ReplacementContent']
                        # Normalize line endings
                        target_norm = target.replace('\r\n', '\n')
                        text_norm = text.replace('\r\n', '\n')
                        
                        if target_norm in text_norm:
                            text = text_norm.replace(target_norm, replacement.replace('\r\n', '\n'), 1)
                        else:
                            print(f"Target not found at step {idx}")
                            
with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'w') as f:
    f.write(text)
print("Applied all replacements!")
