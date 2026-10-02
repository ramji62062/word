import base64
with open('/tmp/restore_test/index.html', 'r') as f:
    text = f.read()

target = base64.b64decode('ICAgIC8qIFN0YXR1cyBCYXIgKi8KICAgIC5zdGF0dXMtYmFyIHsKICAgICAgaGVpZ2h0OiAyNHB4OwogICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1wcmltYXJ5KTsKICAgICAgY29sb3I6IHdoaXRlOwogICAgICBkaXNwbGF5OiBmbGV4OwogICAgICBhbGlnbi1pdGVtczogY2VudGVyOwogICAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47CiAgICAgIHBhZGRpbmc6IDAgMTZweDsKICAgICAgZm9udC1zaXplOiAxMXB4OwogICAgICB1c2VyLXNlbGVjdDogbm9uZTsKICAgICAgei1pbmRleDogMTA7CiAgICB9CiAgICAuc3RhdHVzLWxlZnQsIC5zdGF0dXMtcmlnaHQgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDE2cHg7IH0KICAgIC5zdGF0dXMtYnRuIHsKICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7CiAgICAgIGJvcmRlcjogbm9uZTsKICAgICAgY29sb3I6IHdoaXRlOwogICAgICBjdXJzb3I6IHBvaW50ZXI7CiAgICAgIGZvbnQtc2l6ZTogMTFweDsKICAgIH0KICAgIC5zdGF0dXMtYnRuOmhvdmVyIHsgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7IH0KICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5Pg==').decode('utf-8')

if target in text:
    print("Found exact match!")
else:
    print("Not found exactly.")
    # Try finding the first line
    lines = target.split('\n')
    if lines[0] in text:
        print("First line found!")
        idx = text.find(lines[0])
        print("Text snippet:")
        print(repr(text[idx:idx+100]))
        print("Target snippet:")
        print(repr(target[:100]))
