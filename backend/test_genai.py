import sys

def trace_calls(frame, event, arg):
    if event == 'call':
        func_name = frame.f_code.co_name
        module_name = frame.f_globals.get('__name__', '')
        if 'google' in module_name or 'grpc' in module_name:
            print(f'Calling: {module_name}.{func_name}')
    return trace_calls

sys.settrace(trace_calls)

print('importing google.generativeai...')
import google.generativeai
print('done')
