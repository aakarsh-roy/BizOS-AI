import sys
def trace_calls(frame, event, arg):
    if event == 'call':
        func_name = frame.f_code.co_name
        module_name = frame.f_globals.get('__name__', '')
        if 'cloudinary' in module_name or 'requests' in module_name or 'certifi' in module_name or 'urllib' in module_name:
            print(f'Calling: {module_name}.{func_name}')
    return trace_calls
sys.settrace(trace_calls)
print('importing cloudinary')
import cloudinary
print('done')
