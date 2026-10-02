import os
with open('/Users/ramji/Desktop/ms-word-clone/base_1236.html', 'rb') as f:
    text = f.read()
text = text.replace(b'\r\n', b'\n')
with open('/Users/ramji/Desktop/ms-word-clone/base_1236.html', 'wb') as f:
    f.write(text)
