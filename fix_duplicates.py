with open('/Users/ramji/Desktop/ms-word-clone/index.html', 'r') as f:
    text = f.read()

# I will find the first instance of 'let extractedQuestionsList = [];'
# and delete everything from there to the first 'window.editor = newPage;\n      }\n    }'
# Wait, actually it's easier to just rebuild it one last time cleanly.
