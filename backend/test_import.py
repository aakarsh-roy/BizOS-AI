import sys
import threading
import time

def trace_calls(frame, event, arg):
    if event == 'call':
        func_name = frame.f_code.co_name
        module_name = frame.f_globals.get('__name__', '')
        if "app." in module_name:
            print(f"Calling: {module_name}.{func_name}")
    return trace_calls

sys.settrace(trace_calls)

print("Importing app.main...")
import app.main
print("Imported successfully!")
